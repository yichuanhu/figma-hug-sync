import type { ClassificationKey } from './types';

/**
 * FEAT-003 中适用于 requirement 的分类维度（Mock）
 * 数据来源：STORY-017 demo.json（2026-06-09）
 * 结构：分类维度 → 一级枚举值 → 二级枚举值
 */
export const MOCK_CLASSIFICATION_KEYS: ClassificationKey[] = [
  {
    id: '611f4e6e63c811f1a5f1b84da0499c2b',
    name: '场景',
    description: '需求所属业务场景',
    status: 'ACTIVE',
    node_type: 'category',
    selectable: false,
    field: 'scene_item_id',
    persist_field: 'classification_scene_item_id',
    applicableBusinessObjectTypes: ['requirement'],
    order: 1,
    children: [
      {
        id: '6120599e63c811f19256b84da0499c2b',
        category_id: '611f4e6e63c811f1a5f1b84da0499c2b',
        parent_id: '',
        name: '财务流程',
        description: '财务相关自动化场景',
        index: 1,
        path: '/6120599e63c811f19256b84da0499c2b',
        node_type: 'item',
        selectable: true,
        children: [
          {
            id: '61213ea763c811f1b1dab84da0499c2b',
            category_id: '611f4e6e63c811f1a5f1b84da0499c2b',
            parent_id: '6120599e63c811f19256b84da0499c2b',
            name: '报销处理',
            description: '报销流程处理场景',
            index: 1,
            path: '/6120599e63c811f19256b84da0499c2b/61213ea763c811f1b1dab84da0499c2b',
            node_type: 'item',
            selectable: true,
            children: [],
          },
          {
            id: '4e5c638863c911f1a574b84da0499c2b',
            category_id: '611f4e6e63c811f1a5f1b84da0499c2b',
            parent_id: '6120599e63c811f19256b84da0499c2b',
            name: '对账处理',
            description: '财务对账处理场景',
            index: 3,
            path: '/6120599e63c811f19256b84da0499c2b/4e5c638863c911f1a574b84da0499c2b',
            node_type: 'item',
            selectable: true,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: '612af12663c811f195c0b84da0499c2b',
    name: '重复性',
    description: '需求重复执行频率',
    status: 'ACTIVE',
    node_type: 'category',
    selectable: false,
    field: 'repeatability_item_id',
    persist_field: 'classification_repeatability_item_id',
    applicableBusinessObjectTypes: ['requirement'],
    order: 2,
    children: [
      {
        id: '612bd5ba63c811f1aabeb84da0499c2b',
        category_id: '612af12663c811f195c0b84da0499c2b',
        parent_id: '',
        name: '高频重复',
        description: '高频重复执行',
        index: 1,
        path: '/612bd5ba63c811f1aabeb84da0499c2b',
        node_type: 'item',
        selectable: true,
        children: [
          {
            id: '612cbac063c811f180bcb84da0499c2b',
            category_id: '612af12663c811f195c0b84da0499c2b',
            parent_id: '612bd5ba63c811f1aabeb84da0499c2b',
            name: '每日处理',
            description: '每日重复处理',
            index: 1,
            path: '/612bd5ba63c811f1aabeb84da0499c2b/612cbac063c811f180bcb84da0499c2b',
            node_type: 'item',
            selectable: true,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: '6132fdd063c811f1b80cb84da0499c2b',
    name: '操作类型',
    description: '需求涉及的主要操作类型',
    status: 'ACTIVE',
    node_type: 'category',
    selectable: false,
    field: 'operation_type_item_id',
    persist_field: 'classification_operation_type_item_id',
    applicableBusinessObjectTypes: ['requirement'],
    order: 3,
    children: [
      {
        id: '6133e2d663c811f19b17b84da0499c2b',
        category_id: '6132fdd063c811f1b80cb84da0499c2b',
        parent_id: '',
        name: '数据录入',
        description: '数据录入类操作',
        index: 1,
        path: '/6133e2d663c811f19b17b84da0499c2b',
        node_type: 'item',
        selectable: true,
        children: [
          {
            id: '6134a1b763c811f1955fb84da0499c2b',
            category_id: '6132fdd063c811f1b80cb84da0499c2b',
            parent_id: '6133e2d663c811f19b17b84da0499c2b',
            name: '表单填报',
            description: '表单填报类操作',
            index: 1,
            path: '/6133e2d663c811f19b17b84da0499c2b/6134a1b763c811f1955fb84da0499c2b',
            node_type: 'item',
            selectable: true,
            children: [],
          },
        ],
      },
    ],
  },
];

/** 在维度树中根据 itemId 找到从根开始的路径（name 列表） */
export const findItemPath = (
  children: ClassificationKey['children'],
  itemId: string,
): Array<{ id: string; name: string }> => {
  const stack: Array<{ id: string; name: string }> = [];
  const dfs = (nodes: ClassificationKey['children']): boolean => {
    for (const n of nodes) {
      stack.push({ id: n.id, name: n.name });
      if (n.id === itemId) return true;
      if (n.children && n.children.length > 0 && dfs(n.children)) return true;
      stack.pop();
    }
    return false;
  };
  return dfs(children) ? [...stack] : [];
};
