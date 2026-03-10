import {
	ICredentialsHelper,
	IRun,
	IWorkflowExecuteAdditionalData,
	LoggerProxy,
	Workflow,
} from 'n8n-workflow';
import axios from 'axios';
import { nodeTypes } from './nodeTypesClass';

export type ExecuteWorkflowArgs = {
	workflow: any;
	credentialsHelper: ICredentialsHelper;
};

export const executeWorkflow = async ({ credentialsHelper, ...args }: ExecuteWorkflowArgs) => {
	LoggerProxy.init({
		debug() {},
		error() {},
		info() {},
		warn() {},
	});

	const workflow = new Workflow({
		id: 'test',
		active: true,
		connections: args.workflow.connections,
		nodes: args.workflow.nodes,
		nodeTypes,
	});

	const additionalData: IWorkflowExecuteAdditionalData = {
		credentialsHelper,
		executeWorkflow: async () =>
			({
				executionId: 'test',
				data: [],
			}) as any,
		restApiUrl: 'http://localhost:5678',
		webhookBaseUrl: 'http://localhost:5678',
		webhookWaitingBaseUrl: 'http://localhost:5678',
		webhookTestBaseUrl: 'http://localhost:5678',
		userId: 'userId',
		instanceBaseUrl: 'http://localhost:5678',
		formWaitingBaseUrl: 'http://localhost:5678',
		variables: {},
		secretsHelpers: {} as any,
		logAiEvent: async () => {},
		startRunnerTask: (async () => {}) as any,
	};

	const executionNode = args.workflow.nodes.find(
		(node: any) => node.type === 'n8n-nodes-contextualai.contextualAi',
	);
	if (!executionNode) {
		throw new Error('Could not find Contextual AI node in test workflow');
	}

	const node = workflow.getNode(executionNode.name);
	if (!node) {
		throw new Error(`Could not resolve node "${executionNode.name}" in workflow`);
	}

	const httpRequest = async (requestOptions: any) => {
		const response = await axios({
			method: requestOptions.method,
			url: requestOptions.url ?? requestOptions.uri,
			params: requestOptions.qs,
			headers: requestOptions.headers,
			data: requestOptions.body ?? requestOptions.formData ?? requestOptions.form,
			proxy: false,
			validateStatus: () => true,
		});

		if (response.status >= 400) {
			const error: any = new Error(
				typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
			);
			error.response = {
				status: response.status,
				body: response.data,
			};
			throw error;
		}

		if (requestOptions.returnFullResponse) {
			return {
				body: response.data,
				headers: response.headers,
				statusCode: response.status,
				statusMessage: response.statusText,
			};
		}

		return response.data;
	};

	const context: any = {
		getNode: () => node,
		getInputData: () => [{ json: {} }],
		continueOnFail: () => !!node.continueOnFail,
		getNodeParameter: (parameterName: string, _itemIndex: number, fallbackValue?: any) => {
			return (node.parameters as any)[parameterName] ?? fallbackValue;
		},
		getCredentials: async (type: string) =>
			credentialsHelper.getDecrypted(
				additionalData,
				node.credentials?.[type] ?? { id: null, name: '' },
				type,
				'internal',
			),
		helpers: {
			httpRequest,
			httpRequestWithAuthentication: async (credentialsType: string, requestOptions: any) => {
				const credentials = await credentialsHelper.getDecrypted(
					additionalData,
					node.credentials?.[credentialsType] ?? { id: null, name: '' },
					credentialsType,
					'internal',
				);

				const authenticatedRequest = await credentialsHelper.authenticate(
					credentials,
					credentialsType,
					requestOptions,
					workflow,
					node,
				);

				return httpRequest(authenticatedRequest);
			},
		},
	};

	let executionData: IRun;
	const startTime = Date.now();
	try {
		const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
		if (!nodeType.execute) {
			throw new Error(`Node "${node.name}" does not expose an execute method`);
		}

		const output = await nodeType.execute.call(context);
		executionData = {
			finished: true,
			mode: 'cli',
			startedAt: new Date(startTime),
			stoppedAt: new Date(),
			status: 'success' as any,
			data: {
				resultData: {
					runData: {
						[node.name]: [
							{
								startTime,
								executionTime: Date.now() - startTime,
								executionStatus: 'success' as any,
								data: { main: output },
								source: [null],
							},
						],
					},
				},
			} as any,
		};
	} catch (error) {
		executionData = {
			finished: true,
			mode: 'cli',
			startedAt: new Date(startTime),
			stoppedAt: new Date(),
			status: 'error' as any,
			data: {
				resultData: {
					runData: {
						[node.name]: [
							{
								startTime,
								executionTime: Date.now() - startTime,
								executionStatus: 'error' as any,
								error: error as Error,
								source: [null],
							},
						],
					},
				},
			} as any,
		};
	}

	return {
		workflow,
		waitPromise: undefined,
		executionData,
		additionalData,
	};
};
