"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  PowerOff,
  MessageCircle,
  AlertTriangle,
  Search,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Server,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useInstanceList,
  useCreateInstance,
  useDeleteInstance,
} from "@/hooks/use-instances";
import { useProductList, useRotateProductKey } from "@/hooks/use-products";
import { useVpsList } from "@/hooks/use-vps";
import { useProductKeysStore } from "@/store/product-keys.store";
import {
  createInstanceSchema,
  type CreateInstanceFormData,
} from "@/lib/schemas/instance.schema";
import type { Instance, Product } from "@/lib/types";

function InstanceStatusBadge({ status }: { status: Instance["status"] }) {
  const map = {
    open: {
      label: "Conectado",
      icon: <Wifi className="h-3 w-3" />,
      className:
        "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    },
    connecting: {
      label: "Conectando",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      className:
        "text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    close: {
      label: "Desconectado",
      icon: <WifiOff className="h-3 w-3" />,
      className: "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
  } as const;
  const cfg = map[status] ?? map.close;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function InstancesPanel({
  productId,
  onDelete,
}: {
  productId: string;
  onDelete: (instanceId: string) => void;
}) {
  const router = useRouter();
  const { data: instances, isLoading } = useInstanceList(productId);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhuma instância criada neste produto.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instance ID</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-14" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.map((inst) => (
            <TableRow
              key={inst.instanceId}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() =>
                router.push(
                  `/instances/${inst.instanceId}?productId=${productId}`,
                )
              }
            >
              <TableCell className="font-mono text-xs">
                {inst.instanceId.slice(0, 14)}…
              </TableCell>
              <TableCell>
                {inst.profileName ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <InstanceStatusBadge status={inst.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(inst.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(inst.instanceId)}
                >
                  <PowerOff className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProductCard({
  product,
  vpsLabel,
  onCreateInstance,
}: {
  product: Product;
  vpsLabel: string | null;
  onCreateInstance: (productId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const hasKey = useProductKeysStore((s) => s.hasKey(product.id));
  const { mutate: rotateKey, isPending: rotating } = useRotateProductKey(
    product.id,
  );
  const { mutate: deleteInstance } = useDeleteInstance(product.id);

  return (
    <>
      <Card
        className={`transition-all ${!product.isActive ? "opacity-60" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <Badge
                  variant={product.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {product.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {product.slug}
              </p>
              {vpsLabel && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Server className="h-3 w-3" />
                  {vpsLabel}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasKey ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => onCreateInstance(product.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setExpanded((v) => !v)}
                  >
                    {expanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {expanded ? "Ocultar" : "Ver instâncias"}
                  </Button>
                </>
              ) : (
                <>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={rotating}
                    onClick={() => rotateKey()}
                  >
                    {rotating ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" />
                    )}
                    {rotating ? "Gerando…" : "Rotacionar API Key"}
                  </Button> */}
                </>
              )}
            </div>
          </div>

          {!hasKey && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              API Key não disponível neste navegador. Rotacione para acessar as
              instâncias.
            </div>
          )}
        </CardHeader>

        {expanded && hasKey && (
          <CardContent className="pt-0 border-t">
            <InstancesPanel
              productId={product.id}
              onDelete={(id) => setDeleteTarget(id)}
            />
          </CardContent>
        )}
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar instância?</AlertDialogTitle>
            <AlertDialogDescription>
              A instância <strong>{deleteTarget?.slice(0, 14)}…</strong> será
              removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteInstance(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function InstancesPage() {
  const router = useRouter();
  const { data: products, isLoading: productsLoading } = useProductList();
  const { data: vpsList } = useVpsList();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createProductId, setCreateProductId] = useState<string>("");
  const { mutate: createInstance, isPending } =
    useCreateInstance(createProductId);
  const hasKey = useProductKeysStore((s) => s.hasKey);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateInstanceFormData>({
    resolver: zodResolver(createInstanceSchema),
    defaultValues: { integration: "WHATSAPP-BAILEYS" },
  });

  const filteredProducts = useMemo(() => {
    const list = products ?? [];
    return list.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" ? p.isActive : !p.isActive);
      return matchSearch && matchStatus;
    });
  }, [products, search, filterStatus]);

  const hasNoActiveProducts =
    !productsLoading && (products ?? []).filter((p) => p.isActive).length === 0;

  function handleOpenCreate(productId: string) {
    setCreateProductId(productId);
    setCreateOpen(true);
  }

  function onSubmit(data: CreateInstanceFormData) {
    createInstance(
      {
        instanceName: data.instanceName,
        integration: data.integration,
        qrcode: false,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          reset();
        },
      },
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Instâncias</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie instâncias WhatsApp por produto
          </p>
        </div>
      </div>

      {hasNoActiveProducts && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/50 dark:bg-yellow-900/10">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-400">
              Nenhum produto ativo
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-500">
              Cadastre pelo menos um produto em{" "}
              <button
                className="underline font-medium"
                onClick={() => router.push("/products")}
              >
                Produtos
              </button>{" "}
              antes de criar instâncias.
            </p>
          </div>
        </div>
      )}

      {/* Search + Status filter */}
      {!hasNoActiveProducts && (
        <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar produto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Product cards */}
      {productsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const vps = product.vpsId
              ? vpsList?.find((v) => v.id === product.vpsId)
              : null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                vpsLabel={vps ? `${vps.label} — ${vps.ip}` : null}
                onCreateInstance={handleOpenCreate}
              />
            );
          })}
          {filteredProducts.length === 0 && !productsLoading && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
              Nenhum produto encontrado.
            </p>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Instância</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="instanceName">Nome da instância *</Label>
              <Input
                id="instanceName"
                placeholder="minha-instancia"
                {...register("instanceName")}
              />
              {errors.instanceName && (
                <p className="text-xs text-destructive">
                  {errors.instanceName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Integração</Label>
              <Controller
                control={control}
                name="integration"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WHATSAPP-BAILEYS">
                        WhatsApp Baileys
                      </SelectItem>
                      <SelectItem value="WHATSAPP-BUSINESS">
                        WhatsApp Business
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !createProductId}>
                {isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
