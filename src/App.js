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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/documentManage" element={<FileInfo />} />
        <Route path="/documentCreate" element={<CreatePage />} />
        <Route path='/upload' element={<UploadPage />} />
        <Route path='/userManagement' element={<UserManagement />} />
        <Route path='/403' element={<Forbidden />} />
        <Route path="/preview/:fileId" element={<PreviewPage />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;