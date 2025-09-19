import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks';

export const name = 'Delete Agent';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Delete a given agent (irreversible operation)',
	action: 'Delete Agent',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Agent ID',
		name: 'agentId',
		type: 'string',
		default: '',
		description: 'ID of the agent to delete',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
		required: true,
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
