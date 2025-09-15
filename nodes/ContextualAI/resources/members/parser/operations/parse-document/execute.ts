import { IExecuteFunctions, INodeExecutionData, NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

async function apiRequest(this: IExecuteFunctions, options: any) {
	const { method, uri, qs, body, json = true, headers = {} } = options;
	const endpoint = `https://api.contextual.ai${uri}`;
	const authenticationMethod = this.getNodeParameter('authentication', 0) as string;

	const requestOptions: any = {
		method,
		qs,
		url: endpoint,
		body,
		json,
		headers: {
			accept: 'application/json',
			...headers,
		},
	};
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
	const outputTypes = this.getNodeParameter('outputTypes', i) as string;

	// Support comma-separated names; auto-pick the first available if multiple
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

	const form: any = {
		raw_file: {
			value: buffer,
			options: {
				filename: binary.fileName || 'document',
				contentType: binary.mimeType || 'application/octet-stream',
			},
		},
		parse_mode: parseMode,
		figure_caption_mode: figureCaptionMode,
		enable_document_hierarchy: enableDocumentHierarchy,
	};
	if (pageRange) form.page_range = pageRange;

	// Submit parse job
	const submit = await apiRequest.call(this, {
		method: 'POST',
		uri: '/v1/parse',
		body: form,
		json: false,
	});
	const jobId = submit?.job_id || submit?.data?.job_id;
	if (!jobId) throw new NodeOperationError(this.getNode(), 'No parse job id returned');

	// Poll status
	while (true) {
		const statusResp = await apiRequest.call(this, {
			method: 'GET',
			uri: `/v1/parse/jobs/${jobId}/status`,
		});
		const status = statusResp?.status || statusResp?.data?.status;
		if (status === 'completed') break;
		if (status === 'failed') throw new NodeOperationError(this.getNode(), 'Document parsing failed');
		await sleep(5000);
	}

	// Fetch results
	const results = await apiRequest.call(this, {
		method: 'GET',
		uri: `/v1/parse/jobs/${jobId}/results`,
		qs: { output_types: outputTypes },
	});

	return { json: results };
}
