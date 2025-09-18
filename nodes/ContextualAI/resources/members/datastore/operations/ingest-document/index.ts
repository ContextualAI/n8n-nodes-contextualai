import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks';

export const name = 'Ingest Document';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Ingest a document into a datastore',
	action: 'Ingest Document',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Datastore ID',
		name: 'datastoreId',
		type: 'string',
		default: '',
		description: 'ID of the datastore to ingest the document into',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
		required: true,
	},
	{
		displayName: 'Input Binary Field(s)',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'Binary field name(s) on the input item to ingest. Leave empty to use all binary fields.',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
	},
	{
		displayName: 'Metadata (JSON String)',
		name: 'metadata',
		type: 'string',
		default: '',
		description: 'Metadata request in stringified JSON format. custom_metadata is a flat dictionary containing key-value pairs.',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
