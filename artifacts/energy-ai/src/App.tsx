import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";

import Landing from "@/pages/Landing";
import Test from "@/pages/Test";
import Enter from "@/pages/Enter";
import Chat from "@/pages/Chat";
import Pricing from "@/pages/Pricing";
import Community from "@/pages/Community";
import Feed from "@/pages/Feed";
import PostDetail from "@/pages/PostDetail";
import DM from "@/pages/DM";
import DMConvo from "@/pages/DMConvo";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/test" component={Test} />
      <Route path="/enter" component={Enter} />
      <Route path="/chat" component={Chat} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/community" component={Community} />
      <Route path="/feed" component={Feed} />
      <Route path="/feed/:id" component={PostDetail} />
      <Route path="/dm" component={DM} />
      <Route path="/dm/:alias" component={DMConvo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
