import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { name as rerankerResourceName } from './index';
import { name as rerankOperationName } from './operations/rerank-documents';
import { rerankDocuments } from './operations/rerank-documents/execute';

export async function rerankerRouter(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData | INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;

	if (resource !== rerankerResourceName) {
		throw new NodeOperationError(this.getNode(), `Resource ${resource} is not valid for ${rerankerResourceName}.`);
	}

	switch (operation) {
		case rerankOperationName:
			return await rerankDocuments.call(this, i);
		default:
			throw new NodeOperationError(this.getNode(), `Operation ${operation} not found.`);
	}
}
