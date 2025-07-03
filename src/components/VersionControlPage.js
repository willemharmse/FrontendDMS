import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./VersionControlPage.css";
import { jwtDecode } from "jwt-decode";

const VersionControlPage = () => {
    const navigate = useNavigate();

    // State for the form fields
    const [selectedExistingFile, setSelectedExistingFile] = useState("");
    const [newFile, setNewFile] = useState(null);
    const [status, setStatus] = useState("");
    const [reviewDate, setReviewDate] = useState("");
    const [files, setFiles] = useState([]); // List of existing files
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");

    // Allowed roles
    const adminRoles = ["admin", "teamleader", "developer"];

    // Check for valid token/role on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decoded = jwtDecode(storedToken);
            if (!adminRoles.includes(decoded.role)) {
                navigate("/FrontendDMS/403");
            }
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    // Fetch existing files for the file select dropdown
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/file/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch files");
                }
                const data = await response.json();
                // Assuming data.files is an array of file objects with properties "id" and "name"
                setFiles(data.files || []);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchFiles();
    }, []);

    // Check if the form is valid
    const isFormValid = () => {
        return selectedExistingFile && newFile && status && reviewDate;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) return;

        const formData = new FormData();
        formData.append("existingFile", selectedExistingFile);
        formData.append("newFile", newFile);
        formData.append("status", status);
        formData.append("reviewDate", reviewDate);
        console.log(selectedExistingFile);
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/version/update/${selectedExistingFile}`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Upload failed");
            }
            await response.json();
            setSelectedExistingFile("");
            setNewFile(null);
            setStatus("");
            setReviewDate("");
            setSuccessMsg("File version updated successfully!");
            setError(null);
        } catch (err) {
            setError(err.message);
            setSuccessMsg("");
        }
    };

    // Handle file input change
    const handleNewFileChange = (e) => {
        setNewFile(e.target.files[0]);
    };

    return (
        <div className="vc-container">
            <button className="vc-logo-btn" onClick={() => navigate("/FrontendDMS/home")}>
                <img src="logo.webp" alt="Home" />
            </button>
            <button className="vc-logout-btn" onClick={handleLogout}>
                Log Out
            </button>
            <button className="vc-back-btn" onClick={() => navigate("/FrontendDMS/documentManage")}>
                Back
            </button>
            <div className="vc-box">
                <h2>Update File</h2>
                <form onSubmit={handleSubmit}>
                    <div className="vc-form-group">
                        <label htmlFor="existing-file-select">Select Existing File</label>
                        <select
                            id="existing-file-select"
                            value={selectedExistingFile}
                            className="vc-select vc-font-change"
                            onChange={(e) => setSelectedExistingFile(e.target.value)}
                        >
                            <option value="">Select a file</option>
                            {files.map((file, index) => (
                                <option key={index} value={file._id}>
                                    {file.fileName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="vc-form-group">
                        <label htmlFor="new-file">Select New File</label>
                        <div className="vc-custom-file-input">
                            <input type="file" id="new-file" className="vc-font-change" onChange={handleNewFileChange} />
                            <label htmlFor="new-file">Select File</label>
                            {newFile && <span className="vc-file-name vc-font-change">{newFile.name}</span>}
                        </div>
                    </div>
                    <div className="vc-form-group">
                        <label htmlFor="vc-status-select">Document Status</label>
                        <select
                            id="vc-status-select"
                            value={status}
                            className="vc-font-change"
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Select Status</option>
                            <option value="in_review">In Review</option>
                            <option value="in_approval">In Approval</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                    <div className="vc-form-group">
                        <label htmlFor="vc-review-date">Review Date</label>
                        <input
                            type="date"
                            id="vc-review-date"
                            value={reviewDate}
                            className="vc-font-change"
                            onChange={(e) => setReviewDate(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="vc-submit-btn vc-font-change" disabled={!isFormValid()}>
                        Submit
                    </button>
                </form>
                {error && <div className="vc-error">{error}</div>}
                {successMsg && <div className="vc-success">{successMsg}</div>}
            </div>
        </div>
    );
};

export default VersionControlPage;
