import {
	INodeType,
	NodeConnectionType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class StartNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Start',
		name: 'start',
		group: ['input'],
		version: 1,
		description: 'Start node',
		defaults: { name: 'Start' },
		inputs: [],
		outputs: [NodeConnectionType.Main],
		properties: [],
	};

	async execute() {
		return [[{ json: {} }]];
	}
}
