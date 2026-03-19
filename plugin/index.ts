import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const plugin = {
  id: "agentwork",
  name: "AgentWork",
  description: "基于 OpenClaw 的任务编排平台",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      workspace: {
        type: "string",
        description: "AgentWork workspace directory path"
      },
      defaultModel: {
        type: "string",
        description: "Default AI model to use for tasks"
      }
    }
  },
  register(api: OpenClawPluginApi) {
    // 注册 Agent 工具
    api.registerTool({
      id: "agentwork.decompose",
      name: "任务分解",
      description: "将复杂任务分解为可执行的子任务",
      handler: async (params: any) => {
        return await api.runtime.invoke("agentwork.decompose", params);
      }
    });

    api.registerTool({
      id: "agentwork.execute",
      name: "任务执行",
      description: "执行已分解的子任务",
      handler: async (params: any) => {
        return await api.runtime.invoke("agentwork.execute", params);
      }
    });

    api.registerTool({
      id: "agentwork.status",
      name: "任务状态",
      description: "查询任务执行状态",
      handler: async (params: any) => {
        return await api.runtime.invoke("agentwork.status", params);
      }
    });

    // 注册 HTTP API
    api.registerHttpRoute({
      method: "POST",
      path: "/api/v1/tasks",
      handler: async (req: any) => {
        const { task, options } = req.body;
        return await api.runtime.invoke("agentwork.createTask", { task, options });
      }
    });

    api.registerHttpRoute({
      method: "GET",
      path: "/api/v1/tasks/:id",
      handler: async (req: any) => {
        const { id } = req.params;
        return await api.runtime.invoke("agentwork.getTask", { id });
      }
    });

    api.registerHttpRoute({
      method: "GET",
      path: "/api/v1/tasks",
      handler: async (req: any) => {
        return await api.runtime.invoke("agentwork.listTasks", req.query);
      }
    });

    // 注册 CLI 命令
    api.registerCliCommand({
      name: "agentwork",
      description: "AgentWork 任务管理",
      subcommands: [
        {
          name: "create",
          description: "创建新任务",
          handler: async (args: string[]) => {
            const task = args.join(" ");
            const result = await api.runtime.invoke("agentwork.createTask", { task });
            console.log(`任务已创建：${result.id}`);
          }
        },
        {
          name: "list",
          description: "列出所有任务",
          handler: async () => {
            const tasks = await api.runtime.invoke("agentwork.listTasks", {});
            console.log(JSON.stringify(tasks, null, 2));
          }
        },
        {
          name: "status",
          description: "查询任务状态",
          handler: async (args: string[]) => {
            const [taskId] = args;
            const status = await api.runtime.invoke("agentwork.getTask", { id: taskId });
            console.log(JSON.stringify(status, null, 2));
          }
        }
      ]
    });
  },
};

export default plugin;

// 导出工具函数供外部使用
export { plugin as agentworkPlugin };
