import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export const name = 'Query agent';

export const option: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Query a Contextual AI agent',
	action: 'Query agent',
};

export const properties: INodeProperties[] = [
	{
		displayName: 'Agent ID',
		name: 'agentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'e.g. What is machine learning?',
		required: true,
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
	},
	{
		displayName: 'Retrievals Only',
		name: 'retrievalsOnly',
		type: 'boolean',
		default: false,
		description: 'Whether to fetch retrievals and skip generation',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
	},
	{
		displayName: 'Include Retrieval Content Text',
		name: 'includeRetrievalContentText',
		type: 'boolean',
		default: false,
		description: 'Whether to include the text of retrieved contents in the response',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
	},
	{
		displayName: 'Stream Response',
		name: 'stream',
		type: 'boolean',
		default: false,
		description: 'Whether to receive a streamed response',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
	},
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		description: 'Optional conversation ID to continue an existing conversation. If provided, all messages in the conversation history will be ignored.',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
	},
	{
		displayName: 'LLM Model ID',
		name: 'llmModelId',
		type: 'string',
		default: '',
		description: 'Model ID of the specific fine-tuned or aligned LLM model to use. Defaults to base model if not specified.',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
	},
	{
		displayName: 'Conversation History (JSON String)',
		name: 'conversationHistory',
		type: 'string',
		default: '',
		description: 'JSON string containing conversation history. Format: [{"role": "user", "content": "message"}, {"role": "assistant", "content": "response"}]. Last message must be from user.',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
		typeOptions: {
			rows: 4,
		},
	},
	{
		displayName: 'Structured Output (JSON String)',
		name: 'structuredOutput',
		type: 'string',
		default: '',
		description: 'JSON string defining custom output structure format. Example: {"type": "JSON", "json_schema": {}}.',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
		typeOptions: {
			rows: 3,
		},
	},
	{
		displayName: 'Document Filters (JSON String)',
		name: 'documentFilters',
		type: 'string',
		default: '',
		description: 'JSON string defining custom metadata filters. Example: {"filters": [{"field": "status", "operator": "equals", "value": "active"}], "operator": "AND"}.',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
		typeOptions: {
			rows: 4,
		},
	},
	{
		displayName: 'Override Configuration (JSON String)',
		name: 'overrideConfiguration',
		type: 'string',
		default: '',
		description: 'JSON string to modify select configuration parameters for the agent during response generation',
		displayOptions: { show: { resource: ['Query'], operation: [name] } },
		typeOptions: {
			rows: 4,
		},
	},
];
