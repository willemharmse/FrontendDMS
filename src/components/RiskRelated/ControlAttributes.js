import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
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
        } catch (error) {
            setError(error.message);
        }
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
                        <p className="logo-text-um">Risk Management</p>
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
                        <label className="risk-control-label">Control Attributes</label>
                        <FontAwesomeIcon icon={faSearch} title="Search" className="risk-control-label-icon" />
                    </div>
                    <div className="table-scroll-wrapper">
                        <table className="risk-control-attributes-table">
                            <thead className="risk-control-attributes-head">
                                <tr>
                                    <th colSpan={3} className="risk-control-attributes-split">Control Identification</th>
                                    <th colSpan={4} className="risk-control-attributes-th">Control Effectiveness Rating (CER)</th>
                                </tr>
                                <tr>
                                    <th className="risk-control-attributes-nr">Nr</th>
                                    <th className="risk-control-attributes-control">Control</th>
                                    <th className="risk-control-attributes-critcal">Critical Control</th>
                                    <th className="risk-control-attributes-act">Act, Object or System</th>
                                    <th className="risk-control-attributes-activation">Control Activation (Pre or Post Unwanted Event)</th>
                                    <th className="risk-control-attributes-hiearchy">Hierarchy of Controls</th>
                                    <th className="risk-control-attributes-cons">Specific Consequence Addressed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="procCent">1</td>
                                    <td>Control 1</td>
                                    <td className="procCent" style={{ borderRight: '1px solid white' }}>Yes</td>
                                    <td className="procCent">Act</td>
                                    <td>Prevention Control</td>
                                    <td>1. Elimination</td>
                                    <td>Safety</td>
                                </tr>
                                <tr>
                                    <td className="procCent">2</td>
                                    <td>Control 2</td>
                                    <td className="procCent" style={{ borderRight: '1px solid white' }}>No</td>
                                    <td className="procCent">Object</td>
                                    <td>Consequence Minimizing Control</td>
                                    <td>2. Substitution</td>
                                    <td>Health</td>
                                </tr>
                                <tr>
                                    <td className="procCent">3</td>
                                    <td>Control 3</td>
                                    <td className="procCent" style={{ borderRight: '1px solid white' }}></td>
                                    <td className="procCent"></td>
                                    <td>Both</td>
                                    <td>3. Engineering</td>
                                    <td>Enviroment</td>
                                </tr>
                                <tr>
                                    <td className="procCent">4</td>
                                    <td></td>
                                    <td className="procCent" style={{ borderRight: '1px solid white' }}></td>
                                    <td className="procCent"></td>
                                    <td></td>
                                    <td>4. Separation</td>
                                    <td>Community</td>
                                </tr>
                                <tr>
                                    <td className="procCent">5</td>
                                    <td></td>
                                    <td className="procCent" style={{ borderRight: '1px solid white' }}></td>
                                    <td className="procCent"></td>
                                    <td></td>
                                    <td>5. Administration</td>
                                    <td>Legal & Regulatory</td>
                                </tr>
                                <tr>
                                    <td className="procCent">6</td>
                                    <td></td>
                                    <td className="procCent" style={{ borderRight: '1px solid white' }}></td>
                                    <td className="procCent"></td>
                                    <td></td>
                                    <td>6. PPE</td>
                                    <td>Material Losses</td>
                                </tr>
                                <tr>
                                    <td className="procCent">7</td>
                                    <td></td>
                                    <td className="procCent" style={{ borderRight: '1px solid white' }}></td>
                                    <td className="procCent"></td>
                                    <td></td>
                                    <td></td>
                                    <td>Reputation</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ControlAttributes;