

## Plan: Add "Included Commands/APIs/Components" Sub-items to Each Component

Based on the screenshot, each component (command library) contains multiple sub-commands displayed as a table with "命令名称" (name) and "使用说明" (description) columns in the detail drawer.

### Changes

**1. Update `types.ts` — Add sub-item type**

Add a `SubCommand` interface with `name` and `description` fields, and add an optional `subCommands` array to `ComponentItem`.

**2. Update `mockData.ts` — Add sub-commands to all entries**

Add 4–8 `subCommands` entries to every mock item across all three arrays (commands, apiConnectors, customComponents). Each sub-command will be contextually relevant to the parent component. For example:

- **Slack Channel Archiver**: "Export channel messages", "Set inactivity threshold", "Batch archive channels", etc.
- **Salesforce REST Adapter**: "Query SOQL records", "Bulk upsert objects", "Manage OAuth tokens", etc.
- **PDF Parser Widget**: "Extract text by page", "Detect table boundaries", "Export images", etc.

**3. Update `ComponentDetailDrawer/index.tsx` — Display sub-commands table**

Add a new section "包含命令" (Included Commands) between the Tags and Dependencies sections. Render a Semi `Table` component with two columns:
- 命令名称 (Command Name)
- 使用说明 (Usage Description)

The section label will adapt by component type:
- `command` → "包含命令" (Included Commands)
- `apiConnector` → "包含接口" (Included APIs)  
- `customComponent` → "包含组件" (Included Components)

### Technical Details

- Sub-commands table uses Semi `Table` with `pagination={false}` and `size="small"`
- Description column text uses `ellipsis` or max-width truncation consistent with the screenshot
- New i18n keys: `sharing.detail.subCommands`, `sharing.detail.subApis`, `sharing.detail.subComponents`, `sharing.detail.subCommandName`, `sharing.detail.subCommandDesc`

