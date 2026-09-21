/**
 * Tool Registry
 * Registers and manages all tools available to the assistant engine.
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(tool) {
    if (!tool || !tool.name || typeof tool.handler !== 'function') {
      throw new Error('Tool must have a name and a handler function');
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name) {
    return this.tools.get(name);
  }

  has(name) {
    return this.tools.has(name);
  }

  list() {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  listForProfile(allowedNames = []) {
    if (!allowedNames || allowedNames.length === 0) return [];
    return allowedNames
      .filter((name) => this.tools.has(name))
      .map((name) => {
        const tool = this.tools.get(name);
        return {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        };
      });
  }

  async execute(name, args = {}, context = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool '${name}' not found` };
    }
    try {
      const result = await tool.handler(args, context);
      return { success: true, result };
    } catch (error) {
      console.error(`Tool '${name}' execution error:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

const toolRegistry = new ToolRegistry();

module.exports = toolRegistry;
module.exports.ToolRegistry = ToolRegistry;