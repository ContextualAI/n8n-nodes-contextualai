import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { name as queriesResourceName } from './index';
import { name as queryOperationName } from './operations/query-agent';
import { queryAgent } from './operations/query-agent/execute';

export async function queriesRouter(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;

	if (resource !== queriesResourceName) {
		throw new NodeOperationError(this.getNode(), `Resource ${resource} is not valid for ${queriesResourceName}.`);
	}

	switch (operation) {
		case queryOperationName:
			return await queryAgent.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Operation ${operation} not found.`);
	}
}
