import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentApp from './pages/StudentApp';
import AdminPanel from './pages/AdminPanel';
import Viewer from './pages/Viewer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentApp />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/viewer" element={<Viewer />} />
      </Routes>
    </BrowserRouter>
  );
}
