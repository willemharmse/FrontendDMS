import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faEraser, faTimes, faDownload } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { saveAs } from "file-saver";
import TopBar from "../Notifications/TopBar";
import "./ControlAttributes.css";

const ControlAttributes = () => {
    const [controls, setControls] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [filteredControls, setFilteredControls] = useState([]);
    const [searchPopupVisible, setSearchPopupVisible] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);

            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/FrontendDMS/403");
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchControls();
    }, []);

    const handleDownload = async () => {
        const dataToStore = controls;

        const documentName = `Site-Controls-Output Register`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/generateExcels/generate-xlsx-siteControls`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.xlsx`);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
        }
    };

    // Fetch files from the API
    const fetchControls = async () => {
        const route = `/api/riskInfo/controls`;
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

            setControls(data.controls);
            setFilteredControls(data.controls);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSearchClick = () => setSearchPopupVisible(prev => !prev);

    const handleCloseSearch = () => {
        setSearchPopupVisible(false)
        setSearchInput("");
        setFilteredControls(controls);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        const filtered = controls.filter(c =>
            c.control.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredControls(filtered);
    };

    return (
        <div className="risk-control-attributes-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Site Controls</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-floating-toggle" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                    <FontAwesomeIcon icon={faChevronRight} />
                </div>
            )}

            <div className="main-box-risk-control-attributes">
                <div className="top-section-um">
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>
                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper">
                        <label className="risk-control-label">Site Controls and Attributes</label>
                        <FontAwesomeIcon icon={faSearch} title="Search" className="top-right-button-control-att" onClick={handleSearchClick} />
                        <FontAwesomeIcon icon={faDownload} title="Download Excel" className="top-right-button-control-att-2" onClick={handleDownload} />
                        {searchPopupVisible && (
                            <div className="search-popup-rca">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    placeholder="Search control name..."
                                    className="search-popup-input-rca"
                                />
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    className="search-popup-close-rca"
                                    onClick={handleCloseSearch}
                                />
                            </div>
                        )}
                    </div>
                    <div className="table-scroll-wrapper-attributes-controls">
                        <table className={`${isSidebarVisible ? `risk-control-attributes-table` : `risk-control-attributes-table-ws`}`}>
                            <thead className="risk-control-attributes-head">
                                <tr>
                                    <th colSpan={5} className="risk-control-attributes-split">Control Identification</th>
                                    <th colSpan={5} className="risk-control-attributes-th">Control Effectiveness Rating (CER)</th>
                                </tr>
                                <tr>
                                    <th className="risk-control-attributes-nr">Nr</th>
                                    <th className="risk-control-attributes-control">Control</th>
                                    <th className="risk-control-attributes-description">Control Description</th>
                                    <th className="risk-control-attributes-perf">Performance Requirements & Verification</th>
                                    <th className="risk-control-attributes-critcal">Critical Control</th>
                                    <th className="risk-control-attributes-act">Act, Object or System</th>
                                    <th className="risk-control-attributes-activation">Control Activation (Pre or Post Unwanted Event)</th>
                                    <th className="risk-control-attributes-hiearchy">Hierarchy of Controls</th>
                                    <th className="risk-control-attributes-quality">Control Quality</th>
                                    <th className="risk-control-attributes-cons">Specific Consequence Addressed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredControls.map((row, index) => (
                                    <tr key={index}>
                                        <td className="procCent" style={{ fontSize: "14px" }}>{index + 1}</td>
                                        <td style={{ fontSize: "14px" }}>{row.control}</td>
                                        <td style={{ fontSize: "14px" }}>{row.description}</td>
                                        <td style={{ fontSize: "14px" }}>{row.performance}</td>
                                        <td className={`${row.critical === "Yes" ? 'procCent cea-table-page-critical' : 'procCent'}`} style={{ fontSize: "14px" }}>{row.critical}</td>
                                        <td className="procCent" style={{ fontSize: "14px" }}>{row.act}</td>
                                        <td className="" style={{ fontSize: "14px" }}>{row.activation}</td>
                                        <td className="" style={{ fontSize: "14px" }}>{row.hierarchy}</td>
                                        <td className="" style={{ fontSize: "14px" }}>{row.quality}</td>
                                        <td className="" style={{ fontSize: "14px" }}>{row.cons}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ControlAttributes;