import {
	IDataObject,
	INodeType,
	INodeTypeData,
	INodeTypes,
	IVersionedNodeType,
	NodeHelpers,
} from 'n8n-workflow';
import { ContextualAi } from '../../ContextualAi.node';
import { StartNode } from './Start/Start.node';

export class NodeTypesClass implements INodeTypes {
	nodeTypes: INodeTypeData = {};
	getByName(nodeType: string): INodeType | IVersionedNodeType {
		return this.nodeTypes[nodeType].type;
	}

	getKnownTypes(): IDataObject {
		return this.nodeTypes;
	}

	addNode(nodeTypeName: string, nodeType: INodeType | IVersionedNodeType) {
		const loadedNode = {
			[nodeTypeName]: {
				sourcePath: '',
				type: nodeType,
			},
		};

		this.nodeTypes = {
			...this.nodeTypes,
			...loadedNode,
		};

		Object.assign(this.nodeTypes, loadedNode);
	}

	getByNameAndVersion(nodeType: string, version?: number): INodeType {
		if (!this.nodeTypes[nodeType]) {
			throw new Error(`Node type "${nodeType}" not found`);
		}
		return NodeHelpers.getVersionedNodeType(this.nodeTypes[nodeType].type, version);
	}
}

const nodeTypes = new NodeTypesClass();

nodeTypes.addNode('n8n-nodes-contextualai.contextualAi', new ContextualAi());
nodeTypes.addNode('n8n-nodes-base.start', new StartNode());

export { nodeTypes };
