import type { AdminInstance, HubInstanceDto } from './types'

export function buildHubInstanceMap(instances: HubInstanceDto[]): Map<string, HubInstanceDto> {
  const map = new Map<string, HubInstanceDto>()
  const counts = new Map<string, number>()
  for (const item of instances)
    if (item.providerInstanceId)
      counts.set(item.providerInstanceId, (counts.get(item.providerInstanceId) ?? 0) + 1)
  // Remote IDs are only a compatibility fallback when unambiguous in this product.
  for (const item of instances)
    if (item.providerInstanceId && counts.get(item.providerInstanceId) === 1)
      map.set(item.providerInstanceId, item)
  for (const item of instances) map.set(item.instanceName, item)
  for (const item of instances) map.set(item.id, item)
  return map
}

export function resolveHubEntry(
  instance: Pick<AdminInstance, 'id' | 'name' | 'providerInstanceId'>,
  map: Map<string, HubInstanceDto>
): HubInstanceDto | undefined {
  const byId = map.get(instance.id)
  if (byId?.id === instance.id) return byId
  return (
    map.get(instance.name) ??
    (instance.providerInstanceId ? map.get(instance.providerInstanceId) : undefined)
  )
}
