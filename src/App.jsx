import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserRoutes from "./routes/UserRoutes";
import AdminRoutes from "./routes/AdminRoutes";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* User-facing routes */}
        <Route path="/*" element={<UserRoutes />} />

        {/* Admin-facing routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
