import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadPage.css";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import UploadPopup from "./UploadPage/UploadPopup";
import { toast, ToastContainer } from 'react-toastify';
import Select from "react-select";
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling


const UploadPage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [discipline, setDiscipline] = useState('');
  const [owner, setOwner] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [departmentHead, setDepartmentHead] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [users, setUsers] = useState([]); // State to hold the list of users
  const [deptHeads, setDeptHeads] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const adminRoles = ['admin', 'teamleader', 'developer'];
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error("Please fill in all required fields marked by a *", {
        closeButton: false,
        style: {
          textAlign: 'center'
        }
      })
    } else {
      handleFileUpload();  // Call your function when the form is valid
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decodedToken = jwtDecode(storedToken);
      if (!(adminRoles.includes(decodedToken.role))) {
        navigate("/FrontendDMS/403");
      }
    }
  }, [navigate]);

  useEffect(() => {
    // Function to fetch users
    const fetchValues = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();

        setDocTypes(data[0].documentType);
        setDisciplines(data[0].disciplines);
        setUsers(data[0].owner); // Set users from the fetched data
        setDeptHeads(data[0].departmentHeads);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchValues();
  }, []); // Run only once on component mount

  const isFormValid = () => {
    return selectedFile && discipline && documentType && owner && departmentHead && reviewDate && status;
  };

  const handleFileUpload = async (e) => {
    if (!isFormValid()) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('departmentHead', departmentHead);
    formData.append('owner', JSON.stringify(owner));
    formData.append('documentType', documentType);
    formData.append('discipline', discipline);
    formData.append('status', status);
    formData.append('reviewDate', reviewDate);

    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(response.error || 'Failed to upload file');
      }
      await response.json();
      setSuccessMessage("File uploaded successfully!");
      setShowPopup(true);
      setSelectedFile(null);
      setDiscipline('');
      setOwner('');
      setDocumentType('');
      setDepartmentHead('');
      setStatus('');
      setReviewDate('');
      setError(null);
    } catch (error) {
      setError(error.message);
      setSuccessMessage('');
      setLoading(false);
    } finally {
      setLoading(false); // Reset loading state after response
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div className="upload-page-container">
      <button className="logo-button" onClick={() => navigate('/FrontendDMS/home')}>
        <img src="logo.webp" alt="Home" />
      </button>
      <button className="log-button-up" onClick={() => navigate('/FrontendDMS/')}>
        Log Out
      </button>
      <button className="back-button-up" onClick={() => navigate('/FrontendDMS/documentManage')}>
        Back
      </button>
      <div className="upload-box">
        <h2>Upload Document</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>File <span className="required-field">*</span></label>
            <div className="custom-file-input">
              <input type="file" id="file" onChange={handleFileChange} />
              <label htmlFor="file">Choose File</label>
              {selectedFile && <span className="file-name">{selectedFile.name}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Discipline <span className="required-field">*</span></label>
              <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                <option value="">Select Discipline</option>
                {disciplines.map((discipline, index) => (
                  <option key={index} value={discipline}>
                    {discipline}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="up-select">Authors <span className="required-field">*</span></label>
              <Select
                options={users.map(user => ({ value: user, label: user }))}
                isMulti
                onChange={(selected) => setOwner(selected.map(s => s.value))}
                className="sidebar-select-up"
                placeholder="Select Authors"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department Head <span className="required-field">*</span></label>
              <select value={departmentHead} onChange={(e) => setDepartmentHead(e.target.value)}>
                <option value="">Select Head</option>
                {deptHeads.sort().map((head, index) => (
                  <option key={index} value={head}>
                    {head}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Document Status <span className="required-field">*</span></label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select Status</option>
                <option value="in_review">In Review</option>
                <option value="in_approval">In Approval</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Document Type <span className="required-field">*</span></label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                <option value="">Select Document Type</option>
                {docTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Review Date <span className="required-field">*</span></label>
              <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)}></input>
            </div>
          </div>
          <button className="subBut" type="submit" disabled={loading} title="Enter all fields marked by a * to submit the form">{loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Upload File'}</button>
        </form>
        {showPopup && <UploadPopup message={successMessage} onClose={() => setShowPopup(false)} />}
        {error && <div className="error-message">{error}</div>}
      </div>
      <ToastContainer />
    </div>
  );
};

export default UploadPage;
