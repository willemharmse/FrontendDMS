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
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);

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

    const handleApprove = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error("Failed to approve draft");
            setDrafts(drafts.filter(draft => draft._id !== id)); // Remove approved draft from UI
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDecline = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/${id}/decline`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Failed to delete draft");
            setDrafts(drafts.filter(draft => draft._id !== id)); // Remove declined draft from UI
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
                return "Definition";
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

    return (
        <div className="admin-draft-info-container">
            <div className="sidebar">
                <div className="sidebar-logo">
                    <img src="logo.webp" alt="Logo" className="logo-img" onClick={() => navigate('/FrontendDMS/home')} />
                </div>
                <div className="button-container">
                    <button className="text-format-log but-upload" onClick={() => navigate("/FrontendDMS/documentCreate")}>
                        Back
                    </button>
                </div>
            </div>

            <div className="main-box-admin-info">
                {error && <div className="error-message">{error}</div>}
                <h2 className="admin-title">Pending Approval</h2>
                <div className="draft-list-admin">
                    {drafts.length === 0 ? (
                        <p className="no-drafts">No drafts available</p>
                    ) : (
                        drafts.map((draft) => (
                            <div key={draft._id} className="draft-card">
                                <h3 className="cent-admin-draft">{formatType(draft.type)}</h3>
                                <div className="draft-details">
                                    {Object.entries(draft.data).map(([key, value]) => (
                                        <p key={key}>
                                            <strong>{formatKey(key)}:</strong> {Array.isArray(value) ? value.join(", ") : value}
                                        </p>
                                    ))}
                                </div>
                                <div className="draft-actions">
                                    <button className="approve-btn" onClick={() => handleApprove(draft._id)}>
                                        <FontAwesomeIcon icon={faCheck} /> Approve
                                    </button>
                                    <button className="decline-btn" onClick={() => handleDecline(draft._id)}>
                                        <FontAwesomeIcon icon={faTimes} /> Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminApprovalPage;
