# Spec: Importação de Instâncias em Qualquer Estado de Conexão

**Contexto:** Instrução para o agente da API SoftConnect ao implementar ou revisar os endpoints de importação de instâncias.

---

## Problema identificado

Os endpoints `POST /admin/products/:productId/instances/import` e `POST /admin/products/:productId/instances/import/bulk` estão retornando `result: "skipped"` para instâncias que **não existem** no banco do Hub, aparentemente filtrando ou ignorando instâncias com `connectionStatus: "close"` ou `"connecting"`.

Isso está **incorreto**. Instâncias desconectadas devem ser importadas normalmente.

---

## Regra obrigatória

**O `connectionStatus` NÃO é critério de elegibilidade para importação.**

Uma instância deve ser importada independentemente do seu estado de conexão:

| `connectionStatus` | Deve ser importada? |
|--------------------|---------------------|
| `open`             | ✅ Sim              |
| `connecting`       | ✅ Sim              |
| `close`            | ✅ Sim              |
| `disconnected`     | ✅ Sim              |

Não conectado ≠ não importável. Uma instância pode estar offline temporariamente e ainda precisa ser registrada no Hub para que o cliente possa gerenciá-la pelo dashboard.

---

## Semântica correta de `result`

| Valor      | Quando retornar                                                                 |
|------------|---------------------------------------------------------------------------------|
| `created`  | A instância foi inserida no banco do Hub (não existia com esse `id + productId`) |
| `skipped`  | A instância **já existia** no banco do Hub com o mesmo `id + productId`          |
| `error`    | Ocorreu uma exceção durante o processamento desta instância (apenas no bulk)    |

`skipped` deve ser usado **somente** para deduplicação (registro já presente). Nunca para filtrar por status de conexão.

---

## Mapeamento de status

Ao persistir a instância no Hub, mapear o `connectionStatus` da Evolution para o campo de status do Hub conforme:

| Evolution `connectionStatus` | Hub `status`    |
|------------------------------|-----------------|
| `open`                       | `connected`     |
| `connecting`                 | `connecting`    |
| `close`                      | `disconnected`  |
| `disconnected`               | `disconnected`  |
| qualquer outro valor         | `disconnected`  |

---

## Comportamento esperado do bulk (`/import/bulk`)

1. Buscar **todas** as instâncias da Evolution (sem filtro de status)
2. Para cada instância:
   - Se já existe no Hub (`id + productId`) → `skipped`
   - Se não existe → criar no Hub → `created`
   - Se erro → `error`
3. Retornar contadores `{ created, skipped, errors, details }`

O processo é idempotente: pode ser executado múltiplas vezes sem duplicar registros.

---

## Comportamento esperado do single (`/import`)

Body recebido:
```json
{
  "id": "<providerInstanceId da Evolution>",
  "name": "<instanceName>",
  "token": "<token>",
  "connectionStatus": "<qualquer valor>",
  "number": "<opcional>"
}
```

- Se já existe no Hub → retornar `{ result: "skipped", hubInstanceId: "<id existente>" }`
- Se não existe → criar → retornar `{ result: "created", hubInstanceId: "<novo id>" }`
- O campo `connectionStatus` no body é informativo para mapear o status inicial no Hub — **não é usado para decidir se a instância será importada**.
