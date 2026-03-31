import { Link } from "wouter";
import { 
  useGetDocumentSummary, 
  getGetDocumentSummaryQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight } from "lucide-react";

export default function Dokumen() {
  const { data: summary, isLoading } = useGetDocumentSummary({
    query: { queryKey: getGetDocumentSummaryQueryKey() }
  });

  const docTypes = [
    { type: "SP3S", label: "SP3S", desc: "Surat Perintah Perjalanan Pegawai Sementara" },
    { type: "SIJ", label: "SIJ", desc: "Surat Izin Jalan" },
    { type: "CUTI", label: "Cuti", desc: "Formulir Permohonan Cuti" },
    { type: "DINAS", label: "Dinas", desc: "Surat Keterangan Dinas Luar" },
    { type: "SKMJ", label: "SKMJ", desc: "Surat Keterangan Mengikuti Jabatan" },
    { type: "SURAT_TUGAS", label: "Surat Tugas", desc: "Pemberian Tugas Khusus" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menu Dokumen</h1>
        <p className="text-muted-foreground mt-1">Pilih jenis dokumen untuk melihat dan mengelola arsip surat.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {docTypes.map((doc) => {
          const count = summary ? (summary as any)[doc.type] : 0;

          return (
            <Link key={doc.type} href={`/dokumen/${doc.type}`}>
              <Card className="hover-elevate cursor-pointer border-none shadow-sm transition-all group h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    {isLoading ? (
                      <div className="h-6 w-8 bg-muted animate-pulse rounded" />
                    ) : (
                      <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {count} file
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{doc.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4 leading-snug">
                      {doc.desc}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                    Kelola Dokumen <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
