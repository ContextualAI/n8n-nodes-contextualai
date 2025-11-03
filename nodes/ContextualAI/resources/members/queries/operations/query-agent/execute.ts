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

export async function queryAgent(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const agentId = this.getNodeParameter('agentId', i) as string;
	const query = this.getNodeParameter('query', i) as string;
	const retrievalsOnly = this.getNodeParameter('retrievalsOnly', i) as boolean;
	const includeRetrievalContentText = this.getNodeParameter('includeRetrievalContentText', i) as boolean;
	const stream = this.getNodeParameter('stream', i) as boolean;
	const conversationId = this.getNodeParameter('conversationId', i, '') as string;
	const llmModelId = this.getNodeParameter('llmModelId', i, '') as string;
	const conversationHistoryStr = this.getNodeParameter('conversationHistory', i, '') as string;
	const structuredOutputStr = this.getNodeParameter('structuredOutput', i, '') as string;
	const documentFiltersStr = this.getNodeParameter('documentFilters', i, '') as string;
	const overrideConfigurationStr = this.getNodeParameter('overrideConfiguration', i, '') as string;

	if (!agentId || agentId === 'empty-agent') {
		throw new NodeOperationError(this.getNode(), 'Agent ID is required');
	}

	if (!query || query === 'empty-query') {
		throw new NodeOperationError(this.getNode(), 'Query is required');
	}

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(agentId)) {
		throw new NodeOperationError(this.getNode(), `Invalid agent ID format: ${agentId}. Expected a valid UUID.`);
	}

	if (conversationId && !uuidRegex.test(conversationId)) {
		throw new NodeOperationError(this.getNode(), `Invalid conversation ID format: ${conversationId}. Expected a valid UUID.`);
	}

	// Parse JSON parameters
	let conversationHistory: any[] | undefined;
	if (conversationHistoryStr) {
		try {
			conversationHistory = JSON.parse(conversationHistoryStr);
			if (!Array.isArray(conversationHistory)) {
				throw new Error('Conversation history must be an array');
			}
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Conversation History must be valid JSON array');
		}
	}

	let structuredOutput: any | undefined;
	if (structuredOutputStr) {
		try {
			structuredOutput = JSON.parse(structuredOutputStr);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Structured Output must be valid JSON');
		}
	}

	let documentFilters: any | undefined;
	if (documentFiltersStr) {
		try {
			documentFilters = JSON.parse(documentFiltersStr);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Document Filters must be valid JSON');
		}
	}

	let overrideConfiguration: any | undefined;
	if (overrideConfigurationStr) {
		try {
			overrideConfiguration = JSON.parse(overrideConfigurationStr);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Override Configuration must be valid JSON');
		}
	}

	// Build messages array
	let messages: any[] = [];
	if (conversationHistory && conversationHistory.length > 0) {
		messages = [...conversationHistory, { role: 'user', content: query }];
	} else {
		messages = [{ role: 'user', content: query }];
	}

	const qs: Record<string, any> = {};
	if (retrievalsOnly) qs.retrievals_only = true;
	if (includeRetrievalContentText) qs.include_retrieval_content_text = true;

	const body: any = {
		messages,
		...(stream && { stream }),
		...(conversationId && { conversation_id: conversationId }),
		...(llmModelId && { llm_model_id: llmModelId }),
		...(structuredOutput && { structured_output: structuredOutput }),
		...(documentFilters && { documents_filters: documentFilters }),
		...(overrideConfiguration && { override_configuration: overrideConfiguration }),
	};

	const resp = await apiRequest.call(this, {
		method: 'POST',
		uri: `/v1/agents/${agentId}/query`,
		qs,
		body,
	});

	return {
		json: resp,
		pairedItem: { item: i },
	};
}
