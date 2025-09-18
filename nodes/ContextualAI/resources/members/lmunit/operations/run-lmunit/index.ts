import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export const name = 'Run LMUnit';

export const option: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Evaluate a response with LMUnit',
	action: 'Run LMUnit',
};

export const properties: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'e.g. What is machine learning?',
		required: true,
		displayOptions: { show: { resource: ['LMUnit'], operation: [name] } },
	},
	{
		displayName: 'Response',
		name: 'response',
		type: 'string',
		default: '',
		placeholder: 'e.g. Machine learning is a subset of AI...',
		required: true,
		displayOptions: { show: { resource: ['LMUnit'], operation: [name] } },
	},
	{
		displayName: 'Unit Test',
		name: 'unitTest',
		type: 'string',
		default: '',
		placeholder: 'e.g. Response should mention AI and learning',
		required: true,
		displayOptions: { show: { resource: ['LMUnit'], operation: [name] } },
	},
];

export { runLmunit } from './execute';
