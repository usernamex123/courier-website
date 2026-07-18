import { Routes, Route } from "react-router-dom";
import Layout from "./layout/layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import GroundFreight from "./components/GroundFreight";

export default function App() {
  return (
    <Routes>
      {/* Layout acts as the parent for all pages you want the navbar on */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="auth" element={<Auth />} />
        <Route path="ground-freight" element={<GroundFreight />} />
      </Route>
    </Routes>
  );
}