import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { name as lmunitResourceName } from './index';
import { name as runOperationName, runLmunit } from './operations/run-lmunit';

export async function lmunitRouter(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;

	if (resource !== lmunitResourceName) {
		throw new NodeOperationError(this.getNode(), `Resource ${resource} is not valid for ${lmunitResourceName}.`);
	}

	switch (operation) {
		case runOperationName:
			return await runLmunit.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Operation ${operation} not found.`);
	}
}
