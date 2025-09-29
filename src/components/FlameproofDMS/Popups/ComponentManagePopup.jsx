import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { faTrash, faX, faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import RenameSite from "./RenameSite";
import DeleteSitePopup from "./DeleteSitePopup";
import "./ComponentManagePopup.css"
import AddComponent from "./AddComponent";

const ComponentManagePopup = ({ closePopup, assetType }) => {
    const [components, setComponents] = useState(assetType?.components || []);
    const [addComponent, setAddComponents] = useState(false);

    const openAdd = () => {
        setAddComponents(true);
    }

    const closeAdd = () => {
        setAddComponents(false);
    }

    const handleRemove = (idx) => {
        const item = components[idx];
        const name = typeof item === 'string' ? item : item?.name;

        if (String(name || '').trim().toLowerCase() === 'master') {
            toast.error("You can't remove the 'Master' component.", {
                autoClose: 900, style: { textAlign: 'center' }
            });
            return;
        }

        setComponents(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        // allow strings or {name} objects
        const names = (components || [])
            .map(c => (typeof c === 'string' ? c : c?.name))
            .map(s => String(s || '').trim())
            .filter(Boolean);

        // case-insensitive dedupe
        const seen = new Set();
        const unique = [];
        for (const n of names) {
            const k = n.toLowerCase();
            if (!seen.has(k)) { seen.add(k); unique.push(n); }
        }

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/asset-types/${assetType._id}/components`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ components: unique }),
                }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to save');

            toast.success('Asset Type updated', { autoClose: 800, style: { textAlign: 'center' } });
            closePopup();
        } catch (err) {
            toast.error(err.message || 'Failed to save', { autoClose: 1200, style: { textAlign: 'center' } });
        }
    };

    return (
        <div className="popup-overlay-component-page">
            <div className="popup-content-component-page">
                <div className="review-date-header">
                    <h2 className="review-date-title">{assetType.type} Management</h2>
                    <button className="review-date-close" onClick={closePopup} title="Close Popup">×</button>
                </div>

                <div className="component-page-table-group">
                    <label className="component-page-label">Required Components</label>
                    <div className="component-page-popup-table-wrapper">
                        <table className="popup-table font-fam">
                            <thead className="component-page-headers">
                                <tr>
                                    <th className="components-types-name">Component</th>
                                    <th className="components-types-delete">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {components.length > 0 ? (
                                    components.map((component, idx) => (
                                        <tr key={component._id} style={{ cursor: "pointer" }}>
                                            <td>{component.name || '(unnamed site)'}</td>
                                            <td className="comp-act-icon-delete">
                                                {component.name !== "Master" && (<FontAwesomeIcon
                                                    icon={faTrash}
                                                    onClick={() => handleRemove(idx)}
                                                    title="Remove Component"
                                                    style={{ marginLeft: '10px' }}
                                                />)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No sites found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="add-row-button-conmponent-page" onClick={openAdd}>
                        Add Component
                    </button>
                </div>

                <div className="component-page-footer">
                    <button className="add-row-button-conmponent-page" onClick={handleSubmit}>
                        Submit
                    </button>
                </div>
            </div>

            {addComponent && (<AddComponent components={components} isOpen={addComponent} onClose={closeAdd} setComponents={setComponents} />)}
        </div>
    );
};

export default ComponentManagePopup;
