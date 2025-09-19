import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export const name = 'Parse Result';

const baseOption: INodePropertyOptions = {
    name: name,
    value: name,
    description: 'Get the results of a parse job',
    action: 'Parse Result',
};

export const rawProperties: INodeProperties[] = [
    {
        displayName: 'Job ID',
        name: 'jobId',
        type: 'string',
        default: '',
        description: 'ID of the parse job to retrieve results for',
        displayOptions: { show: { resource: ['Parser'], operation: [name] } },
        required: true,
    },
    {
        displayName: 'Output Types',
        name: 'outputTypes',
        type: 'string',
        default: 'markdown-document',
        description: 'Comma-separated list: markdown-document, markdown-per-page, blocks-per-page',
        displayOptions: { show: { resource: ['Parser'], operation: [name] } },
    },
];

export const option = baseOption;
export const properties = rawProperties;

export { parseResult } from './execute';


