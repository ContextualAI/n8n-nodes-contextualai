export const createAgentResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Test Agent',
			description: 'A test agent for unit testing',
			datastore_ids: ['123e4567-e89b-12d3-a456-426614174000'],
			system_prompt: 'You are a helpful assistant.',
			created_at: '2023-01-01T00:00:00.000Z',
			updated_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const createDatastoreResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Test Datastore',
			created_at: '2023-01-01T00:00:00.000Z',
			updated_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const ingestDocumentResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			filename: 'test-document.pdf',
			status: 'processing',
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const listAgentsResult = () => {
	return {
		data: {
			items: [
				{
					id: '123e4567-e89b-12d3-a456-426614174000',
					name: 'Test Agent 1',
					description: 'First test agent',
					datastore_ids: ['123e4567-e89b-12d3-a456-426614174000'],
					created_at: '2023-01-01T00:00:00.000Z',
					updated_at: '2023-01-01T00:00:00.000Z',
				},
				{
					id: '456e7890-e89b-12d3-a456-426614174001',
					name: 'Test Agent 2',
					description: 'Second test agent',
					datastore_ids: ['456e7890-e89b-12d3-a456-426614174001'],
					created_at: '2023-01-01T01:00:00.000Z',
					updated_at: '2023-01-01T01:00:00.000Z',
				},
			],
			cursor: null,
			has_more: false,
		},
	};
};

export const deleteAgentResult = () => {
	return {
		data: {
			success: true,
			message: 'Agent deleted successfully',
		},
	};
};

export const getAgentResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Test Agent',
			description: 'A test agent for unit testing',
			datastore_ids: ['123e4567-e89b-12d3-a456-426614174000'],
			system_prompt: 'You are a helpful assistant.',
			created_at: '2023-01-01T00:00:00.000Z',
			updated_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

// Datastore fixtures
export const listDatastoresResult = () => {
	return {
		data: {
			items: [
				{
					id: '123e4567-e89b-12d3-a456-426614174000',
					name: 'Test Datastore 1',
					created_at: '2023-01-01T00:00:00.000Z',
					updated_at: '2023-01-01T00:00:00.000Z',
				},
				{
					id: '456e7890-e89b-12d3-a456-426614174001',
					name: 'Test Datastore 2',
					created_at: '2023-01-01T01:00:00.000Z',
					updated_at: '2023-01-01T01:00:00.000Z',
				},
			],
			cursor: null,
			has_more: false,
		},
	};
};

export const getDocumentMetadataResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			filename: 'test-document.pdf',
			status: 'processed',
			metadata: {
				pages: 10,
				size_bytes: 52487,
				content_type: 'application/pdf',
			},
			created_at: '2023-01-01T00:00:00.000Z',
			processed_at: '2023-01-01T00:01:00.000Z',
		},
	};
};

// Query fixtures
export const queryAgentResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			agent_id: '123e4567-e89b-12d3-a456-426614174000',
			query: 'What is machine learning?',
			answer: 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.',
			retrievals: [
				{
					id: '456e7890-e89b-12d3-a456-426614174001',
					content: 'Machine learning algorithms build mathematical models...',
					metadata: {
						source: 'ml-textbook.pdf',
						page: 15,
					},
					score: 0.92,
				},
			],
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

// Reranker fixtures
export const rerankDocumentsResult = () => {
	return {
		data: {
			query: 'I want retrieve information about machine learning algorithms from high quality sources',
			ranked_documents: [
				{
					document: 'Deep learning is a subset of machine learning using neural networks',
					metadata: 'source: deep-learning.pdf',
					score: 0.95,
					index: 1,
				},
				{
					document: 'Machine learning algorithms can be supervised or unsupervised',
					metadata: 'source: ml-basics.pdf',
					score: 0.88,
					index: 0,
				},
				{
					document: 'Statistical analysis is fundamental to data science',
					metadata: 'source: statistics.pdf',
					score: 0.62,
					index: 2,
				},
			],
			model: 'contextual-reranker-v1',
			top_n: 3,
		},
	};
};

// LMUnit fixtures
export const runLmunitResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			query: 'What is the capital of France?',
			response: 'The capital of France is Paris.',
			unit_test: 'The response should mention Paris as the capital of France.',
			score: 5,
			passed: true,
			explanation: 'The response correctly identifies Paris as the capital of France, which matches the unit test criteria perfectly.',
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const runLmunitStronglyFailsResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174001',
			query: 'What is the capital of Italy?',
			response: 'I don\'t know.',
			unit_test: 'The response should provide the correct capital city of Italy.',
			score: 1,
			passed: false,
			explanation: 'The response strongly fails to meet the criteria by not providing any useful information about Italy\'s capital.',
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const runLmunitFailsResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174002',
			query: 'What is the capital of Italy?',
			response: 'The capital of Italy is Milan.',
			unit_test: 'The response should provide the correct capital city of Italy.',
			score: 2,
			passed: false,
			explanation: 'The response fails to meet the criteria by providing incorrect information about Italy\'s capital.',
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const runLmunitNeutralResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174003',
			query: 'What is the capital of Italy?',
			response: 'Italy has a capital city.',
			unit_test: 'The response should provide the correct capital city of Italy.',
			score: 3,
			passed: false,
			explanation: 'The response is neutral - it acknowledges Italy has a capital but doesn\'t specify which city.',
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const runLmunitPassesResult = () => {
	return {
		data: {
			id: '123e4567-e89b-12d3-a456-426614174004',
			query: 'What is the capital of Italy?',
			response: 'The capital of Italy is Rome.',
			unit_test: 'The response should provide the correct capital city of Italy.',
			score: 4,
			passed: true,
			explanation: 'The response passes by correctly identifying Rome as Italy\'s capital.',
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

// Parser fixtures
export const parseDocumentResult = () => {
	return {
		job_id: '123e4567-e89b-12d3-a456-426614174000',
		status: 'submitted',
		message: 'Document submitted for parsing',
		created_at: '2023-01-01T00:00:00.000Z',
	};
};

export const parseStatusResult = () => {
	return {
		data: {
			job_id: '123e4567-e89b-12d3-a456-426614174000',
			status: 'completed',
			progress: 100,
			results: {
				pages: [
					{
						page_number: 1,
						content: '# Sample Document\n\nThis is a sample parsed document content.',
						markdown: '# Sample Document\n\nThis is a sample parsed document content.',
					},
				],
				metadata: {
					total_pages: 1,
					file_size: 52487,
					file_type: 'application/pdf',
					processing_time: 12.5,
				},
			},
			created_at: '2023-01-01T00:00:00.000Z',
			completed_at: '2023-01-01T00:01:00.000Z',
		},
	};
};

export const parseStatusPendingResult = () => {
	return {
		data: {
			job_id: '123e4567-e89b-12d3-a456-426614174000',
			status: 'processing',
			progress: 45,
			created_at: '2023-01-01T00:00:00.000Z',
		},
	};
};

export const parseStatusFailedResult = () => {
	return {
		data: {
			job_id: '123e4567-e89b-12d3-a456-426614174000',
			status: 'failed',
			progress: 0,
			error: 'Failed to parse document: unsupported file format',
			created_at: '2023-01-01T00:00:00.000Z',
			failed_at: '2023-01-01T00:01:00.000Z',
		},
	};
};
