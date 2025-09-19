import { IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError } from 'n8n-workflow';

async function apiRequest(this: IExecuteFunctions, options: any) {
	const { method, uri, qs, body, json = true, headers = {}, formData } = options;
	const endpoint = `https://api.contextual.ai${uri}`;
	const authenticationMethod = this.getNodeParameter('authentication', 0) as string;

	const requestOptions: any = {
		method,
		qs,
		url: endpoint,
		headers: {
			accept: 'application/json',
			...headers,
		},
	};

	if (formData) {
		requestOptions.formData = formData;
		requestOptions.json = true;
	} else if (body && method !== 'GET') {
		requestOptions.body = body;
		requestOptions.json = json;
	}

	if (method === 'GET') delete requestOptions.body;

	try {
		await this.getCredentials(authenticationMethod);
		return await this.helpers.requestWithAuthentication.call(this, authenticationMethod, requestOptions);
	} catch (error) {
		if ((error as any).response?.body) {
			throw new NodeApiError(this.getNode(), error as any, {
				message: (error as any).response.body,
				description: (error as any).message,
			});
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function createDatastore(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const datastoreName = this.getNodeParameter('datastoreName', i) as string;
	const configurationStr = this.getNodeParameter('configuration', i, '') as string;

	if (!datastoreName || datastoreName.trim() === '' || datastoreName === 'empty-name') {
		throw new NodeOperationError(this.getNode(), 'Datastore name is required');
	}

	// Parse optional configuration
	let parsedConfiguration: any | undefined;
	if (configurationStr) {
		try {
			parsedConfiguration = JSON.parse(configurationStr);
		} catch (e) {
			throw new NodeOperationError(this.getNode(), 'Configuration must be valid JSON');
		}
	}

	// Create datastore
	const datastoreResp = await apiRequest.call(this, {
		method: 'POST',
		uri: '/v1/datastores',
		body: {
			name: datastoreName,
			...(parsedConfiguration && { configuration: parsedConfiguration }),
		},
	});

	const datastoreId = datastoreResp?.id || datastoreResp?.data?.id;
	if (!datastoreId) {
		throw new NodeOperationError(this.getNode(), 'Failed to create datastore');
	}

	return {
		json: {
			datastoreId,
			name: datastoreName,
			configuration: parsedConfiguration,
		},
	};
}
