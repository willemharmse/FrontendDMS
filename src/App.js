import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
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
import LoginPageMobile from './components/Mobile/LoginPageMobile';
import ForgotPassword from './components/ForgotPassword';
import ForgotPasswordMobile from './components/Mobile/ForgotPasswordMobile';
import MobileFileInfo from './components/Mobile/MobileFileInfo';
import MobileHomePage from './components/Mobile/MobileHomePage';
import BatchUpload from './components/BatchUpload';
import PreviewWord from './components/PreviewWord';
import VersionControlPage from './components/VersionControlPage';
import ManageAbbreviations from './components/ValueChanges/ManageAbbreviations';
import ManageDefinitions from './components/ValueChanges/ManageDefinitions';
import Tester from './components/tester';

function App() {
  return (
    <Router>
      <Routes>
        {/* Desktop Routes */}
        <Route path="FrontendDMS/" element={isMobile ? <Navigate to="/FrontendDMS/mobileLogin" /> : <LoginPage />} />
        <Route path="FrontendDMS/home" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <HomePage />} />
        <Route path="FrontendDMS/documentManage" element={isMobile ? <Navigate to="/FrontendDMS/mobileFI" /> : <FileInfo />} />
        <Route path="FrontendDMS/documentCreate" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <CreatePage />} />
        <Route path='FrontendDMS/upload' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <UploadPage />} />
        <Route path='FrontendDMS/userManagement' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <UserManagement />} />
        <Route path='FrontendDMS/403' element={<Forbidden />} />
        <Route path="FrontendDMS/preview/:fileId" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <PreviewPage />} />
        <Route path="FrontendDMS/repair" element={<DeveloperPage />} />
        <Route path='FrontendDMS/forgot' element={isMobile ? <Navigate to="/FrontendDMS/mobileForgot" /> : <ForgotPassword />} />
        <Route path='FrontendDMS/updateFile' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <VersionControlPage />} />
        <Route path='FrontendDMS/manageAbbrs' element={<ManageAbbreviations />} />
        <Route path='FrontendDMS/manageTerms' element={<ManageDefinitions />} />
        <Route path='FrontendDMS/tester' element={<Tester />} />

        {/* Mobile Routes */}
        <Route path='FrontendDMS/mobileLogin' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <LoginPageMobile />} />
        <Route path='FrontendDMS/mobileForgot' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <ForgotPasswordMobile />} />
        <Route path='FrontendDMS/mobileFI' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <MobileFileInfo />} />
        <Route path='FrontendDMS/mobileHome' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <MobileHomePage />} />

        {/* Batch Upload (Accessible from any device) */}
        <Route path='FrontendDMS/batchUpload' element={<BatchUpload />} />

        {/* Not Found Page */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;