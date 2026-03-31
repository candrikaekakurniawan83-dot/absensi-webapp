import { 
  useGetAttendanceSummary, 
  getGetAttendanceSummaryQueryKey,
  useGetAttendanceRecords,
  getGetAttendanceRecordsQueryKey,
  AttendanceRecordStatus
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Umbrella, Briefcase, UserCheck, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetAttendanceSummary({
    query: { queryKey: getGetAttendanceSummaryQueryKey() }
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: records, isLoading: isLoadingRecords } = useGetAttendanceRecords(
    { date: today },
    { query: { queryKey: getGetAttendanceRecordsQueryKey({ date: today }) } }
  );

  const stats = [
    { title: "Izin", value: summary?.izin || 0, icon: UserCheck, color: "stat-card-blue" },
    { title: "Tidak Hadir", value: summary?.tidak_hadir || 0, icon: UserX, color: "stat-card-red" },
    { title: "Cuti", value: summary?.cuti || 0, icon: Umbrella, color: "stat-card-amber" },
    { title: "Dinas", value: summary?.dinas || 0, icon: Briefcase, color: "stat-card-teal" },
  ];

  const getRecordsByStatus = (status: AttendanceRecordStatus) => {
    return records?.filter(r => r.status === status) || [];
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard Utama</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Ringkasan status kehadiran pegawai pada {format(new Date(), 'dd MMMM yyyy')}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className={`stat-card ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{stat.title}</p>
                {isLoadingSummary ? (
                  <div className="h-10 w-16 bg-white/20 animate-pulse mt-2 rounded-lg" />
                ) : (
                  <h3 className="text-4xl font-extrabold mt-1">{stat.value}</h3>
                )}
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                <stat.icon className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <stat.icon className="h-32 w-32" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.values(AttendanceRecordStatus).map((status) => {
          const statusRecords = getRecordsByStatus(status);
          const title = status === "tidak_hadir" ? "Tidak Hadir" : status.charAt(0).toUpperCase() + status.slice(1);
          
          return (
            <Card key={status} className="flex flex-col border-border/50 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/40 border-b py-5">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    {title}
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-sm">
                    {statusRecords.length} Pegawai
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {isLoadingRecords ? (
                  <div className="p-6 space-y-4">
                    <div className="h-5 bg-muted animate-pulse rounded w-full" />
                    <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                ) : statusRecords.length === 0 ? (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <UserCheck className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Tidak ada record untuk status ini hari ini.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {statusRecords.map((record) => (
                      <li key={record.id} className="p-5 hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-bold text-sm text-foreground">{record.employee?.nama || `Pegawai #${record.employeeId}`}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">{record.employee?.jabatan || '-'}</p>
                          </div>
                          {record.alasan && (
                            <span className="text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg max-w-[200px] truncate shadow-sm border" title={record.alasan}>
                              {record.alasan}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}