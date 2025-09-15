import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import * as create from './operations/create-agent';
import * as list from './operations/list-agents';
import * as deleteAgent from './operations/delete-agent';

export const name = 'Agent';

const operations: INodePropertyOptions[] = [create.option, list.option, deleteAgent.option];

const operationSelect: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['Agent'],
		},
	},
	default: '',
};

operationSelect.options = operations;
operationSelect.default = operations.length > 0 ? operations[0].value : '';

export const properties: INodeProperties[] = [operationSelect, ...create.properties, ...list.properties, ...deleteAgent.properties];

export const methods = {} as const;
