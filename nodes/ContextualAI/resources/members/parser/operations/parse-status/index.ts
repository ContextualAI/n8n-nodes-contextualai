import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks';

export const name = 'Parse Status';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Get the status of a parse job',
	action: 'Parse Status',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		default: '',
		description: 'ID of the parse job to check status for',
		displayOptions: { show: { resource: ['Parser'], operation: [name] } },
		required: true,
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
