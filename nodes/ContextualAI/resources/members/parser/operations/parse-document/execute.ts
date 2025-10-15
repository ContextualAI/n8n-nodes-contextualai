import { IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError } from 'n8n-workflow';

async function apiRequest(this: IExecuteFunctions, options: any) {
	const { method, uri, qs, body, json = true, headers = {}, formData } = options;
	const endpoint = `https://api.contextual.ai${uri}`;
	const authenticationMethod = this.getNodeParameter('authentication', 0) as string;

	const requestOptions: any = {
		method,
		qs,
		url: endpoint,
		headers: {
			accept: 'application/json',
			...headers,
		},
	};

	if (formData) {
		requestOptions.formData = formData;
		requestOptions.json = true;
	} else if (body && method !== 'GET') {
		requestOptions.body = body;
		requestOptions.json = json;
	}

	if (method === 'GET') delete requestOptions.body;

	try {
		await this.getCredentials(authenticationMethod);
		return await this.helpers.requestWithAuthentication.call(this, authenticationMethod, requestOptions);
	} catch (error) {
		if ((error as any).response?.body) {
			throw new NodeApiError(this.getNode(), error as any, {
				message: (error as any).response.body,
				description: (error as any).message,
			});
		}
		throw new NodeApiError(this.getNode(), error as any);
	}
}

export async function parseDocument(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
	const parseMode = this.getNodeParameter('parseMode', i) as string;
	const figureCaptionMode = this.getNodeParameter('figureCaptionMode', i) as string;
	const enableDocumentHierarchy = this.getNodeParameter('enableDocumentHierarchy', i) as boolean;
	const pageRange = this.getNodeParameter('pageRange', i) as string;

	// Validate required parameters
	if (!parseMode || parseMode === 'empty-parse-mode') {
		throw new NodeOperationError(this.getNode(), 'Parse mode is required');
	}
	if (!figureCaptionMode || figureCaptionMode === 'empty-figure-caption-mode') {
		throw new NodeOperationError(this.getNode(), 'Figure caption mode is required');
	}

	const item = this.getInputData()[i] as INodeExecutionData;
	const binaryObj = item.binary || {};
	const requested = (binaryPropertyName || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const keys = Object.keys(binaryObj);
	const selectedKey = (requested.length > 0 ? requested : keys).find((k) => keys.includes(k));
	if (!selectedKey) {
		throw new NodeOperationError(this.getNode(), 'No matching binary field found on input item');
	}

	const binary = this.helpers.assertBinaryData(i, selectedKey);
	const buffer = await this.helpers.getBinaryDataBuffer(i, selectedKey);

	const formData: any = {
		raw_file: {
			value: buffer,
			options: {
				filename: binary.fileName || 'document.pdf',
				contentType: binary.mimeType || 'application/pdf',
			},
		},
		parse_mode: String(parseMode),
		figure_caption_mode: String(figureCaptionMode),
		enable_document_hierarchy: String(enableDocumentHierarchy),
		enable_split_tables: 'false',
	};

	if (pageRange) {
		formData.page_range = pageRange;
	}

	const splitTablesEnabled = this.getNodeParameter('enableSplitTables', i, false) as boolean;
	const maxSplitTableCells = this.getNodeParameter('maxSplitTableCells', i, '') as string | number;
	if (splitTablesEnabled) {
		formData.enable_split_tables = 'true';
		if (maxSplitTableCells) {
			formData.max_split_table_cells = String(maxSplitTableCells);
		}
	}

	Object.keys(formData).forEach((key) => {
		if (formData[key] === undefined || formData[key] === null) {
			delete formData[key];
		}
	});

	// Submit parse job
	const submit = await apiRequest.call(this, {
		method: 'POST',
		uri: '/v1/parse',
		formData,
	});
	const jobId = submit?.job_id || submit?.data?.job_id;
	if (!jobId) {
		throw new NodeOperationError(this.getNode(), `No parse job id returned. Response: ${JSON.stringify(submit)}`);
	}

	return {
		json: {
			jobId,
			status: 'submitted',
			message: 'Parse job submitted successfully. Use the Parse Status operation to check progress.',
		},
		pairedItem: { item: i },
	};
}
