import React, { cloneElement, isValidElement, useCallback, useMemo, useState } from 'react';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { Ellipsis } from 'lucide-react';
import './index.less';

interface TableActionDropdownProps {
  menu: React.ReactNode;
  triggerButton?: React.ReactElement;
}

const TableActionDropdown: React.FC<TableActionDropdownProps> = ({ menu, triggerButton }) => {
  const [visible, setVisible] = useState(false);

  const handleMenuItemClick = useCallback((onClick?: (event?: unknown) => void) => {
    return (event?: unknown) => {
      setVisible(false);

      window.setTimeout(() => {
        onClick?.(event);
      }, 0);
    };
  }, []);

  const enhanceMenu = useCallback((node: React.ReactNode): React.ReactNode => {
    if (!isValidElement(node)) {
      return node;
    }

    const element = node as React.ReactElement<{ children?: React.ReactNode; onClick?: (event?: unknown) => void }>;
    const nextProps: { children?: React.ReactNode; onClick?: (event?: unknown) => void } = {};

    if (element.type === Dropdown.Item) {
      nextProps.onClick = handleMenuItemClick(element.props.onClick);
    }

    if (element.props.children) {
      nextProps.children = React.Children.map(element.props.children, (child) => enhanceMenu(child));
    }

    return cloneElement(element, nextProps);
  }, [handleMenuItemClick]);

  const renderedMenu = useMemo(() => enhanceMenu(menu), [enhanceMenu, menu]);

  const defaultTrigger = (
    <Button
      icon={<Ellipsis size={16} strokeWidth={2} />}
      theme="borderless"
      type="tertiary"
    />
  );

  const trigger = triggerButton ?? defaultTrigger;

  const wrappedTrigger = cloneElement(trigger, {
    ...trigger.props,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      trigger.props.onClick?.(event);
    },
  });

  return (
    <Dropdown
      trigger="click"
      position="bottomRight"
      visible={visible}
      onVisibleChange={setVisible}
      render={renderedMenu}
    >
      {wrappedTrigger}
    </Dropdown>
  );
};

export default TableActionDropdown;