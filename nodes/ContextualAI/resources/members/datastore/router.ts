import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

import { name as datastoreResourceName } from './index';
import { name as createDatastoreOperationName } from './operations/create-datastore/index';
import { name as ingestDocumentOperationName } from './operations/ingest-document/index';
import { name as getDocumentMetadataOperationName } from './operations/get-document-metadata/index';
import { name as listDatastoresOperationName } from './operations/list-datastores/index';
import { createDatastore } from './operations/create-datastore/execute';
import { ingestDocument } from './operations/ingest-document/execute';
import { getDocumentMetadata } from './operations/get-document-metadata/execute';
import { listDatastores } from './operations/list-datastores/execute';

export async function datastoreRouter(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;

	if (resource !== datastoreResourceName) {
		throw new NodeOperationError(
			this.getNode(),
			`Resource ${resource} is not valid for ${datastoreResourceName}. Please use correct resource.`,
		);
	}

	switch (operation) {
		case createDatastoreOperationName:
			return await createDatastore.call(this, i);
		case ingestDocumentOperationName:
			return await ingestDocument.call(this, i);
		case getDocumentMetadataOperationName:
			return await getDocumentMetadata.call(this, i);
		case listDatastoresOperationName:
			return await listDatastores.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Operation ${operation} not found.`);
	}
}
