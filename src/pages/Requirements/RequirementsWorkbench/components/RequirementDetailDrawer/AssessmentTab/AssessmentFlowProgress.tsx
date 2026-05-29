/**
 * 评估流程进度时间轴
 *
 * 复用 ApprovalFlowProgress 的视觉样式（.approval-flow-progress 命名空间），
 * 将多级评估的状态映射为 finish / error / process / wait 节点，
 * 让用户在「需求评估」Tab 中一目了然当前处于哪个评估节点。
 */
import { Typography, Tag } from '@douyinfe/semi-ui';
import { Check, X, Clock, Circle } from 'lucide-react';
import type { DetailedAssessment, LevelAssessmentRecord } from '../../../types';
import type { AssessmentFlowTemplate, AssessmentLevel } from '../../../../AssessmentConfig/mockData';
import '../../ApprovalFlowProgress/index.less';

const { Text } = Typography;

type LevelStatus = 'finish' | 'error' | 'process' | 'wait';

interface Props {
  flow: AssessmentFlowConfig;
  assessment: DetailedAssessment;
}

const computeStatus = (record: LevelAssessmentRecord): LevelStatus => {
  if (record.status === 'completed') {
    return record.feasibility === 'not_feasible' ? 'error' : 'finish';
  }
  if (record.status === 'in_progress') return 'process';
  return 'wait';
};

const statusLabel = (status: LevelStatus) =>
  status === 'finish' ? '已通过' :
  status === 'error' ? '不通过' :
  status === 'process' ? '评估中' : '待评估';

const renderNodeIcon = (status: LevelStatus) => {
  if (status === 'finish') return <span className="afp-node-icon afp-node-icon--finish"><Check size={12} strokeWidth={3} /></span>;
  if (status === 'error') return <span className="afp-node-icon afp-node-icon--error"><X size={12} strokeWidth={3} /></span>;
  if (status === 'process') return <span className="afp-node-icon afp-node-icon--process"><Clock size={12} strokeWidth={3} /></span>;
  return <span className="afp-node-icon afp-node-icon--wait"><Circle size={10} strokeWidth={2} /></span>;
};

const assessorTypeLabel = (lv: AssessmentLevelConfig) =>
  lv.assessor_type === 'department_leader' ? '部门负责人' : '指定评估人';

const AssessmentFlowProgress = ({ flow, assessment }: Props) => {
  return (
    <div className="approval-flow-progress">
      <div className="approval-flow-progress__timeline">
        {flow.levels.map((lv, idx) => {
          const record = assessment.records.find((r) => r.level_id === lv.id);
          if (!record) return null;
          const status = computeStatus(record);
          const isLast = idx === flow.levels.length - 1;
          const isCurrent = status === 'process';

          return (
            <div key={lv.id} className={`afp-node afp-node--${status}`}>
              <div className="afp-node__rail">
                {renderNodeIcon(status)}
                {!isLast && <span className={`afp-node__line afp-node__line--${status}`} />}
              </div>
              <div className={`afp-node__content${isCurrent ? ' afp-node__content--current' : ''}`}>
                <div className="afp-node__head">
                  <span className="afp-node__title">
                    <Text strong size="small">{`L${lv.priority} · ${lv.name}`}</Text>
                    <Tag size="small" type="light" color="white">{assessorTypeLabel(lv)}</Tag>
                  </span>
                  <Text
                    size="small"
                    type={status === 'error' ? 'danger' : status === 'process' ? 'primary' : 'tertiary'}
                  >
                    {statusLabel(status)}
                  </Text>
                </div>

                <div className="afp-node__approvers">
                  {(record.assessor_name ? [{ name: record.assessor_name }] :
                    lv.assessor_type === 'department_leader'
                      ? [{ name: '部门负责人' }]
                      : (lv.assessor_ids ?? []).map((id) => ({ name: id }))
                  ).map((ap, i) => {
                    const apTag: 'green' | 'red' | 'orange' | 'grey' =
                      status === 'finish' ? 'green' :
                      status === 'error' ? 'red' :
                      status === 'process' ? 'orange' : 'grey';
                    const apStatusText =
                      status === 'finish' ? '已评估' :
                      status === 'error' ? '已驳回' :
                      status === 'process' ? '待评估' : '待开始';
                    return (
                      <div key={i} className="afp-approver">
                        <div className="afp-approver__row">
                          <Text size="small" className="afp-approver__name">{ap.name}</Text>
                          <Tag size="small" color={apTag} type="light">{apStatusText}</Tag>
                          {record.assessed_at && status !== 'wait' && status !== 'process' && (
                            <Text type="tertiary" size="small" className="afp-approver__time">
                              {record.assessed_at.replace('T', ' ').substring(0, 16)}
                            </Text>
                          )}
                        </div>
                        {record.comment && status !== 'process' && status !== 'wait' && (
                          <div className="afp-approver__comment">
                            <Text size="small" type="secondary">{record.comment}</Text>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssessmentFlowProgress;
