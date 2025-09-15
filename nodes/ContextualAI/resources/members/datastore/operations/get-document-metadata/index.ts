import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks';

export const name = 'Get Document Metadata';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Get metadata and processing status for a document',
	action: 'Get Document Metadata',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Datastore ID',
		name: 'datastoreId',
		type: 'string',
		default: '',
		description: 'ID of the datastore containing the document',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
		required: true,
	},
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		default: '',
		description: 'ID of the document to get metadata for',
		displayOptions: { show: { resource: ['Datastore'], operation: [name] } },
		required: true,
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
