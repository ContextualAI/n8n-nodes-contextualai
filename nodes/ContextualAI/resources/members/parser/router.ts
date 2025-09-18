import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { name as parserResourceName } from './index';
import { name as parseOperationName } from './operations/parse-document';
import { parseDocument } from './operations/parse-document/execute';
import { name as parseStatusOperationName } from './operations/parse-status';
import { parseStatus } from './operations/parse-status/execute';

export async function parserRouter(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;

	if (resource !== parserResourceName) {
		throw new NodeOperationError(this.getNode(), `Resource ${resource} is not valid for ${parserResourceName}.`);
	}

	switch (operation) {
		case parseOperationName:
			return await parseDocument.call(this, i);
		case parseStatusOperationName:
			return await parseStatus.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Operation ${operation} not found.`);
	}
}
