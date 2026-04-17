import type { ReactNode } from 'react';

interface ConfigSectionProps {
  title: string;
  children: ReactNode;
}

const ConfigSection = ({ title, children }: ConfigSectionProps) => {
  return (
    <div className="config-section">
      <div className="config-section__title">{title}</div>
      <div className="config-section__grid">{children}</div>
    </div>
  );
};

interface FieldProps {
  label: string;
  children: ReactNode;
  full?: boolean;
}

export const Field = ({ label, children, full }: FieldProps) => {
  return (
    <div className={`config-section__field ${full ? 'config-section__full' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
};

export default ConfigSection;
