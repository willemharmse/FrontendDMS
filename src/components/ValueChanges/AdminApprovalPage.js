import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./AdminApprovalPage.css";

const AdminApprovalPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [userID, setUserID] = useState('');
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
                navigate("/FrontendDMS/403");
            }
        }
        fetchDrafts();
    }, [navigate]);

    const fetchDrafts = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/drafts`);
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
                headers: { "Content-Type": "application/json" },
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
                headers: { "Content-Type": "application/json" },
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
            <div className="sidebar">
                <div className="sidebar-logo">
                    <img src={`${process.env.PUBLIC_URL}/logo.webp`} alt="Logo" className="logo-img" onClick={() => navigate('/FrontendDMS/home')} />
                </div>
                <div className="button-container">
                    <button className="text-format-log but-upload" onClick={() => navigate("/FrontendDMS/documentCreate")}>
                        Back
                    </button>
                </div>
            </div>

            <div className="main-box-admin-info">
                <div className="table-container-admin-approve">
                    <table className="admin-approve-table">
                        <thead className="admin-approve-head">
                            <tr className="admin-approve-tr">
                                <th className="doc-num-filter col admin-approve-th">Nr</th>
                                <th className="col-name-filter col admin-approve-th">Type</th>
                                <th className="col-stat-filter col admin-approve-th">Item</th>
                                <th className="col-stat-filter col admin-approve-th">Description</th>
                                <th className="col-stat-filter col admin-approve-th">Suggested By</th>
                                <th className="col-stat-filter col admin-approve-th">Suggested Date</th>
                                <th className="col-stat-filter col admin-approve-th">Status</th>
                                <th className="col-stat-filter col admin-approve-th">Review Date</th>
                                <th className="col-stat-filter col admin-approve-th">Reviewer</th>
                                <th className="col-stat-filter col admin-approve-th">Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.map((draft, index) => (
                                <tr key={draft._id} onClick={() => handleRowClick(draft)} className={`file-info-row-height admin-approve-tr`}>
                                    <td className="admin-approve-th-index">{index + 1}</td>
                                    <td className="col admin-approve-th-type">{formatType(draft.type)}</td>
                                    <td className="col admin-approve-th-item">{Object.values(draft.data)[0]}</td>
                                    <td className="col admin-approve-th-desc">
                                        {Object.values(draft.data)[1] ? Object.values(draft.data)[1] : "No description"}
                                    </td>
                                    <td className="admin-approve-th-user">{draft.suggestedBy ? draft.suggestedBy.username : "Unknown"}</td>
                                    <td className="admin-approve-th-date">{formatDate(draft.suggestedDate)}</td>
                                    <td className="admin-approve-th-status">{draft.status}</td>
                                    <td className="admin-approve-th-date">{draft.reviewDate ? formatDate(draft.reviewDate) : "N/A"}</td>
                                    <td className="admin-approve-th-user">{draft.reviewer ? draft.reviewer : "N/A"}</td>
                                    <td className="admin-approve-th-comment">{draft.comment ? draft.comment : "N/A"}</td>
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
                            placeholder="Enter your comment..."
                            value={comment || ""}
                            onChange={(e) => setComment(e.target.value)}
                            rows="4"
                            style={{ resize: 'none' }} // Disable resizing of the textarea
                        />
                        <div className="popup-actions-admin-approve">
                            <button onClick={handleApprove} className="approve-btn-admin-approve">
                                <FontAwesomeIcon icon={faCheck} /> Approve
                            </button>
                            <button onClick={handleDecline} className="decline-btn-admin-approve">
                                <FontAwesomeIcon icon={faTimes} /> Decline
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
