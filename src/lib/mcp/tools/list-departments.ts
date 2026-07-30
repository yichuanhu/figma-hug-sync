import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { departmentTree } from "@/mocks/departmentData";

interface DeptNode {
  id: string;
  name: string;
  children?: DeptNode[];
}

const flatten = (nodes: DeptNode[], path: string[] = []): Array<{ id: string; name: string; path: string }> =>
  nodes.flatMap((node) => {
    const nextPath = [...path, node.name];
    return [
      { id: node.id, name: node.name, path: nextPath.join(" / ") },
      ...flatten((node.children ?? []) as DeptNode[], nextPath),
    ];
  });

export default defineTool({
  name: "list_departments",
  title: "查询部门列表",
  description: "列出 APA Commander 平台的组织部门（含层级路径），可按名称关键字过滤。",
  inputSchema: {
    keyword: z.string().trim().optional().describe("按部门名称过滤的关键字，可省略。"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ keyword }) => {
    const all = flatten(departmentTree as unknown as DeptNode[]);
    const items = keyword ? all.filter((d) => d.name.includes(keyword) || d.path.includes(keyword)) : all;
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { total: items.length, items },
    };
  },
});
