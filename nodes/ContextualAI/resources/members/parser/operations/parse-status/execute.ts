import { IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError } from 'n8n-workflow';

async function apiRequest(this: IExecuteFunctions, options: any) {
	const { method, uri, qs, body, json = true, headers = {} } = options;
	const endpoint = `https://api.contextual.ai${uri}`;
	const authenticationMethod = this.getNodeParameter('authentication', 0) as string;

	const requestOptions: any = {
		method,
		qs,
		url: endpoint,
		headers: {
			accept: 'application/json',
			...headers,
		},
	};

	if (body && method !== 'GET') {
		requestOptions.body = body;
		requestOptions.json = json;
	}

	if (method === 'GET') delete requestOptions.body;

	try {
		await this.getCredentials(authenticationMethod);
		return await this.helpers.requestWithAuthentication.call(this, authenticationMethod, requestOptions);
	} catch (error) {
		if ((error as any).response?.body) {
			throw new NodeApiError(this.getNode(), error as any, {
				message: (error as any).response.body,
				description: (error as any).message,
			});
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function parseStatus(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const jobId = this.getNodeParameter('jobId', i) as string;

	if (!jobId) {
		throw new NodeOperationError(this.getNode(), 'Job ID is required');
	}

	// Validate job ID format (should be a UUID)
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(jobId)) {
		throw new NodeOperationError(this.getNode(), `Invalid job ID format: ${jobId}. Expected a valid UUID.`);
	}

	try {
		const statusResp = await apiRequest.call(this, {
			method: 'GET',
			uri: `/v1/parse/jobs/${jobId}/status`,
		});

        // The API sometimes returns the JSON payload as a string so we need to parse it
        let parsedResp: any = statusResp;
        if (typeof statusResp === 'string') {
            try {
                parsedResp = JSON.parse(statusResp);
            } catch (e) {
                throw new NodeOperationError(this.getNode(), 'Failed to parse API response as JSON');
            }
        }

        return {
            json: {
                jobId,
                status: parsedResp?.status || parsedResp?.data?.status,
                ...parsedResp,
            },
        };
	} catch (error: any) {
		throw new NodeApiError(this.getNode(), error, {
			message: `Failed to get parse status: ${error.message}`,
		});
	}
}
