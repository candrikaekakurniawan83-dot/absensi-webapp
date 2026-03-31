import { 
  useGetAttendanceSummary, 
  getGetAttendanceSummaryQueryKey,
  useGetAttendanceRecords,
  getGetAttendanceRecordsQueryKey,
  AttendanceRecordStatus
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Umbrella, Briefcase, UserCheck } from "lucide-react";
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
    { title: "Izin", value: summary?.izin || 0, icon: UserCheck, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-950" },
    { title: "Tidak Hadir", value: summary?.tidak_hadir || 0, icon: UserX, color: "text-red-500", bg: "bg-red-100 dark:bg-red-950" },
    { title: "Cuti", value: summary?.cuti || 0, icon: Umbrella, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-950" },
    { title: "Dinas", value: summary?.dinas || 0, icon: Briefcase, color: "text-green-500", bg: "bg-green-100 dark:bg-green-950" },
  ];

  const getRecordsByStatus = (status: AttendanceRecordStatus) => {
    return records?.filter(r => r.status === status) || [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Utama</h1>
        <p className="text-muted-foreground mt-1">
          Ringkasan status kehadiran pegawai pada {format(new Date(), 'dd MMMM yyyy')}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden border-none shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                {isLoadingSummary ? (
                  <div className="h-8 w-16 bg-muted animate-pulse mt-2 rounded" />
                ) : (
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                )}
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.values(AttendanceRecordStatus).map((status) => {
          const statusRecords = getRecordsByStatus(status);
          const title = status === "tidak_hadir" ? "Tidak Hadir" : status.charAt(0).toUpperCase() + status.slice(1);
          
          return (
            <Card key={status} className="flex flex-col border-none shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  {title}
                  <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-1 rounded-full border">
                    {statusRecords.length} Pegawai
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {isLoadingRecords ? (
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                ) : statusRecords.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Tidak ada record untuk status ini hari ini.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {statusRecords.map((record) => (
                      <li key={record.id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{record.employee?.nama || `Pegawai #${record.employeeId}`}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{record.employee?.jabatan || '-'}</p>
                          </div>
                          {record.alasan && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-md max-w-[150px] truncate" title={record.alasan}>
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
