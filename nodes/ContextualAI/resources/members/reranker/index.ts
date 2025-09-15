import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import * as rerank from './operations/rerank-documents';

export const name = 'Reranker';

const operations: INodePropertyOptions[] = [rerank.option];

const operationSelect: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['Reranker'] } },
	default: '',
};

operationSelect.options = operations;
operationSelect.default = operations.length > 0 ? operations[0].value : '';

export const properties: INodeProperties[] = [operationSelect, ...rerank.properties];

export const methods = {} as const;
