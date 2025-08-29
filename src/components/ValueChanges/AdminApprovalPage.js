import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import "./AdminApprovalPage.css";
import ApprovalPopup from "../RiskRelated/RiskValueChanges/ApprovalPopup";
import AdminApprovalHeader from "../AdminAprovalHeaders/AdminApprovalHeader";

const AdminApprovalPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [userID, setUserID] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [comment, setComment] = useState("");
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        // Load from sessionStorage on mount
        const cached = sessionStorage.getItem('profilePic');
        setProfilePic(cached || null);
    }, []);

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
            setUserID(decodedToken.userId);
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

    const [filters, setFilters] = useState({
        type: "",
        item: "",
        description: "",
        suggestedBy: "",
        status: "",
        suggestedFrom: "",
        suggestedTo: "",
        reviewFrom: "",
        reviewTo: "",
    });

    const onFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    // helpers that match how you render the table
    const getTypeText = (r) => (formatType(r.type) || "").toString();
    const getItemText = (r) => {
        const first = Object.values(r?.data || {})[0];
        return (first ?? "").toString();
    };
    const getDescText = (r) => {
        const second = Object.values(r?.data || {})[1];
        return (second ?? "").toString();
    };
    const getSuggestedByText = (r) => (r?.suggestedBy?.username || "").toString();
    const getStatusText = (r) => (r?.status || "").toString();

    const toISODate = (d) => {
        if (!d) return "";
        const dt = typeof d === "string" ? new Date(d) : d;
        if (Number.isNaN(dt.getTime())) return "";
        return dt.toISOString().slice(0, 10); // yyyy-mm-dd
    };

    const applyFilters = (rows) => {
        const hasSuggested = Boolean(filters.suggestedFrom || filters.suggestedTo);
        const hasReview = Boolean(filters.reviewFrom || filters.reviewTo);

        const inRange = (iso, from, to) => {
            if (!iso) return false;              // empty dates never match when a date filter is active
            if (from && iso < from) return false;
            if (to && iso > to) return false;
            return true;
        };

        return rows.filter((r) => {
            // text filters (case-insensitive "contains")
            if (filters.type && !getTypeText(r).toLowerCase().includes(filters.type.toLowerCase())) return false;
            if (filters.item && !getItemText(r).toLowerCase().includes(filters.item.toLowerCase())) return false;
            if (filters.description && !getDescText(r).toLowerCase().includes(filters.description.toLowerCase())) return false;
            if (filters.suggestedBy && !getSuggestedByText(r).toLowerCase().includes(filters.suggestedBy.toLowerCase())) return false;
            if (filters.status && !getStatusText(r).toLowerCase().includes(filters.status.toLowerCase())) return false;

            // dates (normalize to yyyy-mm-dd so string compare works)
            if (hasSuggested) {
                const suggestedISO = toISODate(r.suggestedDate);
                if (!inRange(suggestedISO, filters.suggestedFrom, filters.suggestedTo)) return false;
            }

            // Review Date: if filtering, exclude N/A (empty) and only keep rows in range
            if (hasReview) {
                const reviewISO = toISODate(r.reviewDate); // "" when N/A
                if (!inRange(reviewISO, filters.reviewFrom, filters.reviewTo)) return false;
            }

            return true;
        });
    };

    const filteredFiles = applyFilters(drafts);

    const getComplianceColor = (status) => {
        if (status.toLowerCase() === "approved") return "status-good-admin";
        if (status.toLowerCase() === "declined") return "status-bad-admin";
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
                        <div className="burger-menu-icon-um" onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" style={{ cursor: "pointer" }}>
                            {profilePic ? (
                                <img
                                    src={profilePic}
                                    alt="Profile"
                                    style={{
                                        width: "28px",          // match icon size
                                        height: "28px",
                                        borderRadius: "50%",    // circle
                                        objectFit: "cover",
                                        display: "block"
                                    }}
                                />
                            ) : (
                                <FontAwesomeIcon icon={faCircleUser} />
                            )}
                        </div>
                        {isMenuOpen && (<BurgerMenuFI isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
                    </div>
                </div>
                <div className="table-container-gen">
                    <table className="risk-admin-approve-table">
                        <thead className="risk-admin-approve-head">
                            <AdminApprovalHeader filters={filters} onFilterChange={onFilterChange} />
                        </thead>
                        <tbody>
                            {filteredFiles.map((draft, index) => (
                                <tr key={draft._id} className={`file-info-row-height risk-admin-approve-tr`}>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-index">{index + 1}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-type">{formatType(draft.type)}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-item">{Object.values(draft.data)[0]}</td>
                                    <td onClick={() => handleRowClick(draft)} className="col risk-admin-approve-th-desc">
                                        {Object.values(draft.data)[1] ? Object.values(draft.data)[1] : "No description"}
                                    </td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-user">{draft.suggestedBy ? draft.suggestedBy.username : "Unknown"}</td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-date">{formatDate(draft.suggestedDate)}</td>
                                    <td onClick={() => handleRowClick(draft)} className={`risk-admin-approve-th-status ${getComplianceColor(draft.status)}`}>{draft.status}</td>
                                    <td onClick={() => handleRowClick(draft)} className="risk-admin-approve-th-date">{draft.reviewDate ? formatDate(draft.reviewDate) : "N/A"}</td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPopup && (<ApprovalPopup approve={handleApprove} decline={handleDecline} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
        </div>
    );
};

export default AdminApprovalPage;
