import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const DeveloperPage = () => {
    const navigate = useNavigate();
    const [discipline, setDiscipline] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [owner, setOwner] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [departmentHead, setDepartmentHead] = useState('');
    const [docID, setDocID] = useState('');
    const [reviewDate, setReviewDate] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [files, setFiles] = useState([]); // State to hold the list of users
    const [fileID, setFileID] = useState('');
    const adminRoles = ['developer'];

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
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/file/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setFiles(data.files);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchFiles();
    }, []); // Run only once on component mount

    const handleFileSelection = (e) => {
        setSuccessMessage('');
        const selectedID = e.target.value;
        setFileID(selectedID);

        // Find the selected file's details
        const file = files.find((file) => file._id === selectedID);
        if (file) {
            setSelectedFile(file);

            // Populate the fields
            setDiscipline(file.discipline || '');
            setOwner(file.owner || '');
            setDocumentType(file.documentType || '');
            setDepartmentHead(file.departmentHead || '');
            setDocID(file.docID || '');
            setReviewDate(file.reviewDate || '');
            setStatus(file.status || '');

            const formattedDate = file.reviewDate ? new Date(file.reviewDate).toISOString().split('T')[0] : '';
            setReviewDate(formattedDate);
        } else {
            // Clear fields if no file is selected
            setDiscipline('');
            setOwner('');
            setDocumentType('');
            setDepartmentHead('');
            setDocID('');
            setReviewDate('');
            setStatus('');
        }
    };

    const isFormValid = () => {
        return discipline && documentType && owner && departmentHead && docID && reviewDate && status && fileID;
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!isFormValid()) return;

        const formData = new FormData();
        formData.append('departmentHead', departmentHead);
        formData.append('owner', owner);
        formData.append('documentType', documentType);
        formData.append('docID', docID);
        formData.append('discipline', discipline);
        formData.append('status', status);
        formData.append('reviewDate', reviewDate);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/repair/${fileID}`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error(response.error || 'Failed to upload file');
            }
            await response.json();
            setSuccessMessage('File uploaded successfully!');
            setError(null);
        } catch (error) {
            setError(error.message);
            setSuccessMessage('');
        }
    };

    return (
        <div className="upload-page-container">
            <button className="logo-button" onClick={() => navigate('/FrontendDMS/documentManage')}>
                <img src="logo.webp" alt="Home" />
            </button>
            <button className="log-button" onClick={() => navigate('/FrontendDMS/')}>
                Log Out
            </button>
            <div className="upload-box">
                <h2>Repair Documents</h2>
                <form onSubmit={handleFileUpload}>
                    <div className="form-group">
                        <label>File</label>
                        <select value={fileID} onChange={handleFileSelection}>
                            <option value="">Select File</option>
                            {files.map((file) => (
                                <option key={file._id} value={file._id}>
                                    {file.fileName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Discipline</label>
                            <input value={discipline} onChange={(e) => setDiscipline(e.target.value)}></input>
                        </div>
                        <div className="form-group">
                            <label>Owner</label>
                            <input value={owner} onChange={(e) => setOwner(e.target.value)}></input>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Department Head</label>
                            <input value={departmentHead} onChange={(e) => setDepartmentHead(e.target.value)}></input>
                        </div>
                        <div className="form-group">
                            <label>Document Status</label>
                            <input value={status} onChange={(e) => setStatus(e.target.value)}></input>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Document Type</label>
                            <input value={documentType} onChange={(e) => setDocumentType(e.target.value)}></input>
                        </div>
                        <div className="form-group">
                            <label>Document ID</label>
                            <input value={docID} onChange={(e) => setDocID(e.target.value)}></input>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Review Date</label>
                            <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)}></input>
                        </div>
                    </div>
                    <button type="submit" disabled={!isFormValid()}>Repair Document</button>
                </form>
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
            </div>
        </div>
    );
};

export default DeveloperPage;
