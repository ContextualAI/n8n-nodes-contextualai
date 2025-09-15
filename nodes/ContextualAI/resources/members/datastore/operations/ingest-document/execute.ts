import { IBinaryData, IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError } from 'n8n-workflow';

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


export async function ingestDocument(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const datastoreId = this.getNodeParameter('datastoreId', i) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
	const metadataStr = this.getNodeParameter('metadata', i, '') as string;

	if (!datastoreId) {
		throw new NodeOperationError(this.getNode(), 'Datastore ID is required');
	}

	// Validate datastore ID format (should be a UUID)
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(datastoreId)) {
		throw new NodeOperationError(this.getNode(), `Invalid datastore ID format: ${datastoreId}. Expected a valid UUID.`);
	}

	// Validate metadata JSON format
	if (metadataStr) {
		try {
			JSON.parse(metadataStr);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Metadata must be valid JSON');
		}
	}

	// Get input data and process binaries
	const items = this.getInputData();
	const uploaded: Array<{
		itemIndex: number;
		property: string;
		documentId: string | null;
		fileName?: string;
		error?: string;
	}> = [];

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		const item = items[itemIndex];
		const binary = item.binary || {};
		const binaryKeys = Object.keys(binary);

		const requestedKeys = (binaryPropertyName || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		const keysToUpload = requestedKeys.length > 0
			? binaryKeys.filter((k) => requestedKeys.includes(k))
			: binaryKeys;

		for (const key of keysToUpload) {
			try {
				// Assert and load buffer
				const binMeta = this.helpers.assertBinaryData(itemIndex, key) as IBinaryData;
				const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, key);

				// Validate file extension
				const fileName = binMeta.fileName || 'document.pdf';
				const fileExtension = fileName.toLowerCase().split('.').pop();
				const supportedExtensions = ['pdf', 'html', 'htm', 'mhtml', 'doc', 'docx', 'ppt', 'pptx'];

				if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
					uploaded.push({
						itemIndex,
						property: key,
						documentId: null,
						fileName: fileName,
						error: `Unsupported file type: ${fileExtension}. Supported formats: ${supportedExtensions.join(', ')}`
					});
					continue;
				}

				const formData: any = {
					file: {
						value: buffer,
						options: {
							filename: fileName,
							contentType: binMeta.mimeType || 'application/pdf',
						},
					},
				};
				if (metadataStr) {
					formData.metadata = metadataStr;
				}

				const apiUrl = `/v1/datastores/${datastoreId}/documents`;

				const ingestResp = await apiRequest.call(this, {
					method: 'POST',
					uri: apiUrl,
					formData,
					headers: {},
				});

				const documentId = ingestResp?.id || ingestResp?.data?.id || null;

				if (!documentId) {
					uploaded.push({
						itemIndex,
						property: key,
						documentId: null,
						fileName: binMeta.fileName || undefined,
						error: 'No document ID returned from API'
					});
					continue;
				}

				uploaded.push({
					itemIndex,
					property: key,
					documentId,
					fileName: binMeta.fileName || undefined
				});
			} catch (err: any) {
				uploaded.push({ itemIndex, property: key, documentId: null, error: err?.message });
			}
		}
	}

	return {
		json: {
			datastoreId,
			uploaded,
		},
	};
}
