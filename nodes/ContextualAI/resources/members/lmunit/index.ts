import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import * as run from './operations/run-lmunit';

export const name = 'LMUnit';

const operations: INodePropertyOptions[] = [run.option];

const operationSelect: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['LMUnit'] } },
	default: '',
};

operationSelect.options = operations;
operationSelect.default = operations.length > 0 ? operations[0].value : '';

export const properties: INodeProperties[] = [operationSelect, ...run.properties];

export const methods = {} as const;
