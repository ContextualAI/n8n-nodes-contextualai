import nock from 'nock';
import { executeWorkflow } from './utils/executeWorkflow';
import { CredentialsHelper } from './utils/credentialHelper';
import { getRunTaskDataByNodeName, getTaskData } from './utils/getNodeResultData';
import runLmunitWorkflow from './workflows/lmunit/run-lmunit.workflow.json';
import * as fixtures from './utils/fixtures';

describe('ContextualAI LMUnit Operations', () => {
	let credentialsHelper: CredentialsHelper;

	beforeEach(() => {
		credentialsHelper = new CredentialsHelper({
			contextualAiApi: {
				apiToken: 'test-token',
				baseUrl: 'https://api.contextual.ai',
			},
		});
	});

	afterEach(() => {
		nock.cleanAll();
	});

	describe('run-lmunit', () => {
		it('should run LMUnit evaluation successfully', async () => {
			const mockLmunitResult = fixtures.runLmunitResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(200, mockLmunitResult);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: runLmunitWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			// Handle case where nock returns stringified JSON
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockLmunitResult);

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when query is missing', async () => {
			const workflowWithoutQuery = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? { ...node, parameters: { ...node.parameters, query: 'empty-query' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutQuery,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Query is required');
		});

		it('should throw error when response is missing', async () => {
			const workflowWithoutResponse = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? { ...node, parameters: { ...node.parameters, response: 'empty-response' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutResponse,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Response is required');
		});

		it('should throw error when unit test is missing', async () => {
			const workflowWithoutUnitTest = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? { ...node, parameters: { ...node.parameters, unitTest: 'empty-unit-test' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutUnitTest,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Unit test is required');
		});

		it('should handle API error responses correctly', async () => {
			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(400, { error: 'Invalid request parameters' });

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: runLmunitWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');

			expect(scope.isDone()).toBe(true);
		});

		it('should handle different evaluation results', async () => {
			const mockFailedResult = {
				data: {
					id: '123e4567-e89b-12d3-a456-426614174001',
					query: 'What is the capital of Italy?',
					response: 'The capital of Italy is Milan.',
					unit_test: 'Is the response clear and well-structured?',
					score: 1.2,
					passed: false,
					explanation: 'The response is brief and direct but contains incorrect information, which affects its overall clarity and usefulness.',
					created_at: '2023-01-01T00:00:00.000Z',
				},
			};

			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(200, mockFailedResult);

			const workflowWithFailingTest = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? {
							...node,
							parameters: {
								...node.parameters,
								query: 'What is the capital of Italy?',
								response: 'The capital of Italy is Milan.',
								unitTest: 'The response should mention Rome as the capital of Italy.'
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithFailingTest,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockFailedResult);
			expect(parsedData.data.passed).toBe(false);
			expect(parsedData.data.score).toBe(1.2);

			expect(scope.isDone()).toBe(true);
		});
	});
});
