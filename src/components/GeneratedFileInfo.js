import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import "./GeneratedFileInfo.css";

const GeneratedFileInfo = () => {
    const [files, setFiles] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState("");

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
            setUserID(decodedToken.userId);

            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/FrontendDMS/403");
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (token && role) {
            fetchFiles();
        }
    }, [token, role]);

    // Fetch files from the API
    const fetchFiles = async () => {
        const route = `/api/fileGenDocs/${userID}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    // 'Authorization': `Bearer ${token}` // Uncomment and fill in the token if needed
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            const sortedFiles = data.files.sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));

            setFiles(sortedFiles);
        } catch (error) {
            setError(error.message);
        }
    };

    const downloadFile = async (fileId, fileName) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/download/${fileId}`, {
                method: 'GET',
                headers: {
                    //'Authorization': `Bearer ${token}`, // Uncomment if needed
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download the file');
            }

            // Confirm the response is a Blob
            const blob = await response.blob();

            // Create a URL and download the file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading the file. Please try again.');
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="gen-file-info-container">
            <div className="sidebar">
                <div className="sidebar-logo">
                    <img src="logo.webp" alt="Logo" className="logo-img" onClick={() => navigate('/FrontendDMS/home')} />
                </div>
                <div className="button-container">
                    <button className="text-format-log but-upload"
                        onClick={() => navigate("/FrontendDMS/documentCreate")}
                    >
                        Back
                    </button>
                </div>
            </div>

            <div className="main-box-gen-info">
                <div className="table-container-gen">
                    <table className="gen-table">
                        <thead className="gen-head">
                            <tr className="gen-tr">
                                <th className="doc-num-filter col gen-th">Nr</th>
                                <th className="col-name-filter col gen-th">File Name</th>
                                <th className="col-stat-filter col gen-th">Status</th>
                                <th className="col-stat-filter col gen-th">Review Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file, index) => (
                                <tr key={file._id} className={`file-info-row-height gen-tr`}>
                                    <td className="col gen-th">{index + 1}</td>
                                    <td className="col gen-th">{removeFileExtension(file.fileName)}</td>
                                    <td className="col gen-th">{file.status}</td>
                                    <td className="col gen-th">{formatDate(file.reviewDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default GeneratedFileInfo;