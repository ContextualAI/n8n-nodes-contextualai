/**
 * Test suite for ContextualAI LMUnit operations that validates the 1-5 scoring system for evaluating response quality.
 */
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

		it('should handle strongly failing evaluation (score 1)', async () => {
			const mockStronglyFailsResult = fixtures.runLmunitStronglyFailsResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(200, mockStronglyFailsResult);

			const workflowWithStronglyFailingTest = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? {
							...node,
							parameters: {
								...node.parameters,
								query: 'What is the capital of Italy?',
								response: 'I don\'t know.',
								unitTest: 'The response should provide the correct capital city of Italy.'
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithStronglyFailingTest,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockStronglyFailsResult);
			expect(parsedData.data.passed).toBe(false);
			expect(parsedData.data.score).toBe(1);

			expect(scope.isDone()).toBe(true);
		});

		it('should handle failing evaluation (score 2)', async () => {
			const mockFailsResult = fixtures.runLmunitFailsResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(200, mockFailsResult);

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
								unitTest: 'The response should provide the correct capital city of Italy.'
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
			expect(parsedData).toEqual(mockFailsResult);
			expect(parsedData.data.passed).toBe(false);
			expect(parsedData.data.score).toBe(2);

			expect(scope.isDone()).toBe(true);
		});

		it('should handle neutral evaluation (score 3)', async () => {
			const mockNeutralResult = fixtures.runLmunitNeutralResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(200, mockNeutralResult);

			const workflowWithNeutralTest = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? {
							...node,
							parameters: {
								...node.parameters,
								query: 'What is the capital of Italy?',
								response: 'Italy has a capital city.',
								unitTest: 'The response should provide the correct capital city of Italy.'
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithNeutralTest,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockNeutralResult);
			expect(parsedData.data.passed).toBe(false);
			expect(parsedData.data.score).toBe(3);

			expect(scope.isDone()).toBe(true);
		});

		it('should handle passing evaluation (score 4)', async () => {
			const mockPassesResult = fixtures.runLmunitPassesResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(200, mockPassesResult);

			const workflowWithPassingTest = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? {
							...node,
							parameters: {
								...node.parameters,
								query: 'What is the capital of Italy?',
								response: 'The capital of Italy is Rome.',
								unitTest: 'The response should provide the correct capital city of Italy.'
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithPassingTest,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockPassesResult);
			expect(parsedData.data.passed).toBe(true);
			expect(parsedData.data.score).toBe(4);

			expect(scope.isDone()).toBe(true);
		});

		it('should handle strongly passing evaluation (score 5)', async () => {
			const mockStronglyPassesResult = fixtures.runLmunitResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/lmunit')
				.reply(200, mockStronglyPassesResult);

			const workflowWithStronglyPassingTest = {
				...runLmunitWorkflow,
				nodes: runLmunitWorkflow.nodes.map(node =>
					node.name === 'Run LMUnit'
						? {
							...node,
							parameters: {
								...node.parameters,
								query: 'What is the capital of France?',
								response: 'The capital of France is Paris.',
								unitTest: 'The response should mention Paris as the capital of France.'
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithStronglyPassingTest,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockStronglyPassesResult);
			expect(parsedData.data.passed).toBe(true);
			expect(parsedData.data.score).toBe(5);

			expect(scope.isDone()).toBe(true);
		});
	});
});
