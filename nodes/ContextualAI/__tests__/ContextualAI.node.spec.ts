/**
 * Test suite for ContextualAI Node that validates the main node configuration and basic functionality.
 */
import { ContextualAi } from '../ContextualAi.node';

describe('ContextualAI Node', () => {
	let node: ContextualAi;

	beforeEach(() => {
		node = new ContextualAi();
	});

	describe('description', () => {
		it('should have a name property', () => {
			expect(node.description.name).toBeDefined();
			expect(node.description.name).toEqual('contextualAi');
		});

		it('should have properties defined', () => {
			expect(node.description.properties).toBeDefined();
		});

		it('should have credential properties defined', () => {
			expect(node.description.credentials).toBeDefined();
		});
	});
});
