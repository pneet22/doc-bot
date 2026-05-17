import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Chat from "./pages/Chat.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DocumentDetails from "./pages/DocumentDetails.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import UploadDocuments from "./pages/UploadDocuments.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents/upload" element={<UploadDocuments />} />
          <Route path="/documents/:documentId" element={<DocumentDetails />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

