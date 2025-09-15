import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks.js';

export const name = 'List Agents';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Retrieve a list of all agents',
	action: 'List Agents',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
		typeOptions: {
			minValue: 1,
		},
		required: true,
	},
	{
		displayName: 'Cursor',
		name: 'cursor',
		type: 'string',
		default: '',
		description: 'Cursor from the previous call to list agents, used to retrieve the next set of results',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
