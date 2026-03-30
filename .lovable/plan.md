

## Plan: Optimize Long Description Display for Parameter Help Icons

### Problem
The question mark (?) icon next to process input parameters uses a plain `Tooltip` to show descriptions. When descriptions are very long (up to 2000 characters), the tooltip becomes unwieldy — too wide, overflows the viewport, and is hard to read.

### Solution
Replace the `Tooltip` with a `Popover` that has:
- Fixed max-width (360px) and max-height (200px)
- Internal scrolling (`overflow-y: auto`) for long content
- `wordBreak: break-word` for proper text wrapping
- Trigger on hover (consistent with current behavior)

### Affected Files (6 locations with the same pattern)

1. **`src/pages/Scheduling/TaskManagement/components/CreateTaskModal/index.tsx`** (line 247)
2. **`src/pages/Scheduling/TemplateManagement/TemplateManagementPage/components/CreateTemplateModal/index.tsx`** (line 185)
3. **`src/pages/Scheduling/TemplateManagement/TemplateManagementPage/components/EditTemplateModal/index.tsx`** (line 202)
4. **`src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/CreateQueueTriggerModal/index.tsx`** (line 222)
5. **`src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/EditQueueTriggerModal/index.tsx`** (line 255)

### Change Detail

In each file, replace:
```tsx
<Tooltip content={param.description}>
  <IconHelpCircleStroked ... />
</Tooltip>
```

With:
```tsx
<Popover
  content={
    <div style={{ maxWidth: 320, maxHeight: 200, overflowY: 'auto', wordBreak: 'break-word', fontSize: 12, lineHeight: '20px' }}>
      {param.description}
    </div>
  }
  trigger="hover"
  position="topLeft"
  showArrow
>
  <IconHelpCircleStroked ... />
</Popover>
```

Import `Popover` from `@douyinfe/semi-ui` in each file (replacing or adding to existing imports).

### Why Popover over Tooltip
- `Popover` supports rich content with scrolling containers
- `Tooltip` is designed for short text and doesn't handle overflow well
- Consistent with the project's existing `long-text-scroll-standard` pattern (max-height + overflow-y: auto)

