// STORY-003-PG-LIFECYCLE-LEDGER 权限 hook
// 预留 UCI：process_lifecycle.view / process_lifecycle.adjust
export const useProcessLifecyclePermission = (_processId?: string) => ({
  canView: true,
  canAdjust: true,
});

export default useProcessLifecyclePermission;
