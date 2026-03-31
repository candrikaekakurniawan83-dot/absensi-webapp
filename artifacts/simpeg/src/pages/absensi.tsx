import { useState } from "react";
import { 
  useGetAttendanceRecords, 
  getGetAttendanceRecordsQueryKey,
  useCreateAttendanceRecord,
  useGetEmployees,
  getGetEmployeesQueryKey,
  AttendanceRecordStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Filter, CalendarCheck } from "lucide-react";
import { format } from "date-fns";

export default function Absensi() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: records, isLoading } = useGetAttendanceRecords(
    undefined,
    { query: { queryKey: getGetAttendanceRecordsQueryKey() } }
  );

  const { data: employees } = useGetEmployees({
    query: { queryKey: getGetEmployeesQueryKey() }
  });

  const createMutation = useCreateAttendanceRecord();

  const [formData, setFormData] = useState({
    employeeId: "",
    status: "" as AttendanceRecordStatus,
    tanggal: new Date().toISOString().split('T')[0],
    alasan: "",
    keterangan: ""
  });

  const filteredRecords = records?.filter(r => filterStatus === "all" || r.status === filterStatus)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.status || !formData.tanggal) return;

    try {
      await createMutation.mutateAsync({
        data: {
          employeeId: parseInt(formData.employeeId),
          status: formData.status,
          tanggal: formData.tanggal,
          alasan: formData.alasan || null,
          keterangan: formData.keterangan || null
        }
      });
      toast({ title: "Berhasil", description: "Rekap kehadiran ditambahkan" });
      queryClient.invalidateQueries({ queryKey: getGetAttendanceRecordsQueryKey() });
      setIsFormOpen(false);
      setFormData({ ...formData, alasan: "", keterangan: "" }); // reset partial
    } catch (err) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'izin': return <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">Izin</span>;
      case 'cuti': return <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Cuti</span>;
      case 'dinas': return <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Dinas Luar</span>;
      case 'tidak_hadir': return <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">Tidak Hadir</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Rekap Kehadiran</h1>
          <p className="text-muted-foreground mt-2 text-lg">Daftar ketidakhadiran, cuti, izin, dan dinas luar.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="btn-primary-gradient rounded-xl px-6 h-12 shadow-lg hover:shadow-xl">
          <Plus className="h-5 w-5 mr-2" />
          Input Rekap Baru
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
        <div className="p-5 bg-muted/20 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Filter className="h-5 w-5" />
            </div>
            <span className="font-semibold">Filter Status:</span>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[250px] bg-background border-border/50 shadow-sm h-11 rounded-xl">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status (Tampilkan Semua)</SelectItem>
              <SelectItem value="izin">Izin</SelectItem>
              <SelectItem value="cuti">Cuti</SelectItem>
              <SelectItem value="dinas">Dinas Luar</SelectItem>
              <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardContent className="p-0">
          <Table className="table-premium">
            <TableHeader>
              <TableRow className="table-premium-header">
                <TableHead className="pl-6 w-[200px]">Tanggal</TableHead>
                <TableHead>Pegawai</TableHead>
                <TableHead className="w-[180px]">Status</TableHead>
                <TableHead className="pr-6">Alasan / Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-48">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                      <p className="text-muted-foreground font-medium">Memuat rekap kehadiran...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecords?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-48 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-medium">Tidak ada record kehadiran.</p>
                      <p className="text-sm mt-1">Belum ada data untuk filter yang dipilih.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords?.map((record) => (
                  <TableRow key={record.id} className="table-premium-row">
                    <TableCell className="pl-6 font-bold whitespace-nowrap">
                      {format(new Date(record.tanggal), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-primary font-bold shadow-sm">
                          {record.employee?.nama?.charAt(0) || "P"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{record.employee?.nama || `ID ${record.employeeId}`}</span>
                          <span className="font-mono text-xs text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded inline-block mt-0.5 w-fit border border-border/50">{record.employee?.nopek}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="pr-6">
                      <div className="font-medium">{record.alasan || '-'}</div>
                      {record.keterangan && (
                        <div className="text-sm text-muted-foreground mt-0.5">{record.keterangan}</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">Input Rekap Kehadiran</DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5 bg-card">
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="employee" className="font-semibold">Pegawai *</Label>
                <Select value={formData.employeeId} onValueChange={v => setFormData({...formData, employeeId: v})}>
                  <SelectTrigger id="employee" className="bg-muted/30 h-11">
                    <SelectValue placeholder="Pilih Pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>{emp.nama} ({emp.nopek})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="status" className="font-semibold">Status Kehadiran *</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as AttendanceRecordStatus})}>
                    <SelectTrigger id="status" className="bg-muted/30 h-11">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="izin">Izin</SelectItem>
                      <SelectItem value="cuti">Cuti</SelectItem>
                      <SelectItem value="dinas">Dinas Luar</SelectItem>
                      <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggal" className="font-semibold">Tanggal *</Label>
                  <Input type="date" id="tanggal" className="bg-muted/30 h-11" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alasan" className="font-semibold">Alasan Singkat</Label>
                <Input id="alasan" className="bg-muted/30 h-11" value={formData.alasan} onChange={e => setFormData({...formData, alasan: e.target.value})} placeholder="Contoh: Sakit demam..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan" className="font-semibold">Keterangan Tambahan</Label>
                <Input id="keterangan" className="bg-muted/30 h-11" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} placeholder="Opsional..." />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border/50 mt-4">
              <Button type="button" variant="outline" className="h-11 px-6 rounded-xl" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit" className="btn-primary-gradient h-11 px-8 rounded-xl" disabled={createMutation.isPending || !formData.employeeId || !formData.status}>
                Simpan Kehadiran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}