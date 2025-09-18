import { IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError } from 'n8n-workflow';

async function apiRequest(this: IExecuteFunctions, options: any) {
	const { method, uri, qs, body, json = true, headers = {}, formData } = options;
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

	if (formData) {
		requestOptions.formData = formData;
		requestOptions.json = true;
	} else if (body && method !== 'GET') {
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

export async function getDocumentMetadata(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const datastoreId = this.getNodeParameter('datastoreId', i) as string;
	const documentId = this.getNodeParameter('documentId', i) as string;

	if (!datastoreId) {
		throw new NodeOperationError(this.getNode(), 'Datastore ID is required');
	}

	if (!documentId) {
		throw new NodeOperationError(this.getNode(), 'Document ID is required');
	}

	// Validate datastore ID format (should be a UUID)
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(datastoreId)) {
		throw new NodeOperationError(this.getNode(), `Invalid datastore ID format: ${datastoreId}. Expected a valid UUID.`);
	}

	// Validate document ID format (should be a UUID)
	if (!uuidRegex.test(documentId)) {
		throw new NodeOperationError(this.getNode(), `Invalid document ID format: ${documentId}. Expected a valid UUID.`);
	}

	try {
		const metadataResp = await apiRequest.call(this, {
			method: 'GET',
			uri: `/v1/datastores/${datastoreId}/documents/${documentId}/metadata`,
		});

		return {
			json: {
				datastoreId,
				documentId,
				metadata: metadataResp,
			},
		};
	} catch (error: any) {
		throw new NodeApiError(this.getNode(), error, {
			message: `Failed to get document metadata: ${error.message}`,
		});
	}
}
