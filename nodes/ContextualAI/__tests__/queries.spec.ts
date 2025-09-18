import nock from 'nock';
import { executeWorkflow } from './utils/executeWorkflow';
import { CredentialsHelper } from './utils/credentialHelper';
import { getRunTaskDataByNodeName, getTaskData } from './utils/getNodeResultData';
import queryAgentWorkflow from './workflows/queries/query-agent.workflow.json';
import * as fixtures from './utils/fixtures';

describe('ContextualAI Query Operations', () => {
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

	describe('query-agent', () => {
		it('should query agent successfully', async () => {
			const mockQueryResult = fixtures.queryAgentResult();

		const scope = nock('https://api.contextual.ai')
			.post('/v1/agents/123e4567-e89b-12d3-a456-426614174000/query')
			.query({ include_retrieval_content_text: 'true' })
			.reply(200, mockQueryResult);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: queryAgentWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Query Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			// Handle case where nock returns stringified JSON
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockQueryResult);

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when agent ID is missing', async () => {
			const workflowWithoutAgentId = {
				...queryAgentWorkflow,
				nodes: queryAgentWorkflow.nodes.map(node =>
					node.name === 'Query Agent'
						? { ...node, parameters: { ...node.parameters, agentId: 'empty-agent' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutAgentId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Query Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Agent ID is required');
		});

		it('should throw error when query is missing', async () => {
			const workflowWithoutQuery = {
				...queryAgentWorkflow,
				nodes: queryAgentWorkflow.nodes.map(node =>
					node.name === 'Query Agent'
						? { ...node, parameters: { ...node.parameters, query: 'empty-query' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutQuery,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Query Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Query is required');
		});

		it('should throw error when agent ID format is invalid', async () => {
			const workflowWithInvalidAgentId = {
				...queryAgentWorkflow,
				nodes: queryAgentWorkflow.nodes.map(node =>
					node.name === 'Query Agent'
						? { ...node, parameters: { ...node.parameters, agentId: 'invalid-uuid' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidAgentId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Query Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Invalid agent ID format');
		});
	});
});
