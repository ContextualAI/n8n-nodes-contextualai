import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import * as createDatastore from './operations/create-datastore/index';
import * as ingestDocument from './operations/ingest-document/index';
import * as getDocumentMetadata from './operations/get-document-metadata/index';
import * as listDatastores from './operations/list-datastores/index';

export const name = 'Datastore';

const operations: INodePropertyOptions[] = [createDatastore.option, ingestDocument.option, getDocumentMetadata.option, listDatastores.option];

const operationSelect: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['Datastore'],
		},
	},
	default: '',
};

operationSelect.options = operations;
operationSelect.default = operations.length > 0 ? operations[0].value : '';

export const properties: INodeProperties[] = [operationSelect, ...createDatastore.properties, ...ingestDocument.properties, ...getDocumentMetadata.properties, ...listDatastores.properties];

export const methods = {} as const;
