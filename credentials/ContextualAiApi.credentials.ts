import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class ContextualAiApi implements ICredentialType {
	name = 'contextualAiApi';

	displayName = 'Contextual AI API';

	documentationUrl = 'https://docs.contextual.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
				accept: 'application/json',
			},
		},
	};
}
