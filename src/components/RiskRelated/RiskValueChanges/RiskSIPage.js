import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faEdit, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import BurgerMenuFI from "../../FileInfo/BurgerMenuFI";
import "./RiskSIPage.css";
import UpdateAbbreviation from "./UpdateAbbreviation";
import UpdateTerm from './UpdateTerm';

const RiskSIPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [userID, setUserID] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [comment, setComment] = useState("");
    const [showAbbreviationPopup, setShowAbbreviationPopup] = useState(false);
    const [showTermPopup, setShowTermPopup] = useState(false);
    const [selectedData, setSelectedData] = useState("");

    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    const openPopup = (draft) => {
        if (draft.type === "Abbreviation") {
            setSelectedData(draft);
            setShowAbbreviationPopup(true);
        }
        else if (draft.type === "Definition") {
            setSelectedData(draft);
            setShowTermPopup(true);
        }
        else if (draft.type === "Mobile") {
            setSelectedData(draft);
            //setShowTermPopup(true);
        }
        else if (draft.type === "PPE") {
            setSelectedData(draft);
            //setShowTermPopup(true);
        }
        else if (draft.type === "Material") {
            setSelectedData(draft);
            //setShowTermPopup(true);
        }
        else if (draft.type === "Tool") {
            setSelectedData(draft);
            //setShowTermPopup(true);
        }
        else if (draft.type === "Equipment") {
            setSelectedData(draft);
            //setShowTermPopup(true);
        }
    };

    const closePopup = () => {
        setShowAbbreviationPopup(false);
        setShowTermPopup(false);

        fetchDrafts();
    }

    const handleRowClick = (draft) => {
        if (draft.status !== "Review") return;
        setSelectedDraft(draft); // Store the clicked draft in state
        setShowPopup(true); // Show the popup
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
            setUserID(decodedToken.userId);

            if (!adminRoles.includes(decodedToken.role)) {
                navigate("/403");
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (userID) {
            fetchDrafts();
        }
    }, [userID]);

    const fetchDrafts = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/drafts/${userID}`);
            if (!response.ok) throw new Error("Failed to fetch drafts");
            const data = await response.json();
            setDrafts(data.drafts);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleApprove = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/${selectedDraft._id}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userID
                })
            });

            if (!response.ok) throw new Error("Failed to approve draft");

            setShowPopup(false);
            fetchDrafts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDecline = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/${selectedDraft._id}/decline`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userID
                })
            });

            if (!response.ok) throw new Error("Failed to delete draft");

            setShowPopup(false);
            fetchDrafts();
        } catch (err) {
            setError(err.message);
        }
    };

    const formatType = (type) => {
        switch (type) {
            case 'Abbreviation':
                return "Abbreviation"
                break;

            case 'Definition':
                return "Term";
                break;

            case 'PPE':
                return "PPE";
                break;

            case 'Tool':
                return "Hand Tool";
                break;

            case 'Material':
                return "Material";
                break;

            case 'Mobile':
                return "Mobile Machinery";
                break;

            case 'Equipment':
                return "Equipment";
                break;
        }
    };

    const formatKey = (type) => {
        switch (type) {
            case 'abbr':
                return "Abbreviation"
                break;

            case 'meaning':
                return "Description"
                break;

            case 'term':
                return "Term";
                break;

            case 'definition':
                return "Definition"
                break;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="risk-admin-draft-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src="CH_Logo.svg" alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">User Suggestions</p>
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
            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container">
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faBell} title="Notifications" />
                        </div>
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" />
                        </div>
                        {isMenuOpen && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
                    </div>
                </div>
                <div className="table-container-gen">
                    <table className="risk-admin-approve-table">
                        <thead className="risk-admin-approve-head">
                            <tr className="risk-admin-approve-tr">
                                <th className="doc-num-filter col risk-admin-approve-th">Nr</th>
                                <th className="col-name-filter col risk-admin-approve-th">Type</th>
                                <th className="col-stat-filter col risk-admin-approve-th">Item</th>
                                <th className="col-stat-filter col risk-admin-approve-th">Description</th>
                                <th className="col-stat-filter col risk-admin-approve-th">Suggested By</th>
                                <th className="col-stat-filter col risk-admin-approve-th">Suggested Date</th>
                                <th className="col-stat-filter col risk-admin-approve-th">Status</th>
                                <th className="col-stat-filter col risk-admin-approve-th">Review Date</th>
                                <th className="col-stat-filter col risk-admin-approve-th">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.map((draft, index) => (
                                <tr key={draft._id} className={`file-info-row-height risk-admin-approve-tr`}>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-index">{index + 1}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-type">{formatType(draft.type)}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-item">{Object.values(draft.data)[0]}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-desc">
                                        {Object.values(draft.data)[1] ? Object.values(draft.data)[1] : "No description"}
                                    </td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-user">{draft.suggestedBy ? draft.suggestedBy.username : "Unknown"}</td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-date">{formatDate(draft.suggestedDate)}</td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-status">{draft.status}</td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-date">{draft.reviewDate ? formatDate(draft.reviewDate) : "N/A"}</td>
                                    <td className="risk-admin-approve-th-action"
                                        style={{ paddingTop: "1px", paddingBottom: "1px", height: "13px" }}>
                                        <button
                                            className="edit-row-button"
                                            onClick={() => {
                                                if (draft.status !== "Review") return;
                                                openPopup(draft);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faEdit} title="Remove Row" />
                                        </button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPopup && (
                <div className="popup-overlay-risk-admin-approve">
                    <div className="popup-container-risk-admin-approve">
                        <h3>Approve or Decline</h3>
                        <p>Do you want to approve or decline this draft?</p>
                        <div className="popup-actions-risk-admin-approve">
                            <button onClick={handleApprove} className="approve-btn-risk-admin-approve">
                                <FontAwesomeIcon icon={faCheck} title="Approve" /> Approve
                            </button>
                            <button onClick={handleDecline} className="decline-btn-risk-admin-approve">
                                <FontAwesomeIcon icon={faTimes} title="Decline" /> Decline
                            </button>
                            <button onClick={() => { setShowPopup(false) }} className="cancel-btn-risk-admin-approve">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAbbreviationPopup && (<UpdateAbbreviation data={selectedData} onClose={closePopup} />)}
            {showTermPopup && (<UpdateTerm data={selectedData} onClose={closePopup} />)}
        </div>
    );
};

export default RiskSIPage;
