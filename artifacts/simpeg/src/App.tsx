import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Karyawan from "@/pages/karyawan";
import KaryawanDetail from "@/pages/karyawan-detail";
import Absensi from "@/pages/absensi";
import Dokumen from "@/pages/dokumen";
import DokumenList from "@/pages/dokumen-list";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/karyawan" component={Karyawan} />
        <Route path="/karyawan/:id" component={KaryawanDetail} />
        <Route path="/absensi" component={Absensi} />
        <Route path="/dokumen" component={Dokumen} />
        <Route path="/dokumen/:type" component={DokumenList} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
