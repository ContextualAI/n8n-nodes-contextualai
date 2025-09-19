import { INodeProperties } from 'n8n-workflow';

export function runHooks(rawOption: any, properties: INodeProperties[]) {
	return { option: rawOption, properties };
}
