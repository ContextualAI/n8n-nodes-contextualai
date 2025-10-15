/**
 * Test suite for ContextualAI Node that validates the main node configuration and basic functionality.
 */
import nock from 'nock';
import { ContextualAi } from '../ContextualAi.node';
import { executeWorkflow } from './utils/executeWorkflow';
import { CredentialsHelper } from './utils/credentialHelper';
import { getRunTaskDataByNodeName } from './utils/getNodeResultData';

describe('ContextualAI Node', () => {
	let node: ContextualAi;
	let credentialsHelper: CredentialsHelper;

	beforeEach(() => {
		node = new ContextualAi();
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

	describe('description', () => {
		it('should have a name property', () => {
			expect(node.description.name).toBeDefined();
			expect(node.description.name).toEqual('contextualAi');
		});

		it('should have properties defined', () => {
			expect(node.description.properties).toBeDefined();
		});

		it('should have credential properties defined', () => {
			expect(node.description.credentials).toBeDefined();
		});
	});

	describe('continueOnFail', () => {
		it('should return error in output when continueOnFail is enabled', async () => {
			const workflowWithContinueOnFail = {
				nodes: [
					{
						parameters: {},
						id: 'd5f4d9a7-5c9a-4f8b-9e3f-1a2b3c4d5e6f',
						name: 'Start',
						type: 'n8n-nodes-base.start',
						typeVersion: 1,
						position: [240, 300],
					},
					{
						parameters: {
							authentication: 'contextualAiApi',
							resource: 'LMUnit',
							operation: 'Run LMUnit',
							query: 'empty-query',
							response: 'test response',
							unitTest: 'test unit test',
						},
						id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
						name: 'Run LMUnit',
						type: 'n8n-nodes-contextualai.contextualAi',
						typeVersion: 1,
						position: [460, 300],
						credentials: {
							contextualAiApi: {
								id: 'test-credentials',
								name: 'Test Contextual AI API',
							},
						},
						continueOnFail: true,
					},
				],
				connections: {
					Start: {
						main: [
							[
								{
									node: 'Run LMUnit',
									type: 'main',
									index: 0,
								},
							],
						],
					},
				},
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithContinueOnFail,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			// Should have output with error property
			const outputItems = nodeResult.data?.main?.[0];
			expect(outputItems?.length).toBe(1);
			expect(outputItems?.[0]?.json).toHaveProperty('error');
			expect(outputItems?.[0]?.json.error).toContain('Query is required');
		});

		it('should stop execution when continueOnFail is disabled and an error occurs', async () => {
			const workflowWithoutContinueOnFail = {
				nodes: [
					{
						parameters: {},
						id: 'd5f4d9a7-5c9a-4f8b-9e3f-1a2b3c4d5e6f',
						name: 'Start',
						type: 'n8n-nodes-base.start',
						typeVersion: 1,
						position: [240, 300],
					},
					{
						parameters: {
							authentication: 'contextualAiApi',
							resource: 'LMUnit',
							operation: 'Run LMUnit',
							query: 'empty-query',
							response: 'test response',
							unitTest: 'test unit test',
						},
						id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
						name: 'Run LMUnit',
						type: 'n8n-nodes-contextualai.contextualAi',
						typeVersion: 1,
						position: [460, 300],
						credentials: {
							contextualAiApi: {
								id: 'test-credentials',
								name: 'Test Contextual AI API',
							},
						},
						continueOnFail: false,
					},
				],
				connections: {
					Start: {
						main: [
							[
								{
									node: 'Run LMUnit',
									type: 'main',
									index: 0,
								},
							],
						],
					},
				},
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutContinueOnFail,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Run LMUnit');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Query is required');
		});
	});
});
