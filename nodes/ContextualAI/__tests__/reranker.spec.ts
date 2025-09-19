/**
 * Test suite for ContextualAI Reranker operations that validates document ranking functionality with relevance scoring.
 */
import nock from 'nock';
import { executeWorkflow } from './utils/executeWorkflow';
import { CredentialsHelper } from './utils/credentialHelper';
import { getRunTaskDataByNodeName, getTaskData } from './utils/getNodeResultData';
import rerankDocumentsWorkflow from './workflows/reranker/rerank-documents.workflow.json';
import * as fixtures from './utils/fixtures';

describe('ContextualAI Reranker Operations', () => {
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

	describe('rerank-documents', () => {
		it('should rerank documents successfully', async () => {
			const mockRerankResult = fixtures.rerankDocumentsResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/rerank')
				.reply(200, mockRerankResult);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: rerankDocumentsWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Rerank Documents');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			// Handle case where nock returns stringified JSON
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockRerankResult);

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when no documents provided', async () => {
			const workflowWithoutDocuments = {
				...rerankDocumentsWorkflow,
				nodes: rerankDocumentsWorkflow.nodes.map(node =>
					node.name === 'Rerank Documents'
						? { ...node, parameters: { ...node.parameters, documents: [] } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutDocuments,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Rerank Documents');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('At least one document is required');
		});

		it('should throw error when metadata length does not match documents length', async () => {
			const workflowWithMismatchedMetadata = {
				...rerankDocumentsWorkflow,
				nodes: rerankDocumentsWorkflow.nodes.map(node =>
					node.name === 'Rerank Documents'
						? {
							...node,
							parameters: {
								...node.parameters,
								documents: ["doc1", "doc2"],
								metadata: ["meta1"] // Only one metadata for two documents
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithMismatchedMetadata,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Rerank Documents');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Metadata count (1) must match documents count (2)');
		});

		it('should handle topN parameter correctly', async () => {
			const mockRerankResult = fixtures.rerankDocumentsResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/rerank')
				.reply(200, mockRerankResult);

			const workflowWithTopN = {
				...rerankDocumentsWorkflow,
				nodes: rerankDocumentsWorkflow.nodes.map(node =>
					node.name === 'Rerank Documents'
						? {
							...node,
							parameters: {
								...node.parameters,
								documents: ["doc1", "doc2"],
								metadata: ["meta1", "meta2"],
								topN: 2
							}
						}
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithTopN,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Rerank Documents');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			expect(scope.isDone()).toBe(true);
		});
	});
});
