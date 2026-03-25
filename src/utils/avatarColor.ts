const AVATAR_COLORS = [
  'amber', 'blue', 'cyan', 'green', 'grey', 'indigo',
  'light-blue', 'light-green', 'lime', 'orange', 'pink',
  'purple', 'red', 'teal', 'violet', 'yellow',
] as const;

export function getAvatarColor(name: string): typeof AVATAR_COLORS[number] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
