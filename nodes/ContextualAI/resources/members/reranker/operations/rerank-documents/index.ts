import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export const name = 'Rerank documents';

export const option: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Rerank documents against a query',
	action: 'Rerank documents',
};

export const properties: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['Reranker'], operation: [name] } },
	},
	{
		displayName: 'Documents',
		name: 'documents',
		type: 'string',
		default: '',
		description: 'Comma-separated list of document texts',
		required: true,
		displayOptions: { show: { resource: ['Reranker'], operation: [name] } },
	},
	{
		displayName: 'Instruction',
		name: 'instruction',
		type: 'string',
		default: '',
		description: 'Optional instruction for reranker',
		displayOptions: { show: { resource: ['Reranker'], operation: [name] } },
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		options: [
			{ name: 'ctxl-rerank-v2-instruct-multilingual', value: 'ctxl-rerank-v2-instruct-multilingual' },
			{ name: 'ctxl-rerank-v2-instruct-multilingual-mini', value: 'ctxl-rerank-v2-instruct-multilingual-mini' },
			{ name: 'ctxl-rerank-v1-instruct', value: 'ctxl-rerank-v1-instruct' },
		],
		default: 'ctxl-rerank-v2-instruct-multilingual',
		displayOptions: { show: { resource: ['Reranker'], operation: [name] } },
	},
	{
		displayName: 'Top N',
		name: 'topN',
		type: 'number',
		default: 0,
		description: 'Number of top-ranked results to return. Leave 0 to return all.',
		displayOptions: { show: { resource: ['Reranker'], operation: [name] } },
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'string',
		default: '',
		description: 'Comma-separated metadata strings, must match number of documents',
		displayOptions: { show: { resource: ['Reranker'], operation: [name] } },
	},
];
