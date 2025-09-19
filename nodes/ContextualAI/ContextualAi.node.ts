import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { properties } from './ContextualAI.properties';
import { methods } from './ContextualAi.methods';
import { resourceRouter } from './resources/router';

export class ContextualAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Contextual AI',
		name: 'contextualAi',
		icon: 'file:icons/contextualai_icon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Access Contextual AI tools for agents, parsing, querying, and reranking.',
		defaults: {
			name: 'Contextual AI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				displayName: 'Contextual AI API key connection',
				name: 'contextualAiApi',
				required: true,
			},
		],

		properties,
	};

	methods = methods;

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const data = await resourceRouter.call(this, i);
			if (Array.isArray(data)) {
				returnData.push(...data);
			} else {
				returnData.push(data);
			}
		}

		return [returnData];
	}
}
