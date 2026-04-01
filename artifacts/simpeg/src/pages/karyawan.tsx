import { useState } from "react";
import { Link } from "wouter";
import { 
  useGetEmployees, 
  getGetEmployeesQueryKey,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit2, Trash2, ChevronRight, User } from "lucide-react";

export default function Karyawan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: employees, isLoading } = useGetEmployees({
    query: { queryKey: getGetEmployeesQueryKey() }
  });

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nama: "",
    nopek: "",
    foto: "",
    jabatan: "",
    departemen: ""
  });

  const filteredEmployees = Array.isArray(employees) ? employees.filter(emp => 
    emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.nopek.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const openForm = (employee?: any) => {
    if (employee) {
      setEditingId(employee.id);
      setFormData({
        nama: employee.nama,
        nopek: employee.nopek,
        foto: employee.foto || "",
        jabatan: employee.jabatan || "",
        departemen: employee.departemen || ""
      });
    } else {
      setEditingId(null);
      setFormData({ nama: "", nopek: "", foto: "", jabatan: "", departemen: "" });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nopek) return;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            ...formData,
            foto: formData.foto || null,
            jabatan: formData.jabatan || null,
            departemen: formData.departemen || null
          }
        });
        toast({ title: "Berhasil", description: "Data pekerja diperbarui" });
      } else {
        await createMutation.mutateAsync({
          data: {
            ...formData,
            foto: formData.foto || null,
            jabatan: formData.jabatan || null,
            departemen: formData.departemen || null
          }
        });
        toast({ title: "Berhasil", description: "Pekerja baru ditambahkan" });
      }
      queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
      setIsFormOpen(false);
    } catch (err) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await deleteMutation.mutateAsync({ id: editingId });
      toast({ title: "Berhasil", description: "Pekerja dihapus" });
      queryClient.invalidateQueries({ queryKey: getGetEmployeesQueryKey() });
      setIsDeleteOpen(false);
    } catch (err) {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Data Pekerja</h1>
          <p className="text-muted-foreground mt-2 text-lg">Kelola direktori seluruh karyawan dan informasi kepegawaian.</p>
        </div>
        <Button onClick={() => openForm()} className="btn-primary-gradient rounded-xl px-6 h-12 shadow-lg hover:shadow-xl">
          <Plus className="h-5 w-5 mr-2" />
          Tambah Pekerja
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
        <div className="p-5 bg-muted/20 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari berdasarkan nama atau nopek..."
              className="pl-11 h-11 bg-background rounded-xl border-border/50 focus-visible:ring-primary shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-semibold text-muted-foreground">
            {filteredEmployees?.length || 0} Pekerja Ditemukan
          </div>
        </div>
        <CardContent className="p-0">
          <Table className="table-premium">
            <TableHeader>
              <TableRow className="table-premium-header">
                <TableHead className="w-[100px] pl-6">Profil</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Nopek</TableHead>
                <TableHead>Jabatan & Dept</TableHead>
                <TableHead className="text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-48">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                      <p className="text-muted-foreground font-medium">Memuat data pekerja...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-48 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-medium">Tidak ada pekerja ditemukan.</p>
                      <p className="text-sm mt-1">Coba gunakan kata kunci pencarian lain.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((emp) => (
                  <TableRow key={emp.id} className="table-premium-row group">
                    <TableCell className="pl-6 py-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center overflow-hidden border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                        {emp.foto ? (
                          <img src={emp.foto} alt={emp.nama} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary">{emp.nama.charAt(0)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{emp.nama}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-muted/50 px-2.5 py-1 rounded-md text-muted-foreground font-semibold border border-border/50">
                        {emp.nopek}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{emp.jabatan || "-"}</span>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{emp.departemen || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/karyawan/${emp.id}`} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors flex items-center justify-center h-10 w-10">
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary rounded-lg transition-colors h-10 w-10" onClick={() => openForm(emp)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors h-10 w-10"
                          onClick={() => {
                            setEditingId(emp.id);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">{editingId ? "Edit Pekerja" : "Tambah Pekerja Baru"}</DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5 bg-card">
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="nama" className="font-semibold">Nama Lengkap *</Label>
                <Input id="nama" className="bg-muted/30 h-11" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nopek" className="font-semibold">Nomor Pekerja (Nopek) *</Label>
                <Input id="nopek" className="bg-muted/30 h-11 font-mono" value={formData.nopek} onChange={e => setFormData({...formData, nopek: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="jabatan" className="font-semibold">Jabatan</Label>
                  <Input id="jabatan" className="bg-muted/30 h-11" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departemen" className="font-semibold">Departemen</Label>
                  <Input id="departemen" className="bg-muted/30 h-11" value={formData.departemen} onChange={e => setFormData({...formData, departemen: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto" className="font-semibold">URL Foto</Label>
                <Input id="foto" className="bg-muted/30 h-11" value={formData.foto} onChange={e => setFormData({...formData, foto: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border/50">
              <Button type="button" variant="outline" className="h-11 px-6 rounded-xl" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit" className="btn-primary-gradient h-11 px-8 rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] text-center p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold justify-center flex">Hapus Pekerja</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-base text-muted-foreground mb-4">
            Tindakan ini tidak dapat dibatalkan. Data pekerja beserta riwayat yang terkait mungkin akan ikut terhapus atau menjadi anonim.
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:justify-center gap-3">
            <Button variant="outline" className="w-full sm:w-auto h-11 rounded-xl" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" className="w-full sm:w-auto h-11 rounded-xl bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}