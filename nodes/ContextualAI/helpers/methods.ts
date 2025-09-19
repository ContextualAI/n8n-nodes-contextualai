import { INodeType } from 'n8n-workflow';

type IMethodModule = INodeType['methods'];

export function aggregateNodeMethods(modules: IMethodModule[]): INodeType['methods'] {
	return modules.reduce((methods, module) => {
		return {
			...methods,
			...module,
		};
	}, {} as INodeType['methods']);
}
