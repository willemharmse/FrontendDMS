import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Forbidden from './components/Forbidden';
import NotFound from './components/NotFound';
import FileInfo from './components/FileInfo';
import UploadPage from './components/UploadPage';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import CreatePage from './components/CreatePage';
import UserManagement from './components/UserManagement';
import PreviewPage from './components/PreviewPage';
import DeveloperPage from './components/DeveloperPage';
import ForgotPage from './components/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="FrontendDMS/" element={<LoginPage />} />
        <Route path="FrontendDMS/home" element={<HomePage />} />
        <Route path="FrontendDMS/documentManage" element={<FileInfo />} />
        <Route path="FrontendDMS/documentCreate" element={<CreatePage />} />
        <Route path='FrontendDMS/upload' element={<UploadPage />} />
        <Route path='FrontendDMS/userManagement' element={<UserManagement />} />
        <Route path='FrontendDMS/403' element={<Forbidden />} />
        <Route path="FrontendDMS/preview/:fileId" element={<PreviewPage />} />
        <Route path='*' element={<NotFound />} />
        <Route path="FrontendDMS/repair" element={<DeveloperPage />} />
        <Route path="FrontendDMS/forgot" element={<ForgotPage />} />
      </Routes>
    </Router>
  );
}

export default App;