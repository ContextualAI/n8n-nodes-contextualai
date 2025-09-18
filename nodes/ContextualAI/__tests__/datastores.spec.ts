import nock from 'nock';
import { executeWorkflow } from './utils/executeWorkflow';
import { CredentialsHelper } from './utils/credentialHelper';
import { getRunTaskDataByNodeName, getTaskData } from './utils/getNodeResultData';
import createDatastoreWorkflow from './workflows/datastore/create-datastore.workflow.json';
import listDatastoresWorkflow from './workflows/datastore/list-datastores.workflow.json';
import ingestDocumentWorkflow from './workflows/datastore/ingest-document.workflow.json';
import getDocumentMetadataWorkflow from './workflows/datastore/get-document-metadata.workflow.json';
import * as fixtures from './utils/fixtures';

describe('ContextualAI Datastore Operations', () => {
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

	describe('create-datastore', () => {
		it('should create a datastore successfully', async () => {
			const mockDatastore = fixtures.createDatastoreResult();

			const scope = nock('https://api.contextual.ai')
				.post('/v1/datastores')
				.reply(200, mockDatastore);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: createDatastoreWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Create Datastore');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			expect(data).toEqual({
				datastoreId: mockDatastore.data.id,
				name: 'Test Datastore',
				configuration: undefined,
			});

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when datastore name is missing', async () => {
			const workflowWithoutName = {
				...createDatastoreWorkflow,
				nodes: createDatastoreWorkflow.nodes.map(node =>
					node.name === 'Create Datastore'
						? { ...node, parameters: { ...node.parameters, datastoreName: 'empty-name' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithoutName,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Create Datastore');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Datastore name is required');
		});
	});

	describe('list-datastores', () => {
		it('should list datastores successfully', async () => {
			const mockDatastoresList = fixtures.listDatastoresResult();

			const scope = nock('https://api.contextual.ai')
				.get('/v1/datastores')
				.query({ limit: 10 })
				.reply(200, mockDatastoresList);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: listDatastoresWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'List Datastores');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			// Handle case where nock returns stringified JSON
			const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
			expect(parsedData).toEqual(mockDatastoresList);

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when limit is out of range', async () => {
			const workflowWithInvalidLimit = {
				...listDatastoresWorkflow,
				nodes: listDatastoresWorkflow.nodes.map(node =>
					node.name === 'List Datastores'
						? { ...node, parameters: { ...node.parameters, limit: 1001 } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidLimit,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'List Datastores');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Limit must be between 1 and 1000');
		});
	});

	describe('ingest-document', () => {
		it('should handle no binary data case', async () => {
			// No nock setup needed since no HTTP call should be made when there's no binary data

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: ingestDocumentWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Ingest Document');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			expect(data).toEqual({
				datastoreId: '123e4567-e89b-12d3-a456-426614174000',
				uploaded: [],
			});
		});

		it('should throw error when datastore ID is invalid', async () => {
			const workflowWithInvalidId = {
				...ingestDocumentWorkflow,
				nodes: ingestDocumentWorkflow.nodes.map(node =>
					node.name === 'Ingest Document'
						? { ...node, parameters: { ...node.parameters, datastoreId: 'invalid-uuid' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Ingest Document');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Invalid datastore ID format');
		});
	});

	describe('get-document-metadata', () => {
		it('should get document metadata successfully', async () => {
			const mockMetadata = fixtures.getDocumentMetadataResult();

		const scope = nock('https://api.contextual.ai')
			.get('/v1/datastores/123e4567-e89b-12d3-a456-426614174000/documents/123e4567-e89b-12d3-a456-426614174000/metadata')
			.reply(200, mockMetadata);

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: getDocumentMetadataWorkflow,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Get Document Metadata');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('success');

			const data = getTaskData(nodeResult);
			const parsedMetadata = typeof data?.metadata === 'string' ? JSON.parse(data.metadata) : data?.metadata;
			expect({
				datastoreId: data?.datastoreId,
				documentId: data?.documentId,
				metadata: parsedMetadata,
			}).toEqual({
				datastoreId: '123e4567-e89b-12d3-a456-426614174000',
				documentId: '123e4567-e89b-12d3-a456-426614174000',
				metadata: mockMetadata,
			});

			expect(scope.isDone()).toBe(true);
		});

		it('should throw error when document ID is invalid', async () => {
			const workflowWithInvalidId = {
				...getDocumentMetadataWorkflow,
				nodes: getDocumentMetadataWorkflow.nodes.map(node =>
					node.name === 'Get Document Metadata'
						? { ...node, parameters: { ...node.parameters, documentId: 'invalid-uuid' } }
						: node
				)
			};

			const { executionData } = await executeWorkflow({
				credentialsHelper,
				workflow: workflowWithInvalidId,
			});

			const nodeResults = getRunTaskDataByNodeName(executionData, 'Get Document Metadata');
			expect(nodeResults.length).toBe(1);
			const [nodeResult] = nodeResults;
			expect(nodeResult.executionStatus).toBe('error');
			expect(nodeResult.error?.message).toContain('Invalid document ID format');
		});
	});
});
