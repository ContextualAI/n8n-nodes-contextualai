import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

import { name as agentsResourceName } from './members/agents';
import { name as parserResourceName } from './members/parser';
import { name as queriesResourceName } from './members/queries';
import { name as rerankerResourceName } from './members/reranker';
import { name as lmunitResourceName } from './members/lmunit';
import { name as datastoreResourceName } from './members/datastore';

import { agentsRouter } from './members/agents/router';
import { parserRouter } from './members/parser/router';
import { queriesRouter } from './members/queries/router';
import { rerankerRouter } from './members/reranker/router';
import { lmunitRouter } from './members/lmunit/router';
import { datastoreRouter } from './members/datastore/router';

export async function resourceRouter(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', 0) as string;

	switch (resource) {
		case agentsResourceName:
			return await agentsRouter.call(this, i);
		case parserResourceName:
			return await parserRouter.call(this, i);
		case queriesResourceName:
			return await queriesRouter.call(this, i);
		case rerankerResourceName:
			return await rerankerRouter.call(this, i);
		case lmunitResourceName:
			return await lmunitRouter.call(this, i);
		case datastoreResourceName:
			return await datastoreRouter.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Resource ${resource} not found`);
	}
}
