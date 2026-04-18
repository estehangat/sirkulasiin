export function isPayoutAdmin(email?: string | null) {
  const raw = process.env.PAYOUT_ADMIN_EMAILS;
  if (!raw) return false;

  const allow = new Set(
    raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  );

  return !!email && allow.has(email.toLowerCase());
}
