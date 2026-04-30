export default function InstanceDetailPage({
  params,
}: {
  params: { instanceId: string }
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Instância #{params.instanceId}</h1>
      <p className="text-muted-foreground mt-2">Implementado no Passo 4</p>
    </div>
  )
}
