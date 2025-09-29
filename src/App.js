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
import CreatePageSI from './components/DocumentCreationPages/CreatePageSI';
import GeneratedStandardsInfo from './components/GeneratedStandardsInfo';
import RiskReviewPageIBRA from './components/RiskAssessmentPages/RiskReviewPageIBRA';
import RiskReviewPageJRA from './components/RiskAssessmentPages/RiskReviewPageJRA';
import GeneratedSpecialInfo from './components/GeneratedSpecialInfo';
import VersionHistoryIBRA from './components/RiskRelated/RiskDocuments/VersionHistoryIBRA';
import DeletedRiskDocumentsIBRA from './components/RiskRelated/RiskDocuments/DeletedRiskDocumentsIBRA';
import RiskReviewPageBLRA from './components/RiskAssessmentPages/RiskReviewPageBLRA';
import CreatePageStandardsReview from './components/DocumentCreationPages/CreatePageStandardsReview';
import CreatePageSIReview from './components/DocumentCreationPages/CreatePageSIReview';
import DeletedDocumentsSI from './components/DocumentCreationPages/DeletedDocumentsSI';
import VersionHistorySI from './components/DocumentCreationPages/VersionHistorySI';
import VersionHistoryStandard from './components/DocumentCreationPages/VersionHistoryStandard';
import DeletedDocumentsStandard from './components/DocumentCreationPages/DeletedDocumentsStandard';
import VersionHistoryBLRA from './components/RiskRelated/RiskDocuments/VersionHistoryBLRA';
import DeletedRiskDocumentsBLRA from './components/RiskRelated/RiskDocuments/DeletedRiskDocumentsBLRA';
import VersionHistoryJRA from './components/RiskRelated/RiskDocuments/VersionHistoryJRA';
import DeletedRiskDocumentsJRA from './components/RiskRelated/RiskDocuments/DeletedRiskDocumentsJRA';
import VersionHistoryProcedure from './components/DocumentCreationPages/VersionHistoryProcedure';
import DeletedDocumentsProcedure from './components/DocumentCreationPages/DeletedDocumentsProcedure';
import UserProfile from './components/UserProfile/UserProfile';
import CourseHome from './components/TrainingManagement/CourseHome';
import TMSAdminPage from './components/SystemAdmin/TMSAdminPage';
import CourseDetails from './components/TrainingManagement/CourseDetails';
import TrainersHome from './components/TrainingManagement/TrainerManagement/TrainersHome';
import TrainerDetails from './components/TrainingManagement/TrainerManagement/TrainerDetails';
import TraineesHome from './components/TrainingManagement/TraineeMangement/TraineesHome';
import TraineeDetails from './components/TrainingManagement/TraineeMangement/TraineeDetails';
import DMSAdminPage from './components/SystemAdmin/DMSAdminPage';
import RMSAdminPage from './components/SystemAdmin/RMSAdminPage';
import DDSAdminPage from './components/SystemAdmin/DDSAdminPage';
import TrainingAdminPage from './components/SystemAdmin/TrainingAdminPage';
import CourseCreationPage from './components/TrainingManagement/CourseCreation/CourseCreationPage';
import CourseViewPage from './components/TrainingManagement/CourseView/CourseViewPage';
import UserHomePageTMS from './components/TrainingManagement/UserView/UserHomePageTMS';
import FlameProofHome from './components/FlameproofDMS/FlameProofHome';
import FlameProofMain from './components/FlameproofDMS/FlameProofMain';
import FlameProofSub from './components/FlameproofDMS/FlameProofSub';
import FlameProofAllSites from './components/FlameproofDMS/FlameProofAllSites';
import FlameProofInfoAll from './components/FlameproofDMS/FlameProofInfoAll';
import FCMSAdminPage from './components/SystemAdmin/FCMSAdminPage';
import PreviewCertificate from './components/FlameproofDMS/PreviewCertificate';
import EPACSHome from './components/EPACS/EPACSHome';
import CertificateVersionHistory from './components/FlameproofDMS/CertificateVersionHistory';
import FlameProofTrash from './components/FlameproofDMS/FlameProofTrash';
import FCMSSiteAdmin from './components/SystemAdmin/FCMSSiteAdmin';
import VisitorsInductionHomePage from './components/VisitorsInduction/VisitorsInductionHomePage';
import VisitorsInductionSite from './components/VisitorsInductionSite';
import FCMSAssetTypes from './components/SystemAdmin/FCMSAssetTypes';
import InductionViewPage from './components/TrainingManagement/CourseView/InductionViewPage';
import VisitorInductionHomePage from './components/TrainingManagement/UserView/VisitorInductionHomePage';
import VisitorLogin from './components/VisitorsInduction/VisitorLogin';
import InductionCreationPage from './components/VisitorsInduction/InductionCreation/InductionCreationPage';
import GeneratedInductionInfo from './components/VisitorsInduction/InductionCreation/GeneratedInductionInfo';
import ManageComponentDates from './components/FlameproofDMS/ManageComponentDates';
import TMSHomePage from './components/TrainingManagement/TMSHomePage';
import ManageComponentAssets from './components/FlameproofDMS/ManageComponentAssets';

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
        <Route path="FrontendDMS/visitorLogin" element={<VisitorLogin />} />
        <Route path="FrontendDMS/home" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <HomePage />} />
        <Route path='FrontendDMS/documentCreateHome' element={<DCHomePage />} />
        <Route path="FrontendDMS/documentCreateProc/:type" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePage />} />
        <Route path="FrontendDMS/documentCreateStand/:type" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePageStandards />} />
        <Route path="FrontendDMS/documentCreateSI/:type" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePageSI />} />
        <Route path='FrontendDMS/userManagement' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <UserManagement />} />
        <Route path='FrontendDMS/403' element={<Forbidden />} />
        <Route path="FrontendDMS/preview/:fileId" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <PreviewPage />} />
        <Route path='FrontendDMS/forgot' element={isMobile ? <Navigate to="/FrontendDMS/mobileForgot" /> : <ForgotPassword />} />
        <Route path='FrontendDMS/updateFile' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <VersionControlPage />} />
        <Route path='FrontendDMS/generatedFileInfo' element={<GeneratedFileInfo />} />
        <Route path='FrontendDMS/deletedProcedureDocs' element={<DeletedDocumentsProcedure />} />
        <Route path='FrontendDMS/generatedSpecialFiles' element={<GeneratedSpecialInfo />} />
        <Route path='FrontendDMS/deletedSIDocs' element={<DeletedDocumentsSI />} />
        <Route path='FrontendDMS/generatedStandardFiles' element={<GeneratedStandardsInfo />} />
        <Route path='FrontendDMS/deletedStandardDocs' element={<DeletedDocumentsStandard />} />
        <Route path='FrontendDMS/adminApprover' element={<AdminApprovalPage />} />
        <Route path='FrontendDMS/review/:fileId' element={<ReviewPage />} />
        <Route path='FrontendDMS/reviewIBRA/:fileId/:type' element={<RiskReviewPageIBRA />} />
        <Route path='FrontendDMS/reviewJRA/:fileId/:type' element={<RiskReviewPageJRA />} />
        <Route path='FrontendDMS/reviewBLRA/:fileId/:type' element={<RiskReviewPageBLRA />} />
        <Route path='FrontendDMS/reviewStandard/:fileId/:type' element={<CreatePageStandardsReview />} />
        <Route path='FrontendDMS/reviewSpecial/:fileId/:type' element={<CreatePageSIReview />} />
        <Route path="FrontendDMS/documentManageHome" element={<FileInfoHome />} />
        <Route path="FrontendDMS/documentManage/:type" element={isMobile ? <Navigate to="/mobileFI" /> : <FileInfo />} />
        <Route path="FrontendDMS/EPACSHome" element={<EPACSHome />} />
        <Route path="FrontendDMS/flameManageSites" element={<FlameProofAllSites />} />
        <Route path="FrontendDMS/flameTrash" element={<FlameProofTrash />} />
        <Route path="FrontendDMS/flameManageHome/:site" element={<FlameProofHome />} />
        <Route path="FrontendDMS/flameAllMineAsset" element={<FlameProofInfoAll />} />
        <Route path="FrontendDMS/flameManage/:type/:site" element={<FlameProofMain />} />
        <Route path="FrontendDMS/flameManageSub/:type/:assetId" element={<FlameProofSub />} />
        <Route path="FrontendDMS/flameComponents/:id" element={<ManageComponentDates />} />
        <Route path="FrontendDMS/flameVersionHistory/:id/:image/:text" element={<CertificateVersionHistory />} />
        <Route path="FrontendDMS/flameSites/" element={<FCMSSiteAdmin />} />
        <Route path="FrontendDMS/flameAssets/" element={<FCMSAssetTypes />} />
        <Route path="FrontendDMS/previewCertificate/:fileId" element={<PreviewCertificate />} />
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
        <Route path="FrontendDMS/versionHistoryIBRA/:id" element={<VersionHistoryIBRA />} />
        <Route path="FrontendDMS/versionHistorySpecial/:id" element={<VersionHistorySI />} />
        <Route path="FrontendDMS/versionHistoryStandard/:id" element={<VersionHistoryStandard />} />
        <Route path="FrontendDMS/versionHistoryProcedure/:id" element={<VersionHistoryProcedure />} />
        <Route path="FrontendDMS/versionHistoryBLRA/:id" element={<VersionHistoryBLRA />} />
        <Route path="FrontendDMS/versionHistoryJRA/:id" element={<VersionHistoryJRA />} />
        <Route path='FrontendDMS/riskHome' element={<RiskHomePage />} />
        <Route path="FrontendDMS/riskIBRA/:type" element={<RiskManagementPageIBRA />} />
        <Route path="FrontendDMS/riskJRA/:type" element={<RiskManagementPageJRA />} />
        <Route path="FrontendDMS/riskBTA/:type" element={<RiskManagementPageBTA />} />
        <Route path="FrontendDMS/riskBLRA/:type" element={<RiskManagementPageBLRA />} />
        <Route path="FrontendDMS/controls" element={<ControlAttributes />} />
        <Route path='FrontendDMS/generatedIBRADocs' element={<RiskDocumentsIBRA />} />
        <Route path='FrontendDMS/deletedIBRADocs' element={<DeletedRiskDocumentsIBRA />} />
        <Route path='FrontendDMS/generatedJRADocs' element={<RiskDocumentsJRA />} />
        <Route path='FrontendDMS/deletedJRADocs' element={<DeletedRiskDocumentsJRA />} />
        <Route path='FrontendDMS/generatedBLRADocs' element={<RiskDocumentsBLRA />} />
        <Route path='FrontendDMS/deletedBLRADocs' element={<DeletedRiskDocumentsBLRA />} />
        <Route path='FrontendDMS/riskApprover' element={<RiskSIPage />} />
        <Route path='FrontendDMS/futureEnhancement' element={<FutureEnhancementPage />} />
        <Route path='FrontendDMS/futureEnhancementRMS' element={<FutureEnhancementPageRMS />} />
        <Route path='FrontendDMS/userProfile' element={<UserProfile />} />
        <Route path='FrontendDMS/tmsAdmin' element={<TMSAdminPage />} />
        <Route path='FrontendDMS/tmsAdmin/manageTraining' element={<TrainingAdminPage />} />
        <Route path='FrontendDMS/dmsAdmin' element={<DMSAdminPage />} />
        <Route path='FrontendDMS/rmsAdmin' element={<RMSAdminPage />} />
        <Route path='FrontendDMS/ddsAdmin' element={<DDSAdminPage />} />
        <Route path='FrontendDMS/fcmsAdmin' element={<FCMSAdminPage />} />
        <Route path='FrontendDMS/trainingHomePage' element={<TMSHomePage />} />
        <Route path='FrontendDMS/courseMangement' element={<CourseHome />} />
        <Route path='FrontendDMS/courseDetails/:courseCode' element={<CourseDetails />} />
        <Route path='FrontendDMS/trainerManagement' element={<TrainersHome />} />
        <Route path='FrontendDMS/trainerDetails/:trainerName' element={<TrainerDetails />} />
        <Route path='FrontendDMS/traineeManagement' element={<TraineesHome />} />
        <Route path='FrontendDMS/traineeDetails/:traineeName' element={<TraineeDetails />} />
        <Route path='FrontendDMS/courseCreate' element={<CourseCreationPage />} />
        <Route path='FrontendDMS/courseView/:courseCode' element={<CourseViewPage />} />
        <Route path='FrontendDMS/inductionView/:id' element={<InductionViewPage />} />
        <Route path='FrontendDMS/courseHomeViewPage' element={<UserHomePageTMS />} />
        <Route path='FrontendDMS/visitorView' element={<VisitorsInductionHomePage />} />
        <Route path='FrontendDMS/visitorHomePage' element={<VisitorInductionHomePage />} />
        <Route path='FrontendDMS/visitor-profile' element={<VisitorsInductionSite />} />
        <Route path='FrontendDMS/inductionCreation' element={<InductionCreationPage />} />
        <Route path='FrontendDMS/generatedInductionInfo' element={<GeneratedInductionInfo />} />
        <Route path='FrontendDMS/flameproofComponents/:type/:id' element={<ManageComponentAssets />} />

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