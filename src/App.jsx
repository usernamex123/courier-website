import { Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import Layout from "./layout/layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import GroundFreight from "./components/GroundFreight";
import GetStarted from "./components/GetStarted";

export default function App() {
  return (
    <>
      {/* 
        Toaster provides standard, attractive notifications.
        'richColors' enables automatic green/red coloring for success/error.
      */}
      <Toaster richColors position="top-right" />
      
      <Routes>
        {/* Layout acts as the parent for all pages */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="ground-freight" element={<GroundFreight />} />
          <Route path="get-started" element={<GetStarted />} />
        </Route>
      </Routes>
    </>
  );
}