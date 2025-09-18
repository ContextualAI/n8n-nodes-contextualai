import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import * as parse from './operations/parse-document';
import * as parseStatus from './operations/parse-status';

export const name = 'Parser';

const operations: INodePropertyOptions[] = [parse.option, parseStatus.option];

const operationSelect: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['Parser'] } },
	default: '',
};

operationSelect.options = operations;
operationSelect.default = operations.length > 0 ? operations[0].value : '';

export const properties: INodeProperties[] = [
	operationSelect,
	...parse.properties,
	...parseStatus.properties,
];

export const methods = {} as const;
