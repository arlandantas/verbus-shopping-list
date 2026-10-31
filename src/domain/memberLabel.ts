/** Who marked an item: "você" for the current user, the member's name, or "alguém" when unknown. */
export function memberLabel(uid: string, me: string, names: Record<string, string>): string {
  if (uid === me) return 'você'
  return names[uid] ?? 'alguém'
}
