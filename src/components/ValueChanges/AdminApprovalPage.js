import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import "./AdminApprovalPage.css";

const AdminApprovalPage = () => {
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

    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/drafts/${userID}`);
            if (!response.ok) throw new Error("Failed to fetch drafts");
            const data = await response.json();
            setDrafts(data.drafts);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleApprove = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/${selectedDraft._id}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    comment, userID
                })
            });

            if (!response.ok) throw new Error("Failed to approve draft");

            setShowPopup(false);
            setComment("");
            fetchDrafts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDecline = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/${selectedDraft._id}/decline`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    comment, userID
                })
            });

            if (!response.ok) throw new Error("Failed to delete draft");

            setShowPopup(false);
            setComment("");
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

            case 'Mobile':
                return "Mobile Machine"
                break;

            case 'Equipment':
                return "Equipment";
                break;

            case 'Tool':
                return "Hand Tool"
                break;

            case 'PPE':
                return "PPE"
                break;

            case 'Definition':
                return "Term";
                break;

            case 'Material':
                return "Material";
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

            case 'ppe':
                return "PPE"
                break;

            case 'eqp':
                return "Equipment";
                break;

            case 'tool':
                return "Tool";
                break;

            case 'mat':
                return "Material";
                break;

            case 'machine':
                return "Machine";
                break;
        }
    };

    const updateExcelFile = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/test/update-excel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to update Excel file');
            }

            // Assuming the response is the Excel file in binary format
            const blob = await response.blob();

            // Create a temporary link to download the file
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'updated_data.xlsx'; // You can modify this name if needed
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error updating Excel file:', error);
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
        <div className="admin-draft-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
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

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPopup && (
                <div className="popup-overlay-admin-approve">
                    <div className="popup-container-admin-approve">
                        <h3>Approve or Decline</h3>
                        <p>Do you want to approve or decline this draft?</p>
                        <textarea
                            className="popup-comment-textbox"
                            placeholder="Insert your comment..."
                            value={comment || ""}
                            onChange={(e) => setComment(e.target.value)}
                            rows="4"
                            style={{ resize: 'none' }} // Disable resizing of the textarea
                        />
                        <div className="popup-actions-admin-approve">
                            <button onClick={handleApprove} className="approve-btn-admin-approve">
                                <FontAwesomeIcon icon={faCheck} title="Approve" /> Approve
                            </button>
                            <button onClick={handleDecline} className="decline-btn-admin-approve">
                                <FontAwesomeIcon icon={faTimes} title="Decline" /> Decline
                            </button>
                            <button onClick={() => { setShowPopup(false); setComment(""); }} className="cancel-btn-admin-approve">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApprovalPage;
