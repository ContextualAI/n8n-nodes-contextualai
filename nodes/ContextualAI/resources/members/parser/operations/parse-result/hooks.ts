import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

export function runHooks(baseOption: INodePropertyOptions, rawProperties: INodeProperties[]) {
    return {
        properties: rawProperties,
        option: baseOption,
    };
}


