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
		return await this.helpers.httpRequestWithAuthentication.call(this, authenticationMethod, requestOptions);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function rerankDocuments(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const query = this.getNodeParameter('query', i) as string;
	const documentsParam = this.getNodeParameter('documents', i);
	const instruction = this.getNodeParameter('instruction', i) as string;
	const model = this.getNodeParameter('model', i) as string;
	const topN = this.getNodeParameter('topN', i) as number;
	const metadataParam = this.getNodeParameter('metadata', i);

	let documents: string[];
	if (Array.isArray(documentsParam)) {
		documents = documentsParam.map(doc => String(doc).trim()).filter(Boolean);
	} else if (typeof documentsParam === 'string') {
		documents = documentsParam.split(',').map((s) => s.trim()).filter(Boolean);
	} else {
		throw new Error('Documents parameter must be a string or array');
	}

	if (documents.length === 0) {
		throw new Error('At least one document is required');
	}

	let metadata: string[] | undefined;
	if (metadataParam) {
		if (Array.isArray(metadataParam)) {
			metadata = metadataParam.map(meta => String(meta).trim()).filter(Boolean);
		} else if (typeof metadataParam === 'string') {
			metadata = metadataParam.split(',').map((s) => s.trim()).filter(Boolean);
		}
	}

	if (metadata && metadata.length > 0 && metadata.length !== documents.length) {
		throw new Error(`Metadata count (${metadata.length}) must match documents count (${documents.length})`);
	}

	const body: any = { query, documents, model };
	if (instruction) body.instruction = instruction;
	if (topN && topN > 0) body.top_n = topN;
	if (metadata && metadata.length > 0) body.metadata = metadata;

	const resp = await apiRequest.call(this, {
		method: 'POST',
		uri: '/v1/rerank',
		body,
	});

	return {
		json: resp,
		pairedItem: { item: i },
	};
}
