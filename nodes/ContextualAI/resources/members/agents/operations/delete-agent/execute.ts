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
		return await this.helpers.httpRequestWithAuthentication.call(this, authenticationMethod, requestOptions);
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

export async function deleteAgent(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const agentId = this.getNodeParameter('agentId', i) as string;

	if (!agentId) {
		throw new NodeOperationError(this.getNode(), 'Agent ID is required');
	}

	// Validate agent ID format (should be a UUID)
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(agentId)) {
		throw new NodeOperationError(this.getNode(), `Invalid agent ID format: ${agentId}. Expected a valid UUID.`);
	}

	await apiRequest.call(this, {
		method: 'DELETE',
		uri: `/v1/agents/${agentId}`,
	});

	// Transform empty response from API to success response for n8n
	const successResponse = {
		data: {
			success: true,
			message: 'Agent deleted successfully',
		},
	};

	return {
		json: successResponse,
		pairedItem: { item: i },
	};
}
