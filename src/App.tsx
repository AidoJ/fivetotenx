import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DeepDive from "./pages/DeepDive";
import Admin from "./pages/Admin";
import Proposal from "./pages/Proposal";
// ScopingQuestionnaire retired — Game Plan merged into Straight Talk
import StraightTalk from "./pages/StraightTalk";
import ClientDetail from "./pages/ClientDetail";
import RefinementPortal from "./pages/RefinementPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/deep-dive" element={<DeepDive />} />
          <Route path="/straight-talk" element={<StraightTalk />} />
          {/* /scoping route retired — Game Plan merged into Straight Talk */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/proposal/:id" element={<Proposal />} />
          <Route path="/self-interview" element={<SelfInterview />} />
          <Route path="/refinement/:token" element={<RefinementPortal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
