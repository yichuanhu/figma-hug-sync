import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Typography, Button, Toast, Modal, Space, Tag, Spin, Tooltip, Input, Banner } from "@douyinfe/semi-ui";
import { ChevronLeft, Save, Play, CheckCircle, Pencil, Building2, Star } from "lucide-react";

import {
  getSchemeById,
  getActiveSchemes,
  updateSchemeBuilder,
  validateScheme,
  activateSchemeBuilder,
  setSchemeAsDefault,
  subscribeSchemeChange,
  createSchemeDraft,
  SchemeError,
} from "@/pages/Requirements/RequirementsWorkbench/schemeConfig";
import type { RequirementScheme } from "@/pages/Requirements/RequirementsWorkbench/types";
import DepartmentPicker from "@/components/DepartmentPicker";
import {
  setSchemeBindingsForScheme,
  getOccupiedDepartmentMapByScheme,
  getBoundDepartmentCountMapByScheme,
} from "@/mocks/departmentSchemeBinding";
import { getDepartmentName, expandDepartmentIdsWithDescendants } from "@/mocks/departmentData";
import { computeDeptDisabledOptions } from "@/pages/Requirements/_shared/computeDeptDisabledOptions";
import FormBuilder from "./FormBuilder";
import { validateAllFields } from "./FormBuilder/validators";
import TestDriveModal from "./TestDriveModal";
import "./index.less";
import "@/pages/Requirements/ApprovalConfig/components/ApprovalFlowBuilder/index.less";

const { Title, Text } = Typography;

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** v15 编辑模式 */
type EditMode = "preset" | "tenant_default" | "custom_active" | "custom_inactive";

const resolveEditMode = (s: RequirementScheme): EditMode => {
  if (s.is_preset) return "preset";
  if (s.is_tenant_default) return "tenant_default";
  if (s.status === "active") return "custom_active";
  return "custom_inactive";
};

const buildEmptyDraft = (): RequirementScheme => ({
  id: "__new__",
  code: `CUSTOM-${Date.now().toString(36).toUpperCase()}`,
  name: "未命名模版",
  version: "1.0.0",
  description: undefined,
  status: "inactive",
  is_preset: false,
  is_draft: true,
  custom_fields: [],
  approval_flow: { levels: [] },
  workflow_config: { template: "simple", states: [], approvers: [], assessors: [] },
  cost_config: { working_hours_per_day: 8, currency: "CNY", default_rate: 500, rate_table_v2: [] },
  created_at: new Date().toISOString(),
  created_by: "current-user",
});

const SchemeBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const presetSourceId = searchParams.get("preset");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isNewMode = id === "new";

  const buildDraftFromPreset = useCallback((sourceId: string): RequirementScheme | null => {
    const src = getSchemeById(sourceId);
    if (!src) return null;
    const draft = buildEmptyDraft();
    return {
      ...draft,
      name: `${src.name}（副本）`,
      description: src.description,
      custom_fields: src.custom_fields ? src.custom_fields.map((f) => ({ ...f })) : [],
      value_assessment_model: src.value_assessment_model,
      complexity_assessment_model: src.complexity_assessment_model,
      workflow_config: src.workflow_config,
      cost_config: src.cost_config,
      approval_flow: src.approval_flow,
      source_preset_key: src.is_preset ? src.code : src.source_preset_key,
    };
  }, []);

  const initialScheme = isNewMode
    ? presetSourceId
      ? (buildDraftFromPreset(presetSourceId) ?? buildEmptyDraft())
      : buildEmptyDraft()
    : id
      ? (getSchemeById(id) ?? null)
      : null;
  const [savedScheme, setSavedScheme] = useState<RequirementScheme | null>(isNewMode ? null : initialScheme);
  const [draftScheme, setDraftScheme] = useState<RequirementScheme | null>(initialScheme);
  const [dirty, setDirty] = useState(isNewMode && !!presetSourceId);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [testDriveVisible, setTestDriveVisible] = useState(false);
  const [loading, setLoading] = useState(!initialScheme);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const editMode: EditMode = useMemo(() => {
    if (isNewMode) return "custom_inactive";
    return savedScheme ? resolveEditMode(savedScheme) : "custom_inactive";
  }, [savedScheme, isNewMode]);
  const isReadOnly = editMode === "preset";
  const isFormReadOnly = editMode === "preset";
  const showDeptBlock = editMode === "custom_active" || editMode === "custom_inactive";
  const showTestDrive =
    !isNewMode && (editMode === "tenant_default" || editMode === "custom_inactive" || editMode === "custom_active");
  const canEditName = editMode === "tenant_default" || editMode === "custom_inactive" || editMode === "custom_active";

  // 进入页面：解析方案并完成初始化（v15: 不再对已激活方案派生新版本，改为 custom_active 模式）
  useEffect(() => {
    if (!id || isNewMode) return;
    (async () => {
      let s = getSchemeById(id);
      if (!s) {
        await new Promise((r) => setTimeout(r, 0));
        s = getSchemeById(id);
      }
      if (!s) {
        Toast.error(t("requirements.scheme.builder.notFound"));
        navigate("/requirements/scheme");
        return;
      }
      setSavedScheme(s);
      setDraftScheme(s);
      setDirty(false);
      setLoading(false);
      if (s.updated_at) {
        Toast.info({
          content: t("requirements.scheme.builder.draftLoadedAt", { time: formatTime(s.updated_at) }),
          duration: 3,
        });
      }
    })();
  }, [id, navigate, t, isNewMode]);

  // 订阅外部 store 变化
  useEffect(() => {
    if (isNewMode) return;
    return subscribeSchemeChange(() => {
      if (!id) return;
      const s = getSchemeById(id);
      if (!s) return;
      setSavedScheme(s);
      if (!dirtyRef.current) setDraftScheme(s);
    });
  }, [id, isNewMode]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const patch = useCallback((partial: Partial<RequirementScheme>) => {
    setDraftScheme((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  }, []);

  /** 统一 SchemeError → Toast/Modal */
  const handleSchemeError = (e: unknown) => {
    if (e instanceof SchemeError) {
      if (e.code === "SCHEME_DEPARTMENT_CONFLICT") {
        const conflicts = (e.details as { conflicts?: string[] } | undefined)?.conflicts ?? [];
        Modal.error({
          title: "存在部门冲突",
          content: (
            <div>
              <div style={{ marginBottom: 8 }}>{e.message}</div>
              {conflicts.length > 0 && (
                <Text type="tertiary" size="small">
                  冲突部门：{conflicts.slice(0, 5).map(getDepartmentName).join("、")}
                  {conflicts.length > 5 ? ` 等 ${conflicts.length} 个` : ""}
                </Text>
              )}
            </div>
          ),
        });
      } else if (
        ["SCHEME_BOUND_CANNOT_SET_DEFAULT", "SCHEME_DEFAULT_CANNOT_ACTIVATE", "SCHEME_DEFAULT_UNAVAILABLE"].includes(
          e.code,
        )
      ) {
        Modal.error({ title: "操作不允许", content: e.message });
      } else {
        Toast.warning(e.message);
      }
    } else {
      Toast.error((e as Error).message ?? "操作失败");
    }
  };

  const handleSaveDraft = async () => {
    if (!draftScheme || isReadOnly) return;
    const selectedDeptIds = draftScheme.applicable_department_ids ?? [];
    const expandedDeptIds = expandDepartmentIdsWithDescendants(selectedDeptIds);

    // 新建模式：先 createSchemeDraft 落库，再用 updateSchemeBuilder 写入当前编辑内容
    if (isNewMode) {
      const fv = validateAllFields(draftScheme.custom_fields ?? []);
      if (fv.hasError) {
        Toast.error(`字段配置存在 ${fv.errorFieldKeys.length} 项问题，请先修正`);
        return;
      }
      try {
        const created = await createSchemeDraft({
          name: draftScheme.name,
          description: draftScheme.description,
          version: draftScheme.version,
        });
        const updated = await updateSchemeBuilder(created.id, {
          name: draftScheme.name,
          description: draftScheme.description,
          custom_fields: draftScheme.custom_fields,
          value_assessment_model: draftScheme.value_assessment_model,
          complexity_assessment_model: draftScheme.complexity_assessment_model,
          workflow_config: draftScheme.workflow_config,
          cost_config: draftScheme.cost_config,
          approval_flow: draftScheme.approval_flow,
          applicable_department_ids: selectedDeptIds,
          source_preset_key: draftScheme.source_preset_key,
        });
        setSchemeBindingsForScheme(updated.id, expandedDeptIds);
        setDirty(false);
        Toast.success("已保存");
        navigate(`/requirements/scheme/builder/${updated.id}`, { replace: true });
      } catch (e) {
        handleSchemeError(e);
      }
      return;
    }

    // custom_active：完整保存 + 部门冲突校验（与激活相同）
    if (editMode === "custom_active") {
      const fv = validateAllFields(draftScheme.custom_fields ?? []);
      if (fv.hasError) {
        Toast.error(`字段配置存在 ${fv.errorFieldKeys.length} 项问题，请先修正`);
        return;
      }
      if (selectedDeptIds.length === 0) {
        Toast.warning("请至少选择一个适用部门");
        return;
      }
      // 部门冲突校验（排除自身与租户默认方案）
      const activeIds = getActiveSchemes()
        .filter((s) => s.id !== draftScheme.id && !s.is_tenant_default)
        .map((s) => s.id);
      const occupied = getOccupiedDepartmentMapByScheme(draftScheme.id, activeIds);
      const conflicts = expandedDeptIds.filter((d) => occupied[d]);
      if (conflicts.length > 0) {
        const ownerName = getSchemeById(occupied[conflicts[0]])?.name ?? "其他方案";
        Modal.error({
          title: "存在部门冲突",
          content: (
            <div>
              <div style={{ marginBottom: 8 }}>部门已被方案「{ownerName}」占用，请调整适用部门</div>
              <Text type="tertiary" size="small">
                冲突部门：{conflicts.slice(0, 5).map(getDepartmentName).join("、")}
                {conflicts.length > 5 ? ` 等 ${conflicts.length} 个` : ""}
              </Text>
            </div>
          ),
        });
        return;
      }
      try {
        const updated = await updateSchemeBuilder(draftScheme.id, {
          name: draftScheme.name,
          description: draftScheme.description,
          custom_fields: draftScheme.custom_fields,
          value_assessment_model: draftScheme.value_assessment_model,
          complexity_assessment_model: draftScheme.complexity_assessment_model,
          workflow_config: draftScheme.workflow_config,
          cost_config: draftScheme.cost_config,
          approval_flow: draftScheme.approval_flow,
          applicable_department_ids: selectedDeptIds,
        });
        setSchemeBindingsForScheme(draftScheme.id, expandedDeptIds);
        setSavedScheme(updated);
        setDraftScheme(updated);
        setDirty(false);
        Toast.success("已保存");
      } catch (e) {
        handleSchemeError(e);
      }
      return;
    }

    // tenant_default / custom_inactive：完整保存
    const fv = validateAllFields(draftScheme.custom_fields ?? []);
    if (fv.hasError) {
      Toast.error(`字段配置存在 ${fv.errorFieldKeys.length} 项问题，请先修正`);
      return;
    }

    try {
      const updated = await updateSchemeBuilder(draftScheme.id, {
        name: draftScheme.name,
        description: draftScheme.description,
        custom_fields: draftScheme.custom_fields,
        value_assessment_model: draftScheme.value_assessment_model,
        complexity_assessment_model: draftScheme.complexity_assessment_model,
        workflow_config: draftScheme.workflow_config,
        cost_config: draftScheme.cost_config,
        approval_flow: draftScheme.approval_flow,
        // 默认方案不带适用部门
        applicable_department_ids: editMode === "tenant_default" ? [] : selectedDeptIds,
      });
      if (editMode !== "tenant_default") {
        setSchemeBindingsForScheme(draftScheme.id, expandedDeptIds);
      }
      setSavedScheme(updated);
      setDraftScheme(updated);
      setDirty(false);
      const v = validateScheme(updated.id);
      Toast.success(t("requirements.scheme.builder.savedDraft"));
      if (!v.ok) {
        Modal.warning({
          title: t("requirements.scheme.builder.incompleteTitle"),
          content: (
            <div>
              <div style={{ marginBottom: 8 }}>{t("requirements.scheme.builder.incompleteHint")}</div>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {v.errors.map((e, i) => (
                  <li key={i} style={{ color: "var(--semi-color-warning)" }}>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          ),
          okText: t("common.confirm"),
        });
      }
    } catch (e) {
      handleSchemeError(e);
    }
  };

  const handleActivate = () => {
    if (!draftScheme || editMode !== "custom_inactive") return;
    if (dirty) {
      Toast.warning(t("requirements.scheme.builder.activateDirty"));
      return;
    }
    const deptIds = draftScheme.applicable_department_ids ?? [];
    if (deptIds.length === 0) {
      Toast.warning("请先选择「适用部门」，激活时至少选择 1 个部门");
      return;
    }
    Modal.confirm({
      title: t("requirements.scheme.builder.activateTitle"),
      content: t("requirements.scheme.builder.activateContent", { name: draftScheme.name }),
      okText: t("requirements.scheme.activate"),
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await activateSchemeBuilder(draftScheme.id);
          Toast.success(t("requirements.scheme.activateSuccess"));
          setDirty(false);
          navigate("/requirements/scheme");
        } catch (e) {
          handleSchemeError(e);
        }
      },
    });
  };

  const handleSetAsDefault = () => {
    if (!draftScheme || editMode !== "custom_inactive") return;
    if (dirty) {
      Toast.warning("请先保存当前修改后再设为默认");
      return;
    }
    Modal.confirm({
      title: "设为默认方案？",
      content: `将「${draftScheme.name}」设为新的租户默认方案。原默认方案会被自动停用，无部门绑定的方案才能设为默认。`,
      okText: "设为默认",
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await setSchemeAsDefault(draftScheme.id);
          Toast.success("已设为默认方案");
          navigate("/requirements/scheme");
        } catch (e) {
          handleSchemeError(e);
        }
      },
    });
  };

  const guardedNavigate = useCallback(
    (to: string) => {
      // 新建模式：如果只是初始未编辑，直接走；否则提示「放弃创建」
      if (isNewMode) {
        if (!dirty) {
          navigate(to);
          return;
        }
        Modal.confirm({
          title: "放弃创建？",
          content: "此次新建的内容尚未保存，离开后将不保留。",
          okText: "放弃",
          cancelText: "继续编辑",
          okButtonProps: { type: "danger" },
          onOk: () => {
            setDirty(false);
            navigate(to);
          },
        });
        return;
      }
      if (!dirty) {
        navigate(to);
        return;
      }
      Modal.confirm({
        title: t("requirements.scheme.builder.leaveTitle"),
        content: t("requirements.scheme.builder.leaveContent"),
        okText: t("requirements.scheme.builder.leaveOk"),
        cancelText: t("requirements.scheme.builder.leaveCancel"),
        okButtonProps: { type: "danger" },
        onOk: () => {
          setDirty(false);
          navigate(to);
        },
      });
    },
    [dirty, navigate, t, isNewMode],
  );

  const handleCancel = () => guardedNavigate("/requirements/scheme");

  if (loading || !draftScheme) {
    return (
      <div className="scheme-builder-loading">
        <Spin size="large" />
      </div>
    );
  }

  const hasBinding = (getBoundDepartmentCountMapByScheme()[draftScheme.id] ?? 0) > 0;

  return (
    <div className="scheme-builder">
      <div className="scheme-builder-header">
        <div className="scheme-builder-header-left">
          <Tooltip content={t("common.back")} position="bottom">
            <Button
              icon={<ChevronLeft size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              onClick={() => guardedNavigate("/requirements/scheme")}
            />
          </Tooltip>
          {editingName && canEditName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={setNameDraft}
              onBlur={() => {
                const v = (nameDraft || "").trim();
                if (v && v !== draftScheme.name) patch({ name: v });
                setEditingName(false);
              }}
              onEnterPress={() => {
                const v = (nameDraft || "").trim();
                if (v && v !== draftScheme.name) patch({ name: v });
                setEditingName(false);
              }}
              maxLength={50}
              style={{ width: 240, fontSize: 18, fontWeight: 600 }}
            />
          ) : (
            <Title
              heading={3}
              className="scheme-builder-header-title"
              style={{
                cursor: canEditName ? "pointer" : "default",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={
                canEditName
                  ? () => {
                      setNameDraft(draftScheme.name);
                      setEditingName(true);
                    }
                  : undefined
              }
            >
              {draftScheme.name}
              {canEditName && <Pencil size={14} strokeWidth={2} style={{ color: "var(--semi-color-text-2)" }} />}
            </Title>
          )}
          <Text type="tertiary">v{draftScheme.version}</Text>
          {editMode === "preset" && (
            <Tag color="blue" type="light" size="small">
              {t("requirements.scheme.preset")}
            </Tag>
          )}
          {editMode === "tenant_default" && (
            <Tag color="violet" type="light" size="small" prefixIcon={<Star size={12} strokeWidth={2} />}>
              默认
            </Tag>
          )}
          {editMode === "custom_active" && (
            <Tag color="green" type="light" size="small">
              已启用
            </Tag>
          )}
          {dirty && (
            <Tag color="red" type="light" size="small">
              {t("requirements.scheme.builder.unsaved")}
            </Tag>
          )}
        </div>
        <Space>
          {showTestDrive && (
            <Button icon={<Play size={16} strokeWidth={2} />} onClick={() => setTestDriveVisible(true)}>
              {t("requirements.scheme.builder.testDrive")}
            </Button>
          )}
          
          {!isReadOnly && (
            <Button
              icon={<Save size={16} strokeWidth={2} />}
              theme={isNewMode || dirty ? "solid" : "light"}
              type={isNewMode || dirty ? "primary" : "tertiary"}
              onClick={handleSaveDraft}
              disabled={!isNewMode && !dirty}
            >
              {isNewMode || editMode === "custom_active" ? "保存" : t("requirements.scheme.builder.saveDraft")}
            </Button>
          )}
          {!isNewMode && editMode === "custom_inactive" && (
            <Tooltip content={hasBinding ? "有部门绑定的方案不能设为默认，请先清空适用部门" : ""} position="bottom">
              <Button icon={<Star size={16} strokeWidth={2} />} disabled={hasBinding} onClick={handleSetAsDefault}>
                设为默认
              </Button>
            </Tooltip>
          )}
          {!isNewMode && editMode === "custom_inactive" && (
            <Button
              icon={<CheckCircle size={16} strokeWidth={2} />}
              theme="solid"
              type="primary"
              onClick={handleActivate}
            >
              {t("requirements.scheme.activate")}
            </Button>
          )}
        </Space>
      </div>

      {editMode === "custom_active" && (
        <Banner
          type="info"
          description="正在编辑已激活方案，保存后将直接覆盖配置，适用部门变更会同步生效绑定"
          fullMode={false}
          closeIcon={null}
          style={{ marginBottom: 12 }}
        />
      )}

      {showDeptBlock &&
        (() => {
          const deptIds = draftScheme.applicable_department_ids ?? [];
          const activeIds = getActiveSchemes().map((s) => s.id);
          const disabledOptions = computeDeptDisabledOptions(
            getOccupiedDepartmentMapByScheme(draftScheme.id, activeIds),
            (ownerId) => getSchemeById(ownerId)?.name ?? "其他方案",
          );
          return (
            <div className="approval-flow-section-card" style={{ marginBottom: 16 }}>
              <div className="approval-flow-section-card-header">
                <div className="approval-flow-section-card-title">
                  <Building2 size={16} strokeWidth={2} />
                  <span>适用部门</span>
                  <Text type="danger" size="small" style={{ marginLeft: 2 }}>
                    *
                  </Text>
                  <Text type="tertiary" size="small" style={{ marginLeft: 4, fontWeight: 400 }}>
                    （激活时必填，可稍后填写）
                  </Text>
                </div>
                <Text type="tertiary" size="small">
                  已被其他生效方案占用的部门将不可选；这里只保存显式选择的部门，激活时系统会按当前部门树展开子部门并写入生效绑定。
                </Text>
              </div>
              <div className="approval-flow-section-card-body" style={{ padding: "4px 4px 0" }}>
                <div style={{ maxWidth: 600 }}>
                  <DepartmentPicker
                    value={deptIds}
                    onChange={(v) => patch({ applicable_department_ids: v ?? [] })}
                    placeholder="请选择适用部门（可多选，仅保存显式选择；激活时展开子部门）"
                    maxTagCount={6}
                    disabledOptions={disabledOptions}
                  />
                </div>
              </div>
            </div>
          );
        })()}

      <div
        className="scheme-builder-body"
        style={isFormReadOnly ? { pointerEvents: "none", opacity: 0.7, userSelect: "none" } : undefined}
        aria-disabled={isFormReadOnly}
        title={editMode === "preset" ? "预设方案完全只读，请基于预设创建副本后再修改" : undefined}
      >
        <FormBuilder fields={draftScheme.custom_fields} onChange={(fields) => patch({ custom_fields: fields })} />
      </div>

      <TestDriveModal visible={testDriveVisible} scheme={draftScheme} onClose={() => setTestDriveVisible(false)} />
    </div>
  );
};

export default SchemeBuilderPage;
