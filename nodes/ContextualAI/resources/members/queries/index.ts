import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import * as query from './operations/query-agent';

export const name = 'Query';

const operations: INodePropertyOptions[] = [query.option];

const operationSelect: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['Query'] } },
	default: '',
};

operationSelect.options = operations;
operationSelect.default = operations.length > 0 ? operations[0].value : '';

export const properties: INodeProperties[] = [operationSelect, ...query.properties];

export const methods = {} as const;
