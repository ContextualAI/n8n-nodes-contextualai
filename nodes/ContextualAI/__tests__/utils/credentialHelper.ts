import {
	ICredentialDataDecryptedObject,
	ICredentialsHelper,
	IHttpRequestHelper,
	IHttpRequestOptions,
	INode,
	INodeCredentialsDetails,
	ICredentials,
	INodeProperties,
	IWorkflowExecuteAdditionalData,
	WorkflowExecuteMode,
	IExecuteData,
	ICredentialsExpressionResolveValues,
	Workflow,
	IRequestOptionsSimplified,
} from 'n8n-workflow';

export class CredentialsHelper extends ICredentialsHelper {
	private credentials: Record<string, ICredentialDataDecryptedObject>;

	constructor(credentials: Record<string, ICredentialDataDecryptedObject>) {
		super();
		this.credentials = credentials;
	}

	getParentTypes(name: string): string[] {
		return [];
	}

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		typeName: string,
		requestOptions: IHttpRequestOptions | IRequestOptionsSimplified,
		workflow: Workflow,
		node: INode,
	): Promise<IHttpRequestOptions> {
		if (typeName === 'contextualAiApi') {
			const options = requestOptions as IHttpRequestOptions;
			const apiKey = (credentials.apiKey as string) ?? (credentials.apiToken as string);
			options.headers = {
				...options.headers,
				Authorization: `Bearer ${apiKey}`,
			};
			return options;
		}
		return requestOptions as IHttpRequestOptions;
	}

	async preAuthentication(
		helpers: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
		typeName: string,
		node: INode,
		credentialsExpired: boolean,
	): Promise<ICredentialDataDecryptedObject | undefined> {
		return undefined;
	}

	async getCredentials(
		nodeCredentials: INodeCredentialsDetails,
		type: string,
	): Promise<ICredentials> {
		return {
			id: nodeCredentials.id ?? undefined,
			name: nodeCredentials.name,
			type,
			data: '',
		} as ICredentials;
	}

	async getDecrypted(
		additionalData: IWorkflowExecuteAdditionalData,
		nodeCredentials: INodeCredentialsDetails,
		type: string,
		mode: WorkflowExecuteMode,
		executeData?: IExecuteData,
		raw?: boolean,
		expressionResolveValues?: ICredentialsExpressionResolveValues,
	): Promise<ICredentialDataDecryptedObject> {
		return this.credentials[type];
	}

	async updateCredentials(
		nodeCredentials: INodeCredentialsDetails,
		type: string,
		data: ICredentialDataDecryptedObject,
	): Promise<void> {}

	getCredentialsProperties(type: string): INodeProperties[] {
		return [];
	}
}
