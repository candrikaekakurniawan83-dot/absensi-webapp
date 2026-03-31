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

  const filteredEmployees = employees?.filter(emp => 
    emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.nopek.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Pekerja</h1>
          <p className="text-muted-foreground mt-1">Kelola direktori seluruh karyawan dan informasi kepegawaian.</p>
        </div>
        <Button onClick={() => openForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Pekerja
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <div className="p-4 border-b flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau nopek..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">Profil</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Nopek</TableHead>
                <TableHead>Jabatan & Dept</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32">Memuat data...</TableCell>
                </TableRow>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">Tidak ada data pekerja ditemukan.</TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border">
                        {emp.foto ? (
                          <img src={emp.foto} alt={emp.nama} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{emp.nama}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{emp.nopek}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{emp.jabatan || "-"}</span>
                        <span className="text-xs text-muted-foreground">{emp.departemen || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/karyawan/${emp.id}`} className="text-primary hover:bg-primary/10 p-2 rounded-md transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => openForm(emp)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Pekerja" : "Tambah Pekerja Baru"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input id="nama" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nopek">Nomor Pekerja (Nopek) *</Label>
                <Input id="nopek" value={formData.nopek} onChange={e => setFormData({...formData, nopek: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input id="jabatan" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departemen">Departemen</Label>
                <Input id="departemen" value={formData.departemen} onChange={e => setFormData({...formData, departemen: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto">URL Foto</Label>
                <Input id="foto" value={formData.foto} onChange={e => setFormData({...formData, foto: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Pekerja</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data pekerja ini?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
