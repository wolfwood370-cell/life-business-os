import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CrmProvider } from "@/store/crmStore";
import { PrivacyModeProvider } from "@/store/privacyMode";
import { AppLayout } from "@/layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import SalesCoach from "./pages/SalesCoach";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CrmProvider>
      <PrivacyModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/coach" element={<SalesCoach />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PrivacyModeProvider>
    </CrmProvider>
  </QueryClientProvider>
);

export default App;
