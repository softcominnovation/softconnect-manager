export default function VpsDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">VPS #{params.id}</h1>
      <p className="text-muted-foreground mt-2">Implementado no Passo 2</p>
    </div>
  )
}
