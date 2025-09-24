import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

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
            <Route path="/" element={<div className="p-8"><h1 className="text-2xl font-bold">Welcome to Asphalt Estimator</h1></div>} />
            <Route path="/overwatch" element={<div className="p-8"><h1 className="text-2xl font-bold">Overwatch</h1></div>} />
            <Route path="/ai-map" element={<div className="p-8"><h1 className="text-2xl font-bold">AI Map</h1></div>} />
            <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-bold">Page Not Found</h1></div>} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
