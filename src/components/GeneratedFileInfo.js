import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    const clearSearch = () => {
        setSearchQuery("");
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

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file//generated/download/${fileId}`, {
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

    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery = (
            file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return matchesSearchQuery;
    });

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="gen-file-info-container">
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src="CH_Logo.png" alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} />
                    <p className="logo-text-um">Generated Files</p>
                </div>
            </div>

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className={`info-box-fih`}>Number of Documents: {filteredFiles.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container">
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} />
                        </div>
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faBell} />
                        </div>
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} />
                        </div>
                        {isMenuOpen && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
                    </div>
                </div>
                <div className="table-container-gen">
                    <table className="gen-table">
                        <thead className="gen-head">
                            <tr>
                                <th className="gen-th">Nr</th>
                                <th className="gen-th">File Name</th>
                                <th className="gen-th">Status</th>
                                <th className="gen-th">Review Date</th>
                                <th className="gen-th">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file, index) => (
                                <tr key={file._id} className={`file-info-row-height gen-tr`}>
                                    <td className="gen-nr gen-point" onClick={() => navigate(`/FrontendDMS/review/${file._id}`)}>{index + 1}</td>
                                    <td className="gen-fn  gen-point" onClick={() => navigate(`/FrontendDMS/review/${file._id}`)} >{removeFileExtension(file.fileName)}</td>
                                    <td className="gen-stat  gen-point" onClick={() => navigate(`/FrontendDMS/review/${file._id}`)}>{file.status}</td>
                                    <td className="gen-rev  gen-point" onClick={() => navigate(`/FrontendDMS/review/${file._id}`)}>{formatDate(file.reviewDate)}</td>
                                    <th className="gen-th"><FontAwesomeIcon icon={faDownload} className=" gen-point" onClick={() => downloadFile(file._id, file.fileName)} /></th>
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