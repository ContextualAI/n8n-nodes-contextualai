import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks';

export const name = 'List Datastores';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Retrieve a list of all datastores',
	action: 'List Datastores',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
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
		description: 'Cursor from the previous call to list datastores, used to retrieve the next set of results',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
	},
	{
		displayName: 'Agent ID',
		name: 'agentId',
		type: 'string',
		default: '',
		description: 'ID of the agent used to filter datastores. If provided, only datastores linked to this agent will be returned.',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
