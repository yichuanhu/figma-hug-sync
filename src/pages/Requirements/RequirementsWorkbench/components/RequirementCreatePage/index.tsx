import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Typography, Steps, Button, Form, Toast, Modal, Tag, Spin, useFormState } from "@douyinfe/semi-ui";
import { ArrowLeft, Building2 } from "lucide-react";
import { Banner } from "@douyinfe/semi-ui";
import DepartmentSearchSelect from "@/components/DepartmentSearchSelect";
import { getSchemeIdByDepartment, subscribeSchemeBindingChange } from "@/mocks/departmentSchemeBinding";
import { getDepartmentName } from "@/mocks/departmentData";
import OwnerSearchSelect from "@/components/OwnerSearchSelect";
import { MOCK_CURRENT_USER } from "@/mocks/departmentData";
import {
  createRequirement,
  updateRequirement,
  getRequirementById,
  getActiveScheme,
  getDraft,
  saveDraft,
  discardDraft,
  publishChange,
  deleteRequirement,
} from "../../mockData";
import { getSchemeById, getTenantDefaultScheme } from "@/pages/Requirements/RequirementsWorkbench/schemeConfig";
import type { SchemeField, SchemeFieldDependsOn, RequirementItem, RequirementDraft } from "../../types";
import { isPostProjectStatus } from "../../utils/fieldEditability";
import { isClassificationEditable } from "../../utils/classificationEditable";
import SchemeFieldRenderer from "../SchemeFieldRenderer";
import PublishChangePanel, { ERROR_MAP } from "../PublishChangePanel";
import ClassificationTagsField, {
  type ClassificationValueMap,
  type ClassificationLoadStatus,
} from "@/components/ClassificationTagsField";
import { assignEntityClassifications, removeEntityClassifications } from "@/mocks/classification/service";
import CostBaselineSection, {
  type RequirementCostItemSnapshot,
} from "./components/CostBaselineSection";
import "./index.less";

const { Title, Text } = Typography;

/**
 * Step 字段映射（用于 next 按钮分步校验 + 错误定位）
 *   0 基本信息：title / department / owner / priority / 分类标签
 *   1 业务补充字段：scheme 自定义字段（不在此列出，由各字段 rules 触发）
 *   2 成本基线：execution_frequency / single_duration
 *   3 发布变更（仅立项后编辑）
 */
const STEP_FIELDS: Array<string[]> = [
  ["title", "department", "owner", "priority"],
  [],
  ["execution_frequency", "single_duration"],
  [],
];


/** 动态 scheme 字段渲染器 */
const SchemeFieldsRenderer = ({
  fields,
  costConfig,
}: {
  fields: SchemeField[];
  costConfig?: import("../../types").CostConfig;
}) => {
  const formState = useFormState();
  const values = (formState.values ?? {}) as Record<string, unknown>;

  const matchDep = (dep: SchemeFieldDependsOn): boolean => {
    const current = values[dep.field];
    const target = dep.value;
    switch (dep.operator) {
      case "eq":
        return current === target;
      case "ne":
        return current !== target;
      case "in":
        return Array.isArray(target) && (target as Array<string | number>).includes(current as string | number);
      case "not_in":
        return Array.isArray(target) && !(target as Array<string | number>).includes(current as string | number);
      case "gt":
        return Number(current) > Number(target);
      case "lt":
        return Number(current) < Number(target);
      case "gte":
        return Number(current) >= Number(target);
      case "lte":
        return Number(current) <= Number(target);
      default:
        return true;
    }
  };

  return (
    <>
      {fields.map((f) => {
        if (f.depends_on && !matchDep(f.depends_on)) return null;
        return <SchemeFieldRenderer key={f.key} field={f} costConfig={costConfig} />;
      })}
    </>
  );
};

const RequirementCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEdit = !!editId;

  const [editLoading, setEditLoading] = useState(isEdit);
  const [editData, setEditData] = useState<RequirementItem | null>(null);
  const isPostProjectEdit = !!editData && isPostProjectStatus(editData.status);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [departmentValue, setDepartmentValue] = useState<string | undefined>(undefined);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const dirtyRef = useRef(false);
  const [, forceTick] = useState(0);
  const setDirty = (v = true) => {
    dirtyRef.current = v;
    forceTick((k) => k + 1);
  };
  // 成本基线快照（STORY-003 v6）
  const [costItems, setCostItems] = useState<RequirementCostItemSnapshot[]>([]);
  const [legacyDeprecated, setLegacyDeprecated] = useState(false);

  // 草稿 / 发布变更 状态
  const [hasDraft, setHasDraft] = useState(false);
  const [draftLoadedAt, setDraftLoadedAt] = useState<string | null>(null);
  const [publishReason, setPublishReason] = useState("");

  const handleCostItemsChange = (next: RequirementCostItemSnapshot[]) => {
    setCostItems(next);
    setDirty(true);
  };

  // ============ 分类标签状态 ============
  const [classificationValue, setClassificationValue] = useState<ClassificationValueMap>({});
  const [classificationStatus, setClassificationStatus] = useState<ClassificationLoadStatus>("loading");
  const [forceClsError, setForceClsError] = useState(false);
  const classificationEditable = isClassificationEditable(editData?.status);
  const handleClassificationChange = (next: ClassificationValueMap) => {
    setClassificationValue(next);
    setForceClsError(false);
    setDirty(true);
  };

  // v3 (2026-05-21)：按"用户在创建页选择的所属部门"自动匹配激活方案
  // 若部门未直接绑定，回溯祖先部门尝试匹配（与 setSchemeBindingsForScheme 子部门展开规则呼应）
  const [bindingTick, setBindingTick] = useState(0);
  useEffect(() => subscribeSchemeBindingChange(() => setBindingTick((k) => k + 1)), []);

  // v15: 三级 fallback —— 部门直接命中 → 祖先继承 → 租户默认方案
  const schemeMatch = useMemo<{ id: string; source: "department" | "tenant_default" } | null>(() => {
    if (!departmentValue) return null;
    const direct = getSchemeIdByDepartment(departmentValue);
    if (direct) return { id: direct, source: "department" };

    const def = getTenantDefaultScheme();
    if (def) return { id: def.id, source: "tenant_default" };
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindingTick, departmentValue]);

  const selectedSchemeId = useMemo<string | undefined>(() => {
    if (isEdit && editData?.scheme_id) return editData.scheme_id;
    return schemeMatch?.id;
  }, [isEdit, editData, schemeMatch]);

  const activeScheme = useMemo(() => {
    if (selectedSchemeId) return getSchemeById(selectedSchemeId);
    return isEdit ? getActiveScheme() : undefined;
  }, [selectedSchemeId, isEdit]);

  const priorityOptions = useMemo(
    () => [
      { value: "HIGH", label: t("requirements.priority.high") },
      { value: "MEDIUM", label: t("requirements.priority.medium") },
      { value: "LOW", label: t("requirements.priority.low") },
    ],
    [t],
  );

  const positionLevelOptions = useMemo(
    () => [
      { value: "JUNIOR", label: "初级" },
      { value: "INTERMEDIATE", label: "中级" },
      { value: "SENIOR", label: "高级" },
      { value: "EXPERT", label: "专家" },
    ],
    [],
  );

  const executionFrequencyOptions = useMemo(
    () => [
      { value: "DAILY", label: "每天" },
      { value: "WEEKLY", label: "每周" },
      { value: "MONTHLY", label: "每月" },
      { value: "QUARTERLY", label: "每季度" },
      { value: "YEARLY", label: "每年" },
    ],
    [],
  );

  const OPTIONAL_FORM_KEYS = ["execution_frequency", "single_duration"] as const;

  const baseInitialValues = useMemo(() => {
    if (isEdit && editData) {
      const formData = (editData.form_data ?? {}) as Record<string, unknown>;
      return {
        title: editData.title,
        department: editData.owning_department_id,
        priority: editData.priority,
        ...formData,
      };
    }
    return { priority: "MEDIUM" as const };
  }, [isEdit, editData]);

  /** 加载需求 + 草稿 */
  useEffect(() => {
    if (!isEdit || !editId) return;
    let cancelled = false;
    (async () => {
      try {
        const item = await getRequirementById(editId);
        if (cancelled) return;
        if (!item) {
          Toast.error("需求不存在或已被删除");
          navigate("/requirements/list", { replace: true });
          return;
        }
        setEditData(item);
        setDepartmentValue(item.owning_department_id || undefined);
        setOwnerId(item.owner_id || MOCK_CURRENT_USER.id);
        // 还原成本基线快照（STORY-003 v6）：优先 cost_baseline.items；旧字段 position_costs 仅显示废弃提示
        const fd = (item.form_data ?? {}) as Record<string, unknown>;
        const cb = fd.cost_baseline as
          | { items?: RequirementCostItemSnapshot[]; execution_frequency?: string; single_duration?: number }
          | undefined;
        if (cb && Array.isArray(cb.items) && cb.items.length > 0) {
          setCostItems(cb.items);
        } else if (fd.position_costs || fd.position_level || fd.position_cost) {
          setLegacyDeprecated(true);
        }

        // 立项后：尝试加载草稿合并
        if (isPostProjectStatus(item.status)) {
          const draft = await getDraft(item.id);
          if (draft && !cancelled) {
            const patch = draft.patch ?? {};
            setHasDraft(true);
            setDraftLoadedAt(draft.updatedAt);
            // 草稿覆盖
            setTimeout(() => {
              if (patch.title !== undefined) formApi?.setValue?.("title", patch.title);
              if (patch.priority !== undefined) formApi?.setValue?.("priority", patch.priority);
              if (patch.form_data) {
                Object.entries(patch.form_data).forEach(([k, v]) => formApi?.setValue?.(k, v));
                const dcb = (patch.form_data as Record<string, unknown>).cost_baseline as
                  | { items?: RequirementCostItemSnapshot[]; execution_frequency?: string; single_duration?: number }
                  | undefined;
                if (dcb?.items && Array.isArray(dcb.items)) {
                  setCostItems(dcb.items);
                }
                if (dcb?.execution_frequency !== undefined) {
                  formApi?.setValue?.("execution_frequency", dcb.execution_frequency);
                }
                if (dcb?.single_duration !== undefined) {
                  formApi?.setValue?.("single_duration", dcb.single_duration);
                }
              }
            }, 0);
          }
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // formApi 在 setValue 时使用，初次为 null 时延迟到下一帧；不放入依赖避免重复加载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId]);

  const handleBack = () => {
    if (dirtyRef.current) {
      Modal.confirm({
        title: "确认离开？",
        content: "当前已填写的内容将不会保存。",
        okText: "离开",
        cancelText: "继续编辑",
        okButtonProps: { type: "danger" },
        onOk: () => navigate("/requirements/list"),
      });
      return;
    }
    navigate("/requirements/list");
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!formApi) return true;
    const fields = STEP_FIELDS[currentStep];
    try {
      if (fields.length > 0) await formApi.validate(fields);
      if (currentStep === 0) {
        if (!departmentValue) {
          Toast.warning(t("requirements.form.departmentRequired"));
          return false;
        }
        if (!isEdit && !selectedSchemeId) {
          Toast.warning("所选部门没有生效的需求模板，无法创建需求");
          return false;
        }
        // owner_id 在草稿态可留空（STORY-003 v3 §3.1 Step 6）；仅在最终提交时若需求需要进入审批环节再校验
      }
      return true;
    } catch {
      return false;
    }
  };

  // 步骤布局：
  //   0 基本信息（含分类标签）/ 1 业务补充字段 / 2 成本基线
  //   立项后编辑追加 3 发布变更
  const totalSteps = isPostProjectEdit ? 4 : 3;
  const lastFormStep = 2; // 提交按钮所在步骤（成本基线）
  const isPublishStep = isPostProjectEdit && currentStep === 3;

  const handleNext = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const handlePrev = () => setCurrentStep((s) => Math.max(0, s - 1));

  const locateFirstError = (errorFields: string[]) => {
    const step0 = new Set(["title", "department", "owner", "priority"]);
    const step2 = new Set(["execution_frequency", "single_duration"]);
    let target = 1;
    const first = errorFields[0];
    if (first) {
      if (step0.has(first)) target = 0;
      else if (step2.has(first)) target = 2;
    }
    setCurrentStep(target);
    setTimeout(() => {
      const el = document.querySelector(".requirement-create-page .semi-form-field-error-message");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  /** 收集表单值 → submitValues / patch 通用 */
  const buildSubmitValues = () => {
    const values = (formApi?.getValues?.() ?? {}) as Record<string, unknown>;
    const systemKeys = new Set(["title", "department", "priority"]);
    const form_data: Record<string, unknown> = {};
    activeScheme?.custom_fields.forEach((f) => {
      if (values[f.key] !== undefined) form_data[f.key] = values[f.key];
    });
    // 成本基线快照（STORY-003 v6 / STORY-014 v5）：整体聚合到 form_data.cost_baseline
    const execFreq = values.execution_frequency;
    const singleDur = values.single_duration;
    if (costItems.length > 0 || execFreq !== undefined || singleDur !== undefined) {
      form_data.cost_baseline = {
        items: costItems,
        execution_frequency: execFreq,
        single_duration: singleDur,
      };
    }
    const submitValues = {
      ...values,
      form_data,
      scheme_id: selectedSchemeId,
      // v3 (2026-05-21)：传递 id 与解析后的 name；'department' 字段现承载 department_id
      department: departmentValue,
      department_id: departmentValue,
      department_name: departmentValue ? getDepartmentName(departmentValue) : undefined,
      owner_id: ownerId || undefined,
    };
    Object.keys(form_data).forEach((k) => {
      if (!systemKeys.has(k)) delete (submitValues as Record<string, unknown>)[k];
    });
    return { submitValues, values, form_data };
  };

  /** 立项后构造 patch */
  const buildPatch = (): RequirementDraft["patch"] => {
    const { values, form_data } = buildSubmitValues();
    return {
      title: values.title as string | undefined,
      priority: values.priority as RequirementItem["priority"] | undefined,
      form_data,
    };
  };

  const handleSaveDraft = async () => {
    if (!editData || !isPostProjectEdit) return;
    try {
      setSavingDraft(true);
      await saveDraft(editData.id, buildPatch());
      Toast.success("草稿已保存");
      setHasDraft(true);
      setDraftLoadedAt(new Date().toISOString());
      dirtyRef.current = false;
      navigate("/requirements/list");
    } catch {
      Toast.error("草稿保存失败");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!editData) return;
    await discardDraft(editData.id);
    setHasDraft(false);
    setDraftLoadedAt(null);
    Toast.success("草稿已丢弃");
  };

  const validateClassification = (): boolean => {
    if (!classificationEditable) return true;
    if (classificationStatus === "error") {
      Toast.error("分类标签加载失败，请稍后重试");
      setCurrentStep(0);
      return false;
    }
    if (classificationStatus === "loading") {
      Toast.info("分类标签加载中，请稍候");
      return false;
    }
    if (classificationStatus === "empty") return true;
    const total = Object.values(classificationValue).reduce((sum, ids) => sum + (ids?.length ?? 0), 0);
    if (total === 0) {
      setForceClsError(true);
      setCurrentStep(0);
      setTimeout(() => {
        const el = document.querySelector("[data-classification-anchor]");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formApi) return;
    if (!departmentValue) {
      setCurrentStep(0);
      Toast.warning(t("requirements.form.departmentRequired"));
      return;
    }
    if (!isEdit && !selectedSchemeId) {
      setCurrentStep(0);
      Toast.warning("所选部门没有生效的需求模板，无法创建需求");
      return;
    }
    // owner_id 在草稿态可留空（STORY-003 v3）
    try {
      await formApi.validate();
    } catch (errors) {
      const fields = errors && typeof errors === "object" ? Object.keys(errors as Record<string, unknown>) : [];
      locateFirstError(fields);
      return;
    }

    if (!validateClassification()) return;

    // 立项后：进入发布变更步骤
    if (isPostProjectEdit && editData) {
      try {
        await saveDraft(editData.id, buildPatch());
        setHasDraft(true);
      } catch {
        // 不阻塞
      }
      setCurrentStep(3);
      return;
    }

    const buildAssignmentPayload = () =>
      Object.entries(classificationValue)
        .filter(([, ids]) => ids && ids.length > 0)
        .map(([classificationKeyId, valueIds]) => ({ classificationKeyId, valueIds }));

    const { submitValues } = buildSubmitValues();
    setSubmitting(true);
    try {
      let entityId: string;
      if (isEdit && editData) {
        await updateRequirement(editData.id, submitValues);
        entityId = editData.id;
      } else {
        const created = await createRequirement(submitValues);
        // mockData.createRequirement 返回创建的 RequirementItem
        entityId = (created as RequirementItem)?.id ?? "";
      }
      // 保存分类
      if (classificationStatus === "ready") {
        try {
          await assignEntityClassifications("requirement", entityId, buildAssignmentPayload());
        } catch {
          // 回滚需求创建
          if (!isEdit && entityId) {
            try {
              await deleteRequirement(entityId);
            } catch {
              /* ignore */
            }
            removeEntityClassifications("requirement", entityId);
          }
          Toast.error("需求创建失败：分类标签保存异常，请稍后重试");
          return;
        }
      }
      Toast.success(isEdit ? t("requirements.form.editSuccess") : t("requirements.form.createSuccess"));
      navigate("/requirements/list");
    } catch {
      Toast.error(t("requirements.form.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!editData) return;
    if (publishReason.trim().length < 10) {
      Toast.warning("变更说明至少 10 个字符");
      return;
    }
    setSubmitting(true);
    try {
      await publishChange({
        requirementId: editData.id,
        patch: buildPatch(),
        reason: publishReason.trim(),
      });
      Toast.success("变更已发布");
      setHasDraft(false);
      navigate("/requirements/list");
    } catch (e) {
      const code = (e as Error)?.message ?? "";
      Toast.error(ERROR_MAP[code] || `发布失败: ${code || "未知错误"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const draftHintTime = draftLoadedAt ? draftLoadedAt.replace("T", " ").substring(5, 16) : "";

  const titleText = isEdit
    ? isPostProjectEdit
      ? "变更需求"
      : t("requirements.form.editTitle")
    : t("requirements.form.createTitle");

  if (editLoading) {
    return (
      <div className="requirement-create-page">
        <div style={{ padding: 80, textAlign: "center" }}>
          <Spin />
        </div>
      </div>
    );
  }

  // v3 (2026-05-21)：新建态下，是否需要在 Step 0 阻断"下一步/提交"
  // 当用户已选部门但匹配不到激活方案时，需要展示"所选部门没有生效的需求模板"
  const showNoSchemeForDept = !isEdit && !!departmentValue && !activeScheme;

  return (
    <div className="requirement-create-page">
      <div className="requirement-create-page-header">
        <Button
          icon={<ArrowLeft size={16} strokeWidth={2} />}
          theme="borderless"
          type="tertiary"
          className="back-btn"
          onClick={handleBack}
        />
        <Title heading={3} className="title">
          {titleText}
        </Title>
        {isPostProjectEdit && hasDraft && (
          <Tag size="small" color="orange" style={{ marginLeft: 8 }}>
            {`已加载草稿${draftHintTime ? ` · ${draftHintTime}` : ""}`}
          </Tag>
        )}
      </div>

      <div className="requirement-create-page-steps">
        <Steps current={currentStep} type="basic">
          <Steps.Step title={t("requirements.form.steps.basicInfo")} description="标题、部门、归属人、分类标签" />
          <Steps.Step title={t("requirements.form.steps.businessFields")} description="按模版填写业务字段" />
          <Steps.Step title={t("requirements.form.steps.costBaseline")} description="选择成本项与执行频率" />
          {isPostProjectEdit && <Steps.Step title={t("requirements.form.steps.publishChange")} description="填写变更说明并发布" />}
        </Steps>
      </div>

      <div className="requirement-create-page-content">
        <div className="form-card">
          <Form
            labelPosition="top"
            initValues={baseInitialValues}
            getFormApi={setFormApi}
            onValueChange={() => setDirty(true)}
            key={editData?.id || "create"}
          >
            {/* Step 0：基本信息 + 分类标签 */}
            <div style={{ display: currentStep === 0 ? "block" : "none" }}>
              {activeScheme && departmentValue && (
                <Banner
                  type="info"
                  fullMode={false}
                  closeIcon={null}
                  style={{ marginBottom: 16 }}
                  icon={<Building2 size={16} strokeWidth={2} />}
                  description={
                    <span>
                      使用方案：<strong>{activeScheme.name}</strong> · v{activeScheme.version}
                      <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
                        {schemeMatch?.source === "tenant_default"
                          ? `（所属部门「${getDepartmentName(departmentValue)}」未配置专属方案，使用租户默认方案）`
                          : `（根据所属部门「${getDepartmentName(departmentValue)}」自动匹配）`}
                      </Text>
                    </span>
                  }
                />
              )}
              <Form.Input
                field="title"
                label={t("requirements.form.titleLabel")}
                placeholder={t("requirements.form.titlePlaceholder")}
                trigger={["blur", "change"]}
                rules={[
                  { required: true, message: t("requirements.form.titleRequired") },
                  { max: 200, message: t("requirements.form.titleMaxLength") },
                ]}
                maxLength={200}
                showClear
              />
              <Form.Slot label={{ text: t("common.owningDepartment"), required: true }}>
                <DepartmentSearchSelect
                  value={departmentValue}
                  onChange={(v) => {
                    setDepartmentValue(v);
                    formApi?.setValue?.("department", v);
                    setDirty(true);
                  }}
                  placeholder={isEdit ? t("requirements.form.departmentPlaceholder") : "请先选择所属部门以匹配需求模板"}
                  disabled={isPostProjectEdit}
                />
              </Form.Slot>
              {showNoSchemeForDept && (
                <div style={{ marginTop: -8, marginBottom: 16 }}>
                  <Banner
                    type="warning"
                    fullMode={false}
                    closeIcon={null}
                    description={
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span>所选部门没有生效的需求模板</span>
                        <Text type="tertiary" size="small">
                          请联系管理员在「需求模板」中为「{getDepartmentName(departmentValue)}
                          」配置适用方案，或选择其他已绑定方案的部门
                        </Text>
                      </div>
                    }
                  />
                </div>
              )}
              <Form.Slot label={{ text: t("requirements.form.requirementOwnerLabel"), required: true }}>
                <OwnerSearchSelect
                  value={ownerId}
                  onChange={(v) => {
                    setOwnerId(v);
                    setDirty(true);
                  }}
                  disabled={isPostProjectEdit}
                />
              </Form.Slot>
              <Form.Select
                field="priority"
                label={`${t("requirements.fields.priority")}${t("requirements.form.optionalSuffix")}`}
                placeholder={t("requirements.form.priorityPlaceholder")}
                optionList={priorityOptions}
                style={{ width: "100%" }}
              />
              <div data-classification-anchor style={{ marginTop: 8 }}>
                <ClassificationTagsField
                  entityType="requirement"
                  entityId={editData?.id}
                  value={classificationValue}
                  onChange={handleClassificationChange}
                  onStatusChange={setClassificationStatus}
                  required
                  forceShowError={forceClsError}
                  readonly={!classificationEditable}
                />
              </div>
            </div>

            {/* Step 1：业务补充字段 */}
            <div style={{ display: currentStep === 1 ? "block" : "none" }}>
              {activeScheme && activeScheme.custom_fields.length > 0 ? (
                <SchemeFieldsRenderer fields={activeScheme.custom_fields} costConfig={activeScheme.cost_config} />
              ) : (
                <Text type="tertiary">当前模版未配置自定义字段，可直接进入下一步。</Text>
              )}
            </div>

            {/* Step 2：成本基线 */}
            <div style={{ display: currentStep === 2 ? "block" : "none" }}>
              <CostBaselineSection
                value={costItems}
                onChange={(next) => {
                  setCostItems(next);
                  setDirty(true);
                }}
                legacyDeprecated={legacyDeprecated}
                executionFrequencyOptions={executionFrequencyOptions}
              />
            </div>
          </Form>

          {/* Step 3：发布变更（仅立项后编辑） */}
          {isPublishStep && editData && <PublishChangePanel reason={publishReason} onReasonChange={setPublishReason} />}
        </div>
      </div>

      <div className="requirement-create-page-footer">
        <div style={{ display: "flex", gap: 8 }}>
          {isPostProjectEdit && !isPublishStep && (
            <Button theme="borderless" type="tertiary" loading={savingDraft} onClick={handleSaveDraft}>
              保存草稿
            </Button>
          )}
          {isPostProjectEdit && hasDraft && !isPublishStep && (
            <Button theme="borderless" type="danger" onClick={handleDiscardDraft}>
              丢弃草稿
            </Button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={handleBack} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          {currentStep > 0 && (
            <Button onClick={handlePrev} disabled={submitting}>
              上一步
            </Button>
          )}
          {currentStep < lastFormStep && (
            <Button
              theme="solid"
              type="primary"
              onClick={handleNext}
              disabled={currentStep === 0 && showNoSchemeForDept}
            >
              下一步
            </Button>
          )}
          {currentStep === lastFormStep && (
            <Button
              theme="solid"
              type="primary"
              loading={submitting}
              disabled={
                classificationEditable && (classificationStatus === "error" || classificationStatus === "loading")
              }
              onClick={handleSubmit}
            >
              {isPostProjectEdit ? "下一步：发布变更" : isEdit ? t("common.save") : t("common.create")}
            </Button>
          )}
          {isPublishStep && (
            <Button
              theme="solid"
              type="primary"
              loading={submitting}
              disabled={publishReason.trim().length < 10}
              onClick={handlePublish}
            >
              发布变更
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementCreatePage;
