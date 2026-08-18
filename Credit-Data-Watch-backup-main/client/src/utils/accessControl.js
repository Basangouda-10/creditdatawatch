// Lightweight access control helper for frontend gating only.
// Backend must enforce the same rules with real auth + subscriptions.

export const Feature = {
  REPORT_OVERDUE: 'report_overdue',
  CREDIT_REPORTS: 'credit_reports',
  AUTO_FOLLOWUPS: 'auto_followups',
  SETTLEMENT: 'settlement',
  PO_MANAGEMENT: 'po_management',
}

export function hasActiveSubscription(session) {
  return Boolean(session?.subscription?.active && !session.subscription.expired)
}

export function hasPaidPlan(session) {
  const tier = session?.subscription?.plan || ''
  return hasActiveSubscription(session) && ['royal', 'groups', 'enterprise'].includes(tier)
}

export function canUseFeature(session, feature) {
  if (!session?.user) return false
  switch (feature) {
    case Feature.REPORT_OVERDUE:
      return Boolean(session.user.gstin && hasActiveSubscription(session))
    case Feature.CREDIT_REPORTS:
    case Feature.AUTO_FOLLOWUPS:
    case Feature.SETTLEMENT:
      return hasPaidPlan(session)
    case Feature.PO_MANAGEMENT:
      return hasActiveSubscription(session)
    default:
      return false
  }
}
