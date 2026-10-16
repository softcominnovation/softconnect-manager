import { ProviderDetail } from '@/components/providers/provider-detail'

export default function ProviderPage({ params }: { params: { providerId: string } }) {
  return <ProviderDetail id={params.providerId} />
}
