import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetInventoryItems, 
  getGetInventoryItemsQueryKey,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useGetInventoryTransactions,
  getGetInventoryTransactionsQueryKey,
  useCreateInventoryTransaction,
  useDeleteInventoryTransaction,
  useGetInventorySummary,
  getGetInventorySummaryQueryKey
} from "@workspace/api-client-react";
import { 
  InventoryItem, 
  InventoryTransactionTipe,
  CreateInventoryItem,
  CreateInventoryTransaction
} from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, ArrowDownToLine, ArrowUpFromLine, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const itemSchema = z.object({
  kodeBarang: z.string().min(1, "Kode barang diperlukan"),
  namaBarang: z.string().min(1, "Nama barang diperlukan"),
  kategori: z.string().optional(),
  satuan: z.string().optional(),
  stok: z.coerce.number().min(0, "Stok tidak boleh negatif"),
  keterangan: z.string().optional()
});

const transactionSchema = z.object({
  itemId: z.coerce.number().min(1, "Barang diperlukan"),
  tipe: z.enum(["masuk", "keluar"]),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  tanggal: z.string().min(1, "Tanggal diperlukan"),
  penanggungJawab: z.string().optional(),
  keterangan: z.string().optional()
});

export default function Inventori() {
  const [activeTab, setActiveTab] = useState("items");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary } = useGetInventorySummary();
  const { data: items = [] } = useGetInventoryItems();
  const { data: transactions = [] } = useGetInventoryTransactions();

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const createTransaction = useCreateInventoryTransaction();
  const deleteTransaction = useDeleteInventoryTransaction();

  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      kodeBarang: "",
      namaBarang: "",
      kategori: "",
      satuan: "",
      stok: 0,
      keterangan: ""
    }
  });

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      itemId: 0,
      tipe: "masuk",
      jumlah: 1,
      tanggal: new Date().toISOString().split('T')[0],
      penanggungJawab: "",
      keterangan: ""
    }
  });

  const onSubmitItem = (data: z.infer<typeof itemSchema>) => {
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
          setIsItemDialogOpen(false);
          setEditingItem(null);
          toast({ title: "Berhasil", description: "Data barang diperbarui" });
        }
      });
    } else {
      createItem.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
          setIsItemDialogOpen(false);
          toast({ title: "Berhasil", description: "Barang baru ditambahkan" });
        }
      });
    }
  };

  const onSubmitTransaction = (data: z.infer<typeof transactionSchema>) => {
    createTransaction.mutate({ data: data as CreateInventoryTransaction }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
        setIsTransactionDialogOpen(false);
        toast({ title: "Berhasil", description: "Transaksi dicatat" });
      }
    });
  };

  const handleDeleteItem = (id: number) => {
    if (confirm("Hapus barang ini?")) {
      deleteItem.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
          toast({ title: "Berhasil", description: "Barang dihapus" });
        }
      });
    }
  };

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    itemForm.reset({
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      kategori: item.kategori || "",
      satuan: item.satuan || "",
      stok: item.stok,
      keterangan: item.keterangan || ""
    });
    setIsItemDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Inventori Barang</h2>
        <p className="text-muted-foreground">Manajemen stok barang masuk dan keluar perusahaan.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jenis Barang</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Masuk</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalMasuk || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keluar</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalKeluar || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Daftar Barang</TabsTrigger>
          <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Daftar Barang</h3>
            <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
              setIsItemDialogOpen(open);
              if (!open) {
                setEditingItem(null);
                itemForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Barang
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
                </DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
                    <FormField
                      control={itemForm.control}
                      name="kodeBarang"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kode Barang</FormLabel>
                          <FormControl>
                            <Input placeholder="BRG-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="namaBarang"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Barang</FormLabel>
                          <FormControl>
                            <Input placeholder="Kertas HVS A4" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={itemForm.control}
                        name="kategori"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            <FormControl>
                              <Input placeholder="ATK" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="satuan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Satuan</FormLabel>
                            <FormControl>
                              <Input placeholder="Rim" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={itemForm.control}
                      name="stok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stok Awal</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="keterangan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keterangan</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                        Simpan
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Belum ada data barang.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.kodeBarang}</TableCell>
                      <TableCell>{item.namaBarang}</TableCell>
                      <TableCell>{item.kategori || "-"}</TableCell>
                      <TableCell>{item.satuan || "-"}</TableCell>
                      <TableCell className="text-right font-bold">{item.stok}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Riwayat Transaksi</h3>
            <Dialog open={isTransactionDialogOpen} onOpenChange={(open) => {
              setIsTransactionDialogOpen(open);
              if (!open) {
                transactionForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Catat Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Catat Transaksi Baru</DialogTitle>
                </DialogHeader>
                <Form {...transactionForm}>
                  <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4">
                    <FormField
                      control={transactionForm.control}
                      name="itemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pilih Barang</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? field.value.toString() : undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih barang..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {items.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.kodeBarang} - {item.namaBarang} (Stok: {item.stok})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={transactionForm.control}
                        name="tipe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipe Transaksi</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="masuk">Barang Masuk</SelectItem>
                                <SelectItem value="keluar">Barang Keluar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={transactionForm.control}
                        name="jumlah"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jumlah</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={transactionForm.control}
                        name="tanggal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tanggal</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={transactionForm.control}
                        name="penanggungJawab"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Penanggung Jawab</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={transactionForm.control}
                      name="keterangan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keterangan</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={createTransaction.isPending}>
                        Simpan Transaksi
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Penanggung Jawab</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Belum ada transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((trx) => (
                    <TableRow key={trx.id}>
                      <TableCell>{format(new Date(trx.tanggal), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          trx.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {trx.tipe === 'masuk' ? 'Masuk' : 'Keluar'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{trx.item?.namaBarang || `Barang #${trx.itemId}`}</TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={trx.tipe === 'masuk' ? 'text-green-600' : 'text-red-600'}>
                          {trx.tipe === 'masuk' ? '+' : '-'}{trx.jumlah}
                        </span>
                      </TableCell>
                      <TableCell>{trx.penanggungJawab || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{trx.keterangan || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm("Hapus transaksi ini? Stok akan kembali menyesuaikan.")) {
                              deleteTransaction.mutate({ id: trx.id }, {
                                onSuccess: () => {
                                  queryClient.invalidateQueries({ queryKey: getGetInventoryTransactionsQueryKey() });
                                  queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
                                  queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
                                }
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}