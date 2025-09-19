import { INodeProperties } from 'n8n-workflow';
import { properties as resources } from './resources';

const authenticationProperties: INodeProperties[] = [
	{
		displayName: 'Authentication',
		name: 'authentication',
		type: 'options',
		options: [
			{
				name: 'API Key',
				value: 'contextualAiApi',
			},
		],
		default: 'contextualAiApi',
		description: 'Choose which authentication method to use',
	},
];

export const properties: INodeProperties[] = [...resources, ...authenticationProperties];
