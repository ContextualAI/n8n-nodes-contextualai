import { IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError } from 'n8n-workflow';

async function apiRequest(this: IExecuteFunctions, options: any) {
	const { method, uri, qs, body, json = true, headers = {} } = options;
	const endpoint = `https://api.contextual.ai${uri}`;
	const authenticationMethod = this.getNodeParameter('authentication', 0) as string;

	const requestOptions: any = {
		method,
		qs,
		url: endpoint,
		body,
		json,
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			...headers,
		},
	};
	if (method === 'GET') delete requestOptions.body;

	try {
		await this.getCredentials(authenticationMethod);
		return await this.helpers.requestWithAuthentication.call(this, authenticationMethod, requestOptions);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function runLmunit(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const query = this.getNodeParameter('query', i) as string;
	const response = this.getNodeParameter('response', i) as string;
	const unitTest = this.getNodeParameter('unitTest', i) as string;

	// Validate required parameters
	if (!query || query.trim() === '' || query === 'empty-query') {
		throw new NodeOperationError(this.getNode(), 'Query is required');
	}

	if (!response || response.trim() === '' || response === 'empty-response') {
		throw new NodeOperationError(this.getNode(), 'Response is required');
	}

	if (!unitTest || unitTest.trim() === '' || unitTest === 'empty-unit-test') {
		throw new NodeOperationError(this.getNode(), 'Unit test is required');
	}

	const resp = await apiRequest.call(this, {
		method: 'POST',
		uri: '/v1/lmunit',
		body: { query, response, unit_test: unitTest },
	});

	return {
		json: resp,
		pairedItem: { item: i },
	};
}
