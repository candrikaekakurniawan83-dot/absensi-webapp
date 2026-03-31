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
import { Plus, Filter } from "lucide-react";
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
      case 'izin': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Izin</span>;
      case 'cuti': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Cuti</span>;
      case 'dinas': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Dinas Luar</span>;
      case 'tidak_hadir': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Tidak Hadir</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekap Kehadiran</h1>
          <p className="text-muted-foreground mt-1">Daftar ketidakhadiran, cuti, izin, dan dinas luar.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Input Rekap Baru
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filter Status:
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="izin">Izin</SelectItem>
              <SelectItem value="cuti">Cuti</SelectItem>
              <SelectItem value="dinas">Dinas Luar</SelectItem>
              <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pegawai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32">Memuat data...</TableCell>
                </TableRow>
              ) : filteredRecords?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">Tidak ada record kehadiran.</TableCell>
                </TableRow>
              ) : (
                filteredRecords?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(record.tanggal), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.employee?.nama || `ID ${record.employeeId}`}</span>
                        <span className="text-xs text-muted-foreground">{record.employee?.nopek}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={record.alasan || ''}>
                      {record.alasan || '-'}
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Input Rekap Kehadiran</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Pegawai *</Label>
                <Select value={formData.employeeId} onValueChange={v => setFormData({...formData, employeeId: v})}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Pilih Pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>{emp.nama} ({emp.nopek})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status Kehadiran *</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as AttendanceRecordStatus})}>
                  <SelectTrigger id="status">
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
                <Label htmlFor="tanggal">Tanggal *</Label>
                <Input type="date" id="tanggal" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alasan">Alasan Singkat</Label>
                <Input id="alasan" value={formData.alasan} onChange={e => setFormData({...formData, alasan: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                <Input id="keterangan" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createMutation.isPending || !formData.employeeId || !formData.status}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
