import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faDownload, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../../FileInfo/BurgerMenuFI";
import DownloadPopup from "../../FileInfo/DownloadPopup";
import { jwtDecode } from 'jwt-decode';

const VersionHistoryInductions = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const { id } = useParams();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [versions, setVersions] = useState([]);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        fetchActivity();
    }, []);

    // Fetch files from the API
    const fetchActivity = async () => {
        const route = `/api/visitorDrafts/getHistory/${id}`;
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
            const storedData = data;
            console.log(storedData);

            setVersions(storedData);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="dc-version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={"/tmsCreateCourse2.svg"} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Visitor Induction"}</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}
            <div className="main-box-dc-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container">
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" />
                        </div>
                        {isMenuOpen && (<BurgerMenuFI isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
                    </div>
                </div>
                <div className="table-containerdc-version-history-file-info">
                    <table className="dc-version-history-file-info-table">
                        <thead className="dc-version-history-file-info-head">
                            <tr>
                                <th className="dc-version-history-file-th">Nr</th>
                                <th className="dc-version-history-file-th">Name</th>
                                <th className="dc-version-history-file-th">Version</th>
                            </tr>
                        </thead>
                        <tbody>
                            {versions.length > 0 ? (
                                versions.map((ver, index) => (
                                    <tr key={index} className={`file-info-row-height dc-version-history-file-info-tr`}>
                                        <td className="dc-version-history-file-nr">{index + 1}</td>
                                        <td className="dc-version-history-file-fn">{ver.title}</td>
                                        <td className="dc-version-history-file-ver">V{ver.version}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">No Version History</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default VersionHistoryInductions;