/**
 * Test suite for ContextualAI Parser operations that validates document parsing functionality and status tracking.
 */
import nock from 'nock';
import { executeWorkflow } from './utils/executeWorkflow';
import { CredentialsHelper } from './utils/credentialHelper';
import { getRunTaskDataByNodeName, getTaskData } from './utils/getNodeResultData';
import parseDocumentWorkflow from './workflows/parser/parse-document.workflow.json';
import parseStatusWorkflow from './workflows/parser/parse-status.workflow.json';
import * as fixtures from './utils/fixtures';

describe('ContextualAI Parser Operations', () => {
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

	describe('parse-document', () => {
		// Note: Parse document tests that require binary data are omitted since the test framework
		// doesn't easily support mocking binary data. In a real scenario, the parse-document operation
		// would work with actual binary files.

		it('should throw error when parse mode is missing', async () => {
			const workflowWithoutParseMode = {
				...parseDocumentWorkflow,
				nodes: parseDocumentWorkflow.nodes.map(node =>
					node.name === 'Parse Document'
						? { ...node, parameters: { ...node.parameters, parseMode: 'empty-parse-mode' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutParseMode,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Document');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Parse mode is required');
		});

		it('should throw error when figure caption mode is missing', async () => {
			const workflowWithoutFigureCaptionMode = {
				...parseDocumentWorkflow,
				nodes: parseDocumentWorkflow.nodes.map(node =>
					node.name === 'Parse Document'
						? { ...node, parameters: { ...node.parameters, figureCaptionMode: 'empty-figure-caption-mode' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutFigureCaptionMode,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Document');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Figure caption mode is required');
		});

		it('should throw error when no binary data is provided', async () => {
			// This test simulates what happens when there's no binary data to process
			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: parseDocumentWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Document');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;

			// When there's no binary data, the operation should throw an error
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('No matching binary field found on input item');
		});

	});

	describe('parse-status', () => {
		it('should get parse status successfully', async () => {
			const mockStatusResult = fixtures.parseStatusResult();

			const scope = nock('https://api.contextual.ai')
				.get('/v1/parse/jobs/123e4567-e89b-12d3-a456-426614174000/status')
				.reply(200, mockStatusResult);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: parseStatusWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Status');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData.jobId).toBe('123e4567-e89b-12d3-a456-426614174000');
			expect(parsedData.status).toBe('completed');

			expect(scope.isDone()).toBe(true);
		});

		it('should handle pending status correctly', async () => {
			const mockPendingResult = fixtures.parseStatusPendingResult();

			const scope = nock('https://api.contextual.ai')
				.get('/v1/parse/jobs/123e4567-e89b-12d3-a456-426614174000/status')
				.reply(200, mockPendingResult);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: parseStatusWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Status');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData.status).toBe('processing');
			expect(parsedData.data.progress).toBe(45);

			expect(scope.isDone()).toBe(true);
		});

		it('should handle failed status correctly', async () => {
			const mockFailedResult = fixtures.parseStatusFailedResult();

			const scope = nock('https://api.contextual.ai')
				.get('/v1/parse/jobs/123e4567-e89b-12d3-a456-426614174000/status')
				.reply(200, mockFailedResult);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: parseStatusWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Status');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData.status).toBe('failed');
			expect(parsedData.data.error).toContain('unsupported file format');

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when job ID is missing', async () => {
			const workflowWithoutJobId = {
				...parseStatusWorkflow,
				nodes: parseStatusWorkflow.nodes.map(node =>
					node.name === 'Parse Status'
						? { ...node, parameters: { ...node.parameters, jobId: 'empty-job-id' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutJobId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Status');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Job ID is required');
		});

		it('should throw error when job ID format is invalid', async () => {
			const workflowWithInvalidJobId = {
				...parseStatusWorkflow,
				nodes: parseStatusWorkflow.nodes.map(node =>
					node.name === 'Parse Status'
						? { ...node, parameters: { ...node.parameters, jobId: 'invalid-uuid' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidJobId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Status');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Invalid job ID format');
		});

		it('should handle API error responses correctly', async () => {
			const scope = nock('https://api.contextual.ai')
				.get('/v1/parse/jobs/123e4567-e89b-12d3-a456-426614174000/status')
				.reply(404, { error: 'Job not found' });

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: parseStatusWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Status');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');

			expect(scope.isDone()).toBe(true);
		});

		it('should handle stringified JSON response', async () => {
			const mockStatusResult = fixtures.parseStatusResult();
			const stringifiedResponse = JSON.stringify(mockStatusResult);

			const scope = nock('https://api.contextual.ai')
				.get('/v1/parse/jobs/123e4567-e89b-12d3-a456-426614174000/status')
				.reply(200, stringifiedResponse);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: parseStatusWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Parse Status');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData.jobId).toBe('123e4567-e89b-12d3-a456-426614174000');

			expect(scope.isDone()).toBe(true);
		});
	});
});
