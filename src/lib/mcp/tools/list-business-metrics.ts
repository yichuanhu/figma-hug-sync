import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SEED_METRICS } from "@/mocks/operationsMetrics/mockData";

export default defineTool({
  name: "list_business_metrics",
  title: "查询业务指标",
  description: "列出运营中心配置的业务指标（编码、名称、类型、单位、说明），可按关键字过滤。",
  inputSchema: {
    keyword: z.string().trim().optional().describe("按指标编码或名称过滤的关键字，可省略。"),
    visible_only: z.boolean().optional().describe("是否仅返回可见指标，默认返回全部。"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ keyword, visible_only }) => {
    let items = SEED_METRICS.map((m) => ({
      id: m.id,
      code: m.code,
      displayName: m.displayName,
      metricType: m.metricType,
      unit: m.unit,
      description: m.description,
      visible: m.visible,
      updatedAt: m.updatedAt,
    }));
    if (visible_only) items = items.filter((m) => m.visible);
    if (keyword) items = items.filter((m) => m.code.includes(keyword) || m.displayName.includes(keyword));

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { total: items.length, items },
    };
  },
});
