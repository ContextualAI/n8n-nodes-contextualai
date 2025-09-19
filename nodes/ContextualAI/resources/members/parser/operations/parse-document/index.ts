import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export const name = 'Parse Document';

export const option: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Parse a document using Contextual AI parser',
	action: 'Parse Document',
};

export const properties: INodeProperties[] = [
	{
		displayName: 'Input Binary Field(s)',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'Binary field name(s) on the input item to parse',
		displayOptions: { show: { resource: ['Parser'], operation: [name] } },
	},
	{
		displayName: 'Parse Mode',
		name: 'parseMode',
		type: 'options',
		options: [
			{ name: 'Standard', value: 'standard' },
		],
		default: 'standard',
		displayOptions: { show: { resource: ['Parser'], operation: [name] } },
	},
	{
		displayName: 'Figure Caption Mode',
		name: 'figureCaptionMode',
		type: 'options',
		options: [
			{ name: 'Concise', value: 'concise' },
			{ name: 'Detailed', value: 'detailed' },
		],
		default: 'concise',
		displayOptions: { show: { resource: ['Parser'], operation: [name] } },
	},
	{
		displayName: 'Enable Document Hierarchy',
		name: 'enableDocumentHierarchy',
		type: 'boolean',
		default: true,
		displayOptions: { show: { resource: ['Parser'], operation: [name] } },
	},
	{
		displayName: 'Page Range',
		name: 'pageRange',
		type: 'string',
		default: '',
		placeholder: "e.g., 0-5",
		displayOptions: { show: { resource: ['Parser'], operation: [name] } },
	},
	{
		displayName: 'Output Types',
		name: 'outputTypes',
		type: 'string',
		default: 'markdown-per-page',
		description: 'Comma-separated list of output types',
		displayOptions: { show: { resource: ['Parser'], operation: [name] } },
	},
];
