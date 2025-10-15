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

export async function listAgents(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const limit = this.getNodeParameter('limit', i) as number;
	const cursor = this.getNodeParameter('cursor', i, '') as string;

	// Validate limit parameter
	if (limit < 1 || limit > 1000) {
		throw new NodeOperationError(this.getNode(), 'Limit must be between 1 and 1000');
	}

	const qs: Record<string, any> = {
		limit,
	};
	if (cursor) {
		qs.cursor = cursor;
	}

	const resp = await apiRequest.call(this, {
		method: 'GET',
		uri: '/v1/agents',
		qs,
	});

	let parsedResp = resp;
	if (typeof resp === 'string') {
		try {
			parsedResp = JSON.parse(resp);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Failed to parse API response as JSON');
		}
	}

	return {
		json: parsedResp,
		pairedItem: { item: i },
	};
}
