import { IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError } from 'n8n-workflow';

async function apiRequest(this: IExecuteFunctions, options: any) {
    const { method, uri, qs, headers = {} } = options;
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

    if (method === 'GET') delete (requestOptions as any).body;

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

export async function parseResult(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
    const jobId = this.getNodeParameter('jobId', i) as string;
    const outputTypesRaw = (this.getNodeParameter('outputTypes', i) as string) || '';

    if (!jobId || jobId === 'empty-job-id') {
        throw new NodeOperationError(this.getNode(), 'Job ID is required');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
        throw new NodeOperationError(this.getNode(), `Invalid job ID format: ${jobId}. Expected a valid UUID.`);
    }

    // Build query params for output_types (comma-separated string to array)
    let qs: Record<string, any> | undefined;
    if (outputTypesRaw) {
        const allowed = new Set(['markdown-document', 'markdown-per-page', 'blocks-per-page']);
        const outputTypes = outputTypesRaw
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const invalid = outputTypes.filter(v => !allowed.has(v));
        if (invalid.length > 0) {
            throw new NodeOperationError(this.getNode(), `Invalid output types: ${invalid.join(', ')}.`);
        }

        if (outputTypes.length > 0) {
            qs = { output_types: outputTypes };
        }
    }

    try {
        const resp = await apiRequest.call(this, {
            method: 'GET',
            uri: `/v1/parse/jobs/${jobId}/results`,
            qs,
        });

        let parsedResp: any = resp;
        if (typeof resp === 'string') {
            try {
                parsedResp = JSON.parse(resp);
            } catch (e) {
                throw new NodeOperationError(this.getNode(), 'Failed to parse API response as JSON');
            }
        }

        return {
            json: {
                jobId,
                ...parsedResp,
            },
            pairedItem: { item: i },
        };
    } catch (error: any) {
        throw new NodeApiError(this.getNode(), error, {
            message: `Failed to get parse result: ${error.message}`,
        });
    }
}


