import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AsphaltEstimator from "@/components/AsphaltEstimator";
import AsphaltMap from "@/components/AsphaltMap";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <div className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-4 text-sm">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/overwatch" className="hover:underline">Overwatch</Link>
              <Link to="/ai-map" className="hover:underline">AI Map</Link>
            </div>
          </div>
          <Routes>
            <Route path="/" element={
              <div className="max-w-6xl mx-auto p-4">
                <AsphaltEstimator />
              </div>
            } />
            <Route path="/overwatch" element={
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Overwatch</h1>
                <AsphaltMap />
              </div>
            } />
            <Route path="/ai-map" element={
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">AI Map</h1>
                <AsphaltMap />
              </div>
            } />
            <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-bold">Page Not Found</h1></div>} />
          </Routes>
        </div>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
