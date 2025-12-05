import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faEdit, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import BurgerMenuFI from "../../FileInfo/BurgerMenuFI";
import "./RiskSIPage.css";
import UpdateAbbreviation from "./UpdateAbbreviation";
import UpdateTerm from './UpdateTerm';
import ApprovalPopupAbbreviation from "../../SuggestionApprovalPopups/ApprovalPopupAbbreviation";
import AdminApprovalHeader from "../../AdminAprovalHeaders/AdminApprovalHeader";
import TopBar from "../../Notifications/TopBar";
import ApprovalPopupTerm from "../../SuggestionApprovalPopups/ApprovalPopupTerm";
import ApprovalPopupEquipment from "../../SuggestionApprovalPopups/ApprovalPopupEquipment";
import ApprovalPopupPPE from "../../SuggestionApprovalPopups/ApprovalPopupPPE";
import ApprovalPopupTool from "../../SuggestionApprovalPopups/ApprovalPopupTool";
import ApprovalPopupMaterial from "../../SuggestionApprovalPopups/ApprovalPopupMaterial";
import ApprovalPopupMachine from "../../SuggestionApprovalPopups/ApprovalPopupMachine";

const RiskSIPage = () => {
    const [drafts, setDrafts] = useState([]);
    const { id: draftID } = useParams();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [userID, setUserID] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [comment, setComment] = useState("");
    const [showAbbreviationPopup, setShowAbbreviationPopup] = useState(false);
    const [showTermPopup, setShowTermPopup] = useState(false);
    const [selectedData, setSelectedData] = useState("");
    const [profilePic, setProfilePic] = useState(null);

    const [statusTab, setStatusTab] = useState("In Review");

    // Normalize a status string (case/spacing/punctuation tolerant)
    const norm = (s = "") => s.toString().toLowerCase().replace(/[\s_-]+/g, "");

    // Buckets for tolerant matching
    const isReviewLike = (s) => ["review", "inreview", "pending", "awaitingreview"].includes(norm(s));
    const isApprovedLike = (s) => ["approved", "accept", "accepted", "ok", "passed"].includes(norm(s));
    const isDeclinedLike = (s) => ["declined", "rejected", "reject", "denied", "failed"].includes(norm(s));

    // Does a draft fall into the currently selected tab?
    const tabMatches = (draft) => {
        const st = draft?.status ?? "";
        if (norm(statusTab) === "all") return true;
        if (norm(statusTab) === "inreview") return isReviewLike(st);
        if (norm(statusTab) === "approved") return isApprovedLike(st);
        if (norm(statusTab) === "declined") return isDeclinedLike(st);
        return true;
    };

    useEffect(() => {
        // Load from sessionStorage on mount
        const cached = sessionStorage.getItem('profilePic');
        setProfilePic(cached || null);
    }, []);

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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/drafts/${userID}`);
            if (!response.ok) throw new Error("Failed to fetch drafts");
            const data = await response.json();
            setDrafts(data.drafts);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleApprove = async (draft) => {
        const data = draft.data;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/${draft._id}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userID,
                    data
                })
            });

            if (!response.ok) throw new Error("Failed to approve draft");

            setShowPopup(false);
            fetchDrafts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDecline = async (draft) => {
        const data = draft.data;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/${draft._id}/decline`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userID,
                    data
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

        return rows
            .filter(tabMatches)
            .filter((r) => {
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
    // When drafts are loaded, use the URL id to select/open a draft
    useEffect(() => {
        // no id in URL -> do nothing
        if (!draftID) return;

        // if the id is literally "new", just return (do nothing)
        if (draftID === "new") return;

        // wait until drafts are loaded
        if (!drafts || drafts.length === 0) return;

        // find the draft with this id
        const draft = drafts.find(d => d._id === draftID);
        if (!draft) return; // id doesn't match any draft -> do nothing

        // only open if it's in Review (same rule as handleRowClick)
        if (draft.status !== "Review") return;

        setSelectedDraft(draft);
        setShowPopup(true);
    }, [draftID, drafts]);

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

                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="admin-approval-pill-bar">
                    {["In Review", "Approved", "Declined", "All"].map((pill) => (
                        <div
                            key={pill}
                            className={`admin-approval-pill ${statusTab === pill ? "active" : ""}`}
                            onClick={() => setStatusTab(pill)}
                        >
                            {pill}
                        </div>
                    ))}
                </div>
                <div className="admin-approve-table-area">
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
                                    {false &&
                                        (<td className="risk-admin-approve-th-action"
                                            style={{ paddingTop: "1px", paddingBottom: "1px", height: "13px" }}>
                                            <button
                                                className="edit-row-button"
                                                onClick={() => {
                                                    if (draft.status !== "Review") return;
                                                    openPopup(draft);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} title="Remove Row" />
                                            </button></td>)
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(showPopup && selectedDraft.type === "Abbreviation") && (<ApprovalPopupAbbreviation approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Definition") && (<ApprovalPopupTerm approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "PPE") && (<ApprovalPopupPPE approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Tool") && (<ApprovalPopupTool approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Material") && (<ApprovalPopupMaterial approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Mobile") && (<ApprovalPopupMachine approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {(showPopup && selectedDraft.type === "Equipment") && (<ApprovalPopupEquipment approve={handleApprove} decline={handleDecline} setSuggestion={setSelectedDraft} closeModal={() => setShowPopup(false)} suggestion={selectedDraft} />)}
            {showAbbreviationPopup && (<UpdateAbbreviation data={selectedData} onClose={closePopup} />)}
            {showTermPopup && (<UpdateTerm data={selectedData} onClose={closePopup} />)}
        </div>
    );
};

export default RiskSIPage;
