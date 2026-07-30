import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { metrics, announcements, notifications } from "../../../pages/Home/mockData";

export default defineTool({
  name: "get_platform_overview",
  title: "获取平台概览",
  description: "获取 APA Commander 首页概览：核心运营指标、最新平台公告与待处理通知。",
  inputSchema: {
    include_announcements: z.boolean().optional().describe("是否包含平台公告，默认包含。"),
    include_notifications: z.boolean().optional().describe("是否包含通知，默认包含。"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ include_announcements = true, include_notifications = true }) => {
    const payload = {
      metrics,
      announcements: include_announcements ? announcements : undefined,
      notifications: include_notifications ? notifications : undefined,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload as Record<string, unknown>,
    };
  },
});
