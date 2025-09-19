import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks';

export const name = 'Create Datastore';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Create a new datastore',
	action: 'Create Datastore',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Datastore Name',
		name: 'datastoreName',
		type: 'string',
		default: '',
		placeholder: 'e.g. Product Documentation',
		description: 'Name of the datastore',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
		required: true,
	},
	{
		displayName: 'Configuration (JSON String)',
		name: 'configuration',
		type: 'string',
		default: '',
		description: 'Configuration of the datastore as stringified JSON. If not provided, default configuration is used.',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
