import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetComplaints,
  getGetComplaintsQueryKey,
  useCreateComplaint,
  useUpdateComplaint,
  useGetComplaintSummary,
  getGetComplaintSummaryQueryKey
} from "@workspace/api-client-react";
import {
  Complaint,
  CreateComplaint,
  ComplaintStatus,
  ComplaintPrioritas,
  ComplaintKategori
} from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareWarning, Plus, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const complaintSchema = z.object({
  namaPelanggan: z.string().min(1, "Nama diperlukan"),
  kontakPelanggan: z.string().optional(),
  kategori: z.enum(["produk", "layanan", "pengiriman", "lainnya"] as const),
  judul: z.string().min(1, "Judul diperlukan"),
  deskripsi: z.string().min(1, "Deskripsi diperlukan"),
  status: z.enum(["baru", "diproses", "selesai", "ditolak"] as const),
  prioritas: z.enum(["rendah", "sedang", "tinggi"] as const),
  tanggal: z.string().min(1, "Tanggal diperlukan"),
  penangananOleh: z.string().optional(),
  catatanPenanganan: z.string().optional()
});

const updateSchema = z.object({
  status: z.enum(["baru", "diproses", "selesai", "ditolak"] as const),
  penangananOleh: z.string().optional(),
  catatanPenanganan: z.string().optional()
});

export default function Keluhan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | "all">("all");
  const [filterPrioritas, setFilterPrioritas] = useState<ComplaintPrioritas | "all">("all");
  const [filterKategori, setFilterKategori] = useState<ComplaintKategori | "all">("all");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const { data: summary } = useGetComplaintSummary();
  
  const queryParams: any = {};
  if (filterStatus !== "all") queryParams.status = filterStatus;
  if (filterPrioritas !== "all") queryParams.prioritas = filterPrioritas;
  if (filterKategori !== "all") queryParams.kategori = filterKategori;
  
  const { data: complaints = [] } = useGetComplaints(queryParams, {
    query: {
      queryKey: getGetComplaintsQueryKey(queryParams)
    }
  });

  const createComplaint = useCreateComplaint();
  const updateComplaint = useUpdateComplaint();

  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      namaPelanggan: "",
      kontakPelanggan: "",
      kategori: "layanan",
      judul: "",
      deskripsi: "",
      status: "baru",
      prioritas: "sedang",
      tanggal: new Date().toISOString().split('T')[0],
      penangananOleh: "",
      catatanPenanganan: ""
    }
  });

  const updateForm = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: "baru",
      penangananOleh: "",
      catatanPenanganan: ""
    }
  });

  const onSubmit = (data: z.infer<typeof complaintSchema>) => {
    createComplaint.mutate({ data: data as CreateComplaint }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetComplaintSummaryQueryKey() });
        setIsAddDialogOpen(false);
        form.reset();
        toast({ title: "Berhasil", description: "Keluhan baru ditambahkan" });
      }
    });
  };

  const onUpdate = (data: z.infer<typeof updateSchema>) => {
    if (!selectedComplaint) return;
    updateComplaint.mutate({ 
      id: selectedComplaint.id, 
      data: { ...selectedComplaint, ...data } as CreateComplaint
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetComplaintSummaryQueryKey() });
        setSelectedComplaint(null);
        toast({ title: "Berhasil", description: "Status keluhan diperbarui" });
      }
    });
  };

  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    updateForm.reset({
      status: complaint.status,
      penangananOleh: complaint.penangananOleh || "",
      catatanPenanganan: complaint.catatanPenanganan || ""
    });
  };

  const getPriorityBadge = (p: ComplaintPrioritas) => {
    switch(p) {
      case "tinggi": return <Badge variant="destructive">Tinggi</Badge>;
      case "sedang": return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Sedang</Badge>;
      case "rendah": return <Badge className="bg-green-500 hover:bg-green-600 text-white">Rendah</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (s: ComplaintStatus) => {
    switch(s) {
      case "baru": return <Badge variant="secondary">Baru</Badge>;
      case "diproses": return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Diproses</Badge>;
      case "selesai": return <Badge className="bg-green-600 hover:bg-green-700 text-white">Selesai</Badge>;
      case "ditolak": return <Badge variant="destructive">Ditolak</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Keluhan Pelanggan</h2>
          <p className="text-muted-foreground">Pencatatan dan pelacakan keluhan dari pelanggan.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Keluhan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Catat Keluhan Baru</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="namaPelanggan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Pelanggan *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kontakPelanggan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kontak (No. HP / Email)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="judul"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Keluhan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Singkat dan jelas..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="kategori"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="produk">Produk</SelectItem>
                            <SelectItem value="layanan">Layanan</SelectItem>
                            <SelectItem value="pengiriman">Pengiriman</SelectItem>
                            <SelectItem value="lainnya">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prioritas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioritas *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rendah">Rendah</SelectItem>
                            <SelectItem value="sedang">Sedang</SelectItem>
                            <SelectItem value="tinggi">Tinggi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="deskripsi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Detail *</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tanggal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Kejadian *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Awal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baru">Baru</SelectItem>
                            <SelectItem value="diproses">Diproses</SelectItem>
                            <SelectItem value="selesai">Selesai</SelectItem>
                            <SelectItem value="ditolak">Ditolak</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createComplaint.isPending}>
                    Simpan Keluhan
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baru</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.baru || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Diproses</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{summary?.diproses || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Selesai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-300">{summary?.selesai || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-300">{summary?.ditolak || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="baru">Baru</SelectItem>
            <SelectItem value="diproses">Diproses</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
            <SelectItem value="ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPrioritas} onValueChange={(v: any) => setFilterPrioritas(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prioritas</SelectItem>
            <SelectItem value="rendah">Rendah</SelectItem>
            <SelectItem value="sedang">Sedang</SelectItem>
            <SelectItem value="tinggi">Tinggi</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterKategori} onValueChange={(v: any) => setFilterKategori(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="produk">Produk</SelectItem>
            <SelectItem value="layanan">Layanan</SelectItem>
            <SelectItem value="pengiriman">Pengiriman</SelectItem>
            <SelectItem value="lainnya">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Tidak ada data keluhan yang sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint) => (
                <TableRow 
                  key={complaint.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(complaint)}
                >
                  <TableCell>{format(new Date(complaint.tanggal), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-medium">
                    {complaint.namaPelanggan}
                    {complaint.kontakPelanggan && (
                      <div className="text-xs text-muted-foreground">{complaint.kontakPelanggan}</div>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{complaint.kategori}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={complaint.judul}>
                    {complaint.judul}
                  </TableCell>
                  <TableCell>{getPriorityBadge(complaint.prioritas)}</TableCell>
                  <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Keluhan</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border p-4 rounded-md bg-muted/20">
                <div className="text-muted-foreground">Pelanggan</div>
                <div className="font-medium">{selectedComplaint.namaPelanggan} ({selectedComplaint.kontakPelanggan || '-'})</div>
                
                <div className="text-muted-foreground">Kategori</div>
                <div className="capitalize">{selectedComplaint.kategori}</div>
                
                <div className="text-muted-foreground">Prioritas</div>
                <div>{getPriorityBadge(selectedComplaint.prioritas)}</div>
                
                <div className="text-muted-foreground">Tanggal Kejadian</div>
                <div>{format(new Date(selectedComplaint.tanggal), 'dd MMMM yyyy')}</div>
              </div>

              <div>
                <h4 className="font-semibold mb-1">{selectedComplaint.judul}</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedComplaint.deskripsi}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Update Penanganan</h4>
                <Form {...updateForm}>
                  <form onSubmit={updateForm.handleSubmit(onUpdate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={updateForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Update Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="baru">Baru</SelectItem>
                                <SelectItem value="diproses">Diproses</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                                <SelectItem value="ditolak">Ditolak</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="penangananOleh"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ditangani Oleh</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nama staf..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={updateForm.control}
                      name="catatanPenanganan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catatan Penanganan</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} placeholder="Tindakan yang telah dilakukan..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setSelectedComplaint(null)}>
                        Tutup
                      </Button>
                      <Button type="submit" disabled={updateComplaint.isPending}>
                        Simpan Update
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}