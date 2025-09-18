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

export async function createAgent(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const agentName = this.getNodeParameter('agentName', i) as string;
	const agentDescription = this.getNodeParameter('agentDescription', i) as string;
	const datastoreName = this.getNodeParameter('datastoreName', i) as string;
	const datastoreIdsStr = this.getNodeParameter('datastoreIds', i, '') as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string; // if empty, use all binaries
	const documentMetadata = this.getNodeParameter('documentMetadata', i, '') as string;
	const systemPrompt = this.getNodeParameter('systemPrompt', i, '') as string;
	const noRetrievalSystemPrompt = this.getNodeParameter('noRetrievalSystemPrompt', i, '') as string;
	const multiturnSystemPrompt = this.getNodeParameter('multiturnSystemPrompt', i, '') as string;
	const filterPrompt = this.getNodeParameter('filterPrompt', i, '') as string;
	const suggestedQueriesStr = this.getNodeParameter('suggestedQueries', i, '') as string;
	const agentConfigsStr = this.getNodeParameter('agentConfigs', i, '') as string;

	if (!agentName) {
		throw new NodeOperationError(this.getNode(), 'Agent name is required');
	}

	// Parse optional arrays/objects
	const providedDatastoreIds = (datastoreIdsStr || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	// Validate datastore ID format (should be a UUID)
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	for (const datastoreId of providedDatastoreIds) {
		if (!uuidRegex.test(datastoreId)) {
			throw new NodeOperationError(this.getNode(), `Invalid datastore ID format: ${datastoreId}. Expected a valid UUID.`);
		}
	}
	const suggestedQueries = (suggestedQueriesStr || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	let parsedAgentConfigs: any | undefined;
	if (agentConfigsStr) {
		try {
			parsedAgentConfigs = JSON.parse(agentConfigsStr);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Agent Configs must be valid JSON');
		}
	}

	// 1) Resolve datastore IDs: either provided or create new if name given
	let datastoreIds: string[] = [];
	let createdDatastoreId: string | undefined;
	if (providedDatastoreIds.length > 0 && datastoreName) {
		throw new NodeOperationError(
			this.getNode(),
			'Provide either Datastore IDs or Datastore Name (to create one), not both',
		);
	}
	if (providedDatastoreIds.length > 0) {
		datastoreIds = providedDatastoreIds;
	} else if (datastoreName) {
		const datastoreResp = await apiRequest.call(this, {
			method: 'POST',
			uri: '/v1/datastores',
			body: { name: datastoreName },
		});
		const datastoreId = datastoreResp?.id || datastoreResp?.data?.id;
		if (!datastoreId) {
			throw new NodeOperationError(this.getNode(), 'Failed to create datastore - no datastore ID returned from API');
		}
		datastoreIds = [datastoreId];
		createdDatastoreId = datastoreId;
	} else {
		throw new NodeOperationError(
			this.getNode(),
			'Either Datastore IDs or Datastore Name is required to proceed',
		);
	}

	// 2) Upload documents from all items and binaries (to the first datastore)
	const items = this.getInputData();
	const uploaded: Array<{ itemIndex: number; property: string; documentId: string | null; fileName?: string; error?: string }>= [];

	let parsedMetadata: any | undefined;
	if (documentMetadata) {
		try {
			parsedMetadata = JSON.parse(documentMetadata);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Document Metadata must be valid JSON');
		}
	}

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
				if (parsedMetadata) {
					formData.metadata = JSON.stringify(parsedMetadata);
				}

				const ingestResp = await apiRequest.call(this, {
					method: 'POST',
					uri: `/v1/datastores/${datastoreIds[0]}/documents`,
					formData,
					headers: {},
				});

				const documentId = ingestResp?.id || ingestResp?.data?.id || null;

				if (!documentId) {
					uploaded.push({
						itemIndex,
						property: key,
						documentId: null,
						fileName: fileName,
						error: 'No document ID returned from API'
					});
					continue;
				}

				uploaded.push({ itemIndex, property: key, documentId, fileName: fileName });
			} catch (err: any) {
				uploaded.push({ itemIndex, property: key, documentId: null, error: err?.message });
			}
		}
	}

	// 3) Create agent
	const agentResp = await apiRequest.call(this, {
		method: 'POST',
		uri: '/v1/agents',
		body: {
			name: agentName,
			description: agentDescription,
			datastore_ids: datastoreIds,
			...(systemPrompt && { system_prompt: systemPrompt }),
			...(noRetrievalSystemPrompt && { no_retrieval_system_prompt: noRetrievalSystemPrompt }),
			...(multiturnSystemPrompt && { multiturn_system_prompt: multiturnSystemPrompt }),
			...(filterPrompt && { filter_prompt: filterPrompt }),
			...(suggestedQueries.length > 0 && { suggested_queries: suggestedQueries }),
			...(parsedAgentConfigs && { agent_configs: parsedAgentConfigs }),
		},
	});

	const agentId = agentResp?.id || agentResp?.data?.id;
	if (!agentId) {
		throw new NodeOperationError(this.getNode(), 'Failed to create agent - no agent ID returned from API');
	}

	return {
		json: {
			agentId,
			datastoreIds,
			createdDatastoreId,
			uploaded,
		},
	};
}
