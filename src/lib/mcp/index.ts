import { defineMcp } from "@lovable.dev/mcp-js";
import listDepartmentsTool from "./tools/list-departments";
import listBusinessMetricsTool from "./tools/list-business-metrics";
import getPlatformOverviewTool from "./tools/get-platform-overview";

export default defineMcp({
  name: "apa-commander",
  title: "APA Commander",
  version: "0.1.0",
  instructions:
    "APA Commander 自动化流程管理平台的只读工具集。使用 get_platform_overview 获取平台概览指标与公告，list_departments 查询组织部门，list_business_metrics 查询运营中心的业务指标定义。当前返回的是平台演示数据。",
  tools: [getPlatformOverviewTool, listDepartmentsTool, listBusinessMetricsTool],
});
