import { Link, useLocation } from "wouter";
import { 
  Building2, 
  Users, 
  Clock, 
  FileText, 
  Menu,
  Package,
  MessageSquareWarning
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard Utama", href: "/", icon: Building2 },
    { name: "Data Pekerja", href: "/karyawan", icon: Users },
    { name: "Rekap Kehadiran", href: "/absensi", icon: Clock },
    { name: "Menu Dokumen", href: "/dokumen", icon: FileText },
    { name: "Inventori", href: "/inventori", icon: Package },
    { name: "Keluhan Pelanggan", href: "/keluhan", icon: MessageSquareWarning },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:flex`}>
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">SI Kepegawaian</h1>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <header className="h-16 flex items-center px-4 md:px-8 border-b bg-card justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="font-semibold text-lg md:hidden">SIK</div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm font-medium hidden md:block text-muted-foreground mr-2">
              Administrator
            </div>
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
