export function requireDangerConfirm(
  dangerConfirm: string | undefined,
  expected: string
): boolean {
  return dangerConfirm === expected;
}

export function requireConfirm(
  confirm: boolean,
  dry_run: boolean
): boolean {
  return !dry_run && !confirm;
}