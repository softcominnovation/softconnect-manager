export type MaintenanceMode = 'observe' | 'execute'
export type MaintenanceActionKind = 'disconnect' | 'delete'
export type WorkerStatus = 'unknown' | 'online' | 'stale' | 'disabled'

export interface MaintenanceProduct {
  id: string
  name: string
}

export interface MaintenanceView {
  providerId: string
  revision: number
  providerRevision: number
  scopeFingerprint: string
  policy: {
    enabled: boolean
    mode: MaintenanceMode
    action: MaintenanceActionKind
    connectingMaxAgeMinutes: number | null
  }
  effective: {
    enabled: boolean
    mode: MaintenanceMode
    connectingMaxAgeMinutes: number
    intervalMs: number
    maxObservationGapMs: number
  }
  affectedProducts: MaintenanceProduct[]
  worker: {
    status: WorkerStatus
    lastSeenAt: string | null
    configurationMatches: boolean
  }
  monitoring: {
    lastAttemptAt: string | null
    lastSuccessAt: string | null
    nextCheckAt: string | null
    lastErrorCode: string | null
    lastErrorMessage: string | null
  }
  counts: {
    observedConnecting: number
    eligible: number
    pendingConfirmation: number
  }
  blockers: Array<{ code: string; message: string }>
}

export interface MaintenanceDraft {
  enabled: boolean
  mode: MaintenanceMode
  action: MaintenanceActionKind
  ageText: string
}

export interface MaintenanceObservation {
  id: string
  instanceId: string
  productId: string
  instanceName: string
  remoteStatus: string
  connectingObservedSince: string | null
  lastObservedAt: string
  eligible: boolean
  reason: string | null
  observedConnectingMs: number | null
}

export interface MaintenanceActionRow {
  id: string
  instanceName: string
  productId: string
  action: string
  state: string
  reason: string | null
  createdAt: string
  updatedAt: string
}

export interface MaintenancePage<T> {
  items: T[]
  nextCursor: string | null
}

export function draftFromPolicy(view: MaintenanceView): MaintenanceDraft {
  return {
    enabled: view.policy.enabled,
    mode: view.policy.mode,
    action: view.policy.action,
    ageText:
      view.policy.connectingMaxAgeMinutes == null
        ? ''
        : String(view.policy.connectingMaxAgeMinutes),
  }
}

export function parseAge(text: string): number | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Informe minutos inteiros ou deixe vazio para usar o padrão.')
  }
  const value = Number(trimmed)
  if (value < 1 || value > 525600) {
    throw new Error('O prazo deve ficar entre 1 e 525600 minutos.')
  }
  return value
}

export function needsHubConfirmation(
  current: MaintenanceView,
  next: Omit<MaintenanceDraft, 'ageText'> & { connectingMaxAgeMinutes: number | null }
) {
  const age = next.connectingMaxAgeMinutes ?? current.effective.connectingMaxAgeMinutes
  const previous = current.policy.connectingMaxAgeMinutes ?? current.effective.connectingMaxAgeMinutes
  return (
    next.enabled &&
    (!current.policy.enabled ||
      (next.mode === 'execute' &&
        (current.policy.mode !== 'execute' ||
          current.policy.action !== next.action ||
          age < previous)))
  )
}

export function maintenancePayload(current: MaintenanceView, draft: MaintenanceDraft) {
  const connectingMaxAgeMinutes = parseAge(draft.ageText)
  const next = {
    enabled: draft.enabled,
    mode: draft.mode,
    action: draft.action,
    connectingMaxAgeMinutes,
  }
  const body: Record<string, unknown> = {
    expectedRevision: current.revision,
    expectedProviderRevision: current.providerRevision,
    expectedScopeFingerprint: current.scopeFingerprint,
    ...next,
  }
  if (needsHubConfirmation(current, next)) {
    body.confirmation = {
      action: next.action,
      acknowledgeSharedScope: true,
      ...(next.mode === 'execute' && next.action === 'delete'
        ? { acknowledgePermanentDeletion: true }
        : {}),
    }
  }
  return body
}

export function situationLabel(view: MaintenanceView) {
  if (view.blockers.some((item) => item.code === 'master_disabled')) {
    return 'Bloqueado por configuração global'
  }
  if (view.worker.status === 'unknown' || view.worker.status === 'stale') {
    return 'Worker sem confirmação'
  }
  if (!view.policy.enabled) return 'Desativado'
  if (view.policy.mode === 'observe' || view.effective.mode === 'observe') {
    return 'Somente observando'
  }
  return 'Execução habilitada'
}

export function workerLabel(status: WorkerStatus) {
  const labels: Record<WorkerStatus, string> = {
    unknown: 'Worker sem sinal',
    stale: 'Worker sem confirmação recente',
    disabled: 'Worker informa manutenção global desligada',
    online: 'Worker com sinal recente',
  }
  return labels[status]
}

export function actionStateLabel(action: string, state: string) {
  if (state === 'uncertain') {
    return 'Sem confirmação da Evolution; nenhuma nova tentativa automática'
  }
  if (state === 'local_cleanup_pending') {
    return 'Exclusão remota confirmada; finalização no Hub pendente'
  }
  if (state === 'succeeded' && action === 'delete') return 'Exclusão confirmada'
  if (state === 'succeeded') return 'Desconexão confirmada'
  const labels: Record<string, string> = {
    simulated: 'Simulação',
    dispatching: 'Envio em andamento',
    confirming: 'Aguardando confirmação',
    failed: 'Falha comprovada',
    skipped: 'Não executada',
  }
  return labels[state] ?? state
}

export function reasonLabel(reason: string | null) {
  if (!reason) return null
  const labels: Record<string, string> = {
    policy_changed: 'A política mudou e a contagem recomeçou.',
    provider_disabled: 'A verificação deste provider está desligada.',
    not_connecting: 'Não está em connecting.',
    logout_recovery_failed:
      'A sessão não desconectou. A tentativa extra foi única e não será repetida.',
    logout_recovery_open:
      'A instância ficou conectada durante a tentativa e não foi desconectada.',
  }
  return labels[reason] ?? reason
}

export function formatWhen(value: string | null) {
  if (!value) return 'sem registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'sem registro'
  return date.toLocaleString('pt-BR')
}
