import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { runHooks } from './hooks';

export const name = 'Create Agent';

const baseOption: INodePropertyOptions = {
	name: name,
	value: name,
	description: 'Create agent, datastore, and upload documents',
	action: 'Create Agent',
};

export const rawProperties: INodeProperties[] = [
	{
		displayName: 'Agent Name',
		name: 'agentName',
		type: 'string',
		default: '',
		description: 'Name for the new agent',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Agent Description',
		name: 'agentDescription',
		type: 'string',
		default: '',
		description: "Description of the agent's purpose",
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Datastore Name',
		name: 'datastoreName',
		type: 'string',
		default: '',
		description: 'Name for the document datastore',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Datastore IDs',
		name: 'datastoreIds',
		type: 'string',
		default: '',
		description:
			'Comma-separated list of datastore IDs to associate. Provide either this or Datastore Name.',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Input Binary Field(s)',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description:
			"Binary field name(s) on the input item to ingest",
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Document Metadata (JSON String)',
		name: 'documentMetadata',
		type: 'string',
		default: '',
		description:
			"Stringified JSON metadata to attach to each uploaded file, e.g. {\"custom_metadata\": {\"topic\": \"science\"}}",
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'System Prompt',
		name: 'systemPrompt',
		type: 'string',
		default: '',
		description: 'Instructions the agent references when generating responses',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'No Retrieval System Prompt',
		name: 'noRetrievalSystemPrompt',
		type: 'string',
		default: '',
		description: 'Instructions when there are no relevant retrievals',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Multiturn System Prompt',
		name: 'multiturnSystemPrompt',
		type: 'string',
		default: '',
		description: 'Instructions for handling multi-turn conversations',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Filter Prompt',
		name: 'filterPrompt',
		type: 'string',
		default: '',
		description: 'Prompt used to filter irrelevant chunks',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Suggested Queries',
		name: 'suggestedQueries',
		type: 'string',
		default: '',
		description: 'Comma-separated list of suggested queries shown in UI',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
	{
		displayName: 'Agent Configs (JSON String)',
		name: 'agentConfigs',
		type: 'string',
		default: '',
		description:
			'Optional advanced agent configuration as stringified JSON. Maps to agent_configs in API.',
		displayOptions: { show: { resource: ['Agent'], operation: [name] } },
	},
];

const { properties, option } = runHooks(baseOption, rawProperties);

export { properties, option };
