import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import Forbidden from './components/Forbidden';
import NotFound from './components/NotFound';
import FileInfo from './components/FileInfo';
import HomePage from './components/HomePage';
import CreatePage from './components/DocumentCreationPages/CreatePage';
import UserManagement from './components/UserManagement';
import PreviewPage from './components/PreviewPage';
import DeveloperPage from './components/DeveloperPage';
import LoginPageMobile from './components/Mobile/LoginPageMobile';
import ForgotPassword from './components/ForgotPassword';
import ForgotPasswordMobile from './components/Mobile/ForgotPasswordMobile';
import MobileFileInfo from './components/Mobile/MobileFileInfo';
import MobileHomePage from './components/Mobile/MobileHomePage';
import VersionControlPage from './components/VersionControlPage';
import NewLogin from './components/NewLogin';
import ReviewPage from './components/ReviewPage';
import GeneratedFileInfo from './components/GeneratedFileInfo';
import AdminApprovalPage from './components/ValueChanges/AdminApprovalPage';
import FileInfoHome from './components/FileInfoHome';
import DepartmentHome from './components/DepartmentHome';
import DepartmentView from './components/DepartmentView';
import ConstructionCM from './components/ConstructionCM';
import ConstructionRM from './components/ConstructionRM';
import ConstructionTM from './components/ConstructionTM';
import AdminPage from './components/AdminPage';
import UserActivity from './components/UserActivity';
import VersionHistory from './components/FileInfo/VersionHistory';
import RiskManagementPageIBRA from './components/RiskAssessmentPages/RiskManagementPageIBRA';
import RiskManagementPageJRA from './components/RiskAssessmentPages/RiskManagementPageJRA';
import RiskHomePage from './components/RiskRelated/RiskHomePage';
import DCHomePage from './components/DCHomePage';
import TimeoutPopup from './components/AccountLockout/TimeoutPopup';
import ConstructionDDS from './components/Construction/ConstructionDDS';
import ConstructionRMS from './components/Construction/ConstructionRMS';
import ConstructionHelp from './components/Construction/ConstructionHelp';
import ControlAttributes from './components/RiskRelated/ControlAttributes';
import RiskDocumentsIBRA from './components/RiskRelated/RiskDocuments/RiskDocumentsIBRA';
import RiskDocumentsJRA from './components/RiskRelated/RiskDocuments/RiskDocumentsJRA';
import RiskDocumentsBLRA from './components/RiskRelated/RiskDocuments/RiskDocumentsBLRA';
import RiskManagementPageBTA from './components/RiskAssessmentPages/RiskManagementPageBTA';
import CreatePageStandards from './components/DocumentCreationPages/CreatePageStandards';
import RiskSIPage from './components/RiskRelated/RiskValueChanges/RiskSIPage';
import ConstructionJRA from './components/Construction/ConstructionJRA';
import RiskManagementPageBLRA from './components/RiskAssessmentPages/RiskManagementPageBLRA';
import FutureEnhancementPage from './components/FutureEnhancementPages/FutureEnhancementPage';
import FutureEnhancementPageRMS from './components/FutureEnhancementPages/FutureEnhancementPageRMS';

const AUTO_LOGOUT_TIME = 45 * 60 * 1000;
const WARNING_TIME = 5 * 60 * 1000;

function App() {
  const navigate = useNavigate();
  const timer = useRef(null);
  const warningTimer = useRef(null);
  const isLoggedIn = !!localStorage.getItem('token');
  const [showWarning, setShowWarning] = useState(false);

  const logout = () => {
    // Clear auth data (adjust to your app)
    localStorage.removeItem('token');
    console.log('Logged out due to inactivity');
    navigate('/FrontendDMS/');
    setShowWarning(false);
  };

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, AUTO_LOGOUT_TIME - WARNING_TIME);

    timer.current = setTimeout(() => {
      logout();
    }, AUTO_LOGOUT_TIME);
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // Start timer on mount

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isLoggedIn]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    logout();
  };

  return (
    <>
      <Routes>
        {/* Desktop Routes */}
        <Route path="FrontendDMS/" element={isMobile ? <Navigate to="/FrontendDMS/mobileLogin" /> : <NewLogin />} />
        <Route path="FrontendDMS/home" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <HomePage />} />
        <Route path='FrontendDMS/documentCreateHome' element={<DCHomePage />} />
        <Route path="FrontendDMS/documentCreateProc/:type" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePage />} />
        <Route path="FrontendDMS/documentCreateStand/:type" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePageStandards />} />
        <Route path='FrontendDMS/userManagement' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <UserManagement />} />
        <Route path='FrontendDMS/403' element={<Forbidden />} />
        <Route path="FrontendDMS/preview/:fileId" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <PreviewPage />} />
        <Route path="FrontendDMS/repair" element={<DeveloperPage />} />
        <Route path='FrontendDMS/forgot' element={isMobile ? <Navigate to="/FrontendDMS/mobileForgot" /> : <ForgotPassword />} />
        <Route path='FrontendDMS/updateFile' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <VersionControlPage />} />
        <Route path='FrontendDMS/generatedFileInfo' element={<GeneratedFileInfo />} />
        <Route path='FrontendDMS/adminApprover' element={<AdminApprovalPage />} />
        <Route path='FrontendDMS/review/:fileId' element={<ReviewPage />} />
        <Route path="FrontendDMS/documentManageHome" element={<FileInfoHome />} />
        <Route path="FrontendDMS/documentManage/:type" element={isMobile ? <Navigate to="/mobileFI" /> : <FileInfo />} />
        <Route path="FrontendDMS/departmentManage" element={<DepartmentHome />} />
        <Route path="FrontendDMS/department/:deptId" element={<DepartmentView />} />
        <Route path="FrontendDMS/constructionCM" element={<ConstructionCM />} />
        <Route path="FrontendDMS/constructionTM" element={<ConstructionTM />} />
        <Route path="FrontendDMS/constructionRM" element={<ConstructionRM />} />
        <Route path="FrontendDMS/constructionDDS" element={<ConstructionDDS />} />
        <Route path="FrontendDMS/constructionJRA" element={<ConstructionJRA />} />
        <Route path="FrontendDMS/constructionRMS/:type" element={<ConstructionRMS />} />
        <Route path="FrontendDMS/constructionHelp" element={<ConstructionHelp />} />
        <Route path="FrontendDMS/admin" element={<AdminPage />} />
        <Route path="FrontendDMS/userActivity/:id" element={<UserActivity />} />
        <Route path="FrontendDMS/versionHistory/:id" element={<VersionHistory />} />
        <Route path='FrontendDMS/riskHome' element={<RiskHomePage />} />
        <Route path="FrontendDMS/riskIBRA/:type" element={<RiskManagementPageIBRA />} />
        <Route path="FrontendDMS/riskJRA/:type" element={<RiskManagementPageJRA />} />
        <Route path="FrontendDMS/riskBTA/:type" element={<RiskManagementPageBTA />} />
        <Route path="FrontendDMS/riskBLRA/:type" element={<RiskManagementPageBLRA />} />
        <Route path="FrontendDMS/controls" element={<ControlAttributes />} />
        <Route path='FrontendDMS/generatedIBRADocs' element={<RiskDocumentsIBRA />} />
        <Route path='FrontendDMS/generatedJRADocs' element={<RiskDocumentsJRA />} />
        <Route path='FrontendDMS/generatedBLRADocs' element={<RiskDocumentsBLRA />} />
        <Route path='FrontendDMS/riskApprover' element={<RiskSIPage />} />
        <Route path='FrontendDMS/futureEnhancement' element={<FutureEnhancementPage />} />
        <Route path='FrontendDMS/futureEnhancementRMS' element={<FutureEnhancementPageRMS />} />

        {/* Mobile Routes */}
        <Route path='FrontendDMS/mobileLogin' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <LoginPageMobile />} />
        <Route path='FrontendDMS/mobileForgot' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <ForgotPasswordMobile />} />
        <Route path='FrontendDMS/mobileFI' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <MobileFileInfo />} />
        <Route path='FrontendDMS/mobileHome' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <MobileHomePage />} />

        {/* Not Found Page */}
        <Route path='*' element={<NotFound />} />
      </Routes>

      {showWarning && (<TimeoutPopup closeTimeoutModal={handleStayLoggedIn} remain={handleStayLoggedIn} quit={handleLogoutNow} />)}
    </>
  );
}

export default App;