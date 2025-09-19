import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

import { name as agentsResourceName } from './index';
import { name as createOperationName } from './operations/create-agent';
import { name as listOperationName } from './operations/list-agents';
import { name as deleteOperationName } from './operations/delete-agent';
import { createAgent } from './operations/create-agent/execute';
import { listAgents } from './operations/list-agents/execute';
import { deleteAgent } from './operations/delete-agent/execute';

export async function agentsRouter(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;

	if (resource !== agentsResourceName) {
		throw new NodeOperationError(
			this.getNode(),
			`Resource ${resource} is not valid for ${agentsResourceName}. Please use correct resource.`,
		);
	}

	switch (operation) {
		case createOperationName:
			return await createAgent.call(this, i);
		case listOperationName:
			return await listAgents.call(this, i);
		case deleteOperationName:
			return await deleteAgent.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Operation ${operation} not found.`);
	}
}
