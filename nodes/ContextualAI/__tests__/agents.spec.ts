/**
 * Test suite for ContextualAI Agent operations that validates agent creation, listing, and deletion functionality.
 */
import nock from 'nock';
import { executeWorkflow } from './utils/executeWorkflow';
import { CredentialsHelper } from './utils/credentialHelper';
import { getRunTaskDataByNodeName, getTaskData } from './utils/getNodeResultData';
import createAgentWorkflow from './workflows/agents/create-agent.workflow.json';
import listAgentsWorkflow from './workflows/agents/list-agents.workflow.json';
import deleteAgentWorkflow from './workflows/agents/delete-agent.workflow.json';
import * as fixtures from './utils/fixtures';

describe('ContextualAI Agent Operations', () => {
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

	describe('create-agent', () => {
		it('should create an agent with new datastore', async () => {
			const mockDatastore = fixtures.createDatastoreResult();
			const mockAgent = fixtures.createAgentResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/datastores')
				.reply(200, mockDatastore)
				.post('/v1/agents')
				.reply(200, mockAgent);

		const { executionData } = await executeWorkflow({
			credentialsHelper,
			workflow: createAgentWorkflow,
		});

		const nodeResults = getRunTaskDataByNodeName(executionData, 'Create Agent');
		expect(nodeResults.length).toBe(1);
		const [nodeResult] = nodeResults;
		expect(nodeResult.executionStatus).toBe('success');

		const data = getTaskData(nodeResult);
		expect(data).toEqual({
			agentId: mockAgent.data.id,
			datastoreIds: [mockDatastore.data.id],
			createdDatastoreId: mockDatastore.data.id,
			uploaded: [],
		});

		expect(scope.isDone()).toBe(true);
	});

		it('should throw error when agent name is missing', async () => {
			const workflowWithoutName = {
				...createAgentWorkflow,
				nodes: createAgentWorkflow.nodes.map(node =>
					node.name === 'Create Agent'
						? { ...node, parameters: { ...node.parameters, agentName: '' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutName,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Create Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Agent name is required');
		});

		it('should throw error when invalid UUID is provided in datastoreIds', async () => {
			const workflowWithInvalidUUID = {
				...createAgentWorkflow,
				nodes: createAgentWorkflow.nodes.map(node =>
					node.name === 'Create Agent'
						? {
							...node,
							parameters: {
								...node.parameters,
								datastoreName: '',
								datastoreIds: 'invalid-uuid'
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidUUID,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Create Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Invalid datastore ID format');
		});
	});

	describe('list-agents', () => {
		it('should list agents successfully', async () => {
			const mockAgentsList = fixtures.listAgentsResult();

			const scope = nock('https://api.contextual.ai')
				.get('/v1/agents')
				.query({ limit: 10 })
				.reply(200, mockAgentsList);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: listAgentsWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'List Agents');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

		const data = getTaskData(nodeResult);
		// Handle case where nock returns stringified JSON
		const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
		expect(parsedData).toEqual(mockAgentsList);

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when limit is out of range', async () => {
			const workflowWithInvalidLimit = {
				...listAgentsWorkflow,
				nodes: listAgentsWorkflow.nodes.map(node =>
					node.name === 'List Agents'
						? { ...node, parameters: { ...node.parameters, limit: 1001 } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidLimit,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'List Agents');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Limit must be between 1 and 1000');
		});
	});

	describe('delete-agent', () => {
		it('should delete agent successfully', async () => {
			const mockDeleteResult = fixtures.deleteAgentResult();

		const scope = nock('https://api.contextual.ai')
			.delete('/v1/agents/123e4567-e89b-12d3-a456-426614174000')
			.reply(200, mockDeleteResult);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: deleteAgentWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Delete Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

		const data = getTaskData(nodeResult);
		// Handle case where nock returns stringified JSON
		const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
		expect(parsedData).toEqual(mockDeleteResult);

			expect(scope.isDone()).toBe(true);
		});

	it('should throw error when agent ID is missing', async () => {
		const workflowWithoutId = {
			...deleteAgentWorkflow,
			nodes: deleteAgentWorkflow.nodes.map(node =>
				node.name === 'Delete Agent'
					? { ...node, parameters: { ...node.parameters, agentId: 'empty' } }
					: node
			)
		};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Delete Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Invalid agent ID format');
		});

		it('should throw error when agent ID format is invalid', async () => {
			const workflowWithInvalidId = {
				...deleteAgentWorkflow,
				nodes: deleteAgentWorkflow.nodes.map(node =>
					node.name === 'Delete Agent'
						? { ...node, parameters: { ...node.parameters, agentId: 'invalid-uuid' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Delete Agent');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Invalid agent ID format');
		});
	});
});
