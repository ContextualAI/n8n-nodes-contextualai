/* eslint-disable n8n-nodes-base/node-param-options-type-unsorted-items */

import { INodeProperties } from 'n8n-workflow';

import { aggregateNodeMethods } from '../helpers/methods';
import { runHooks } from './hooks';

import * as agents from './members/agents';
import * as parser from './members/parser';
import * as queries from './members/queries';
import * as reranker from './members/reranker';
import * as lmunit from './members/lmunit';
import * as datastore from './members/datastore';

const authenticationProperties: INodeProperties[] = [];

const resourceSelect: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Agent', value: 'Agent' },
			{ name: 'Datastore', value: 'Datastore' },
			{ name: 'Query', value: 'Query' },
			{ name: 'Reranker', value: 'Reranker' },
			{ name: 'LMUnit', value: 'LMUnit' },
			{ name: 'Parser', value: 'Parser' },
		],
		default: 'Agent',
	},
];

const rawProperties: INodeProperties[] = [
	...authenticationProperties,
	...resourceSelect,
	...agents.properties,
	...parser.properties,
	...queries.properties,
	...reranker.properties,
	...lmunit.properties,
	...datastore.properties,
];

const { properties, methods: selfMethods } = runHooks(rawProperties);

const methods = aggregateNodeMethods([
	selfMethods,
	agents.methods,
	parser.methods,
	queries.methods,
	reranker.methods,
	lmunit.methods,
	datastore.methods,
]);

export { properties, methods };
