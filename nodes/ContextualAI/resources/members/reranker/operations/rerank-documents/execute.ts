import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';

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

export async function rerankDocuments(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const query = this.getNodeParameter('query', i) as string;
	const documentsStr = this.getNodeParameter('documents', i) as string;
	const instruction = this.getNodeParameter('instruction', i) as string;
	const model = this.getNodeParameter('model', i) as string;
	const topN = this.getNodeParameter('topN', i) as number;
	const metadataStr = this.getNodeParameter('metadata', i) as string;

	const documents = documentsStr.split(',').map((s) => s.trim()).filter(Boolean);
	const metadata = metadataStr ? metadataStr.split(',').map((s) => s.trim()) : undefined;

	const body: any = { query, documents, model };
	if (instruction) body.instruction = instruction;
	if (topN && topN > 0) body.top_n = topN;
	if (metadata && metadata.length > 0) body.metadata = metadata;

	const resp = await apiRequest.call(this, {
		method: 'POST',
		uri: '/v1/rerank',
		body,
	});

	return { json: resp };
}
