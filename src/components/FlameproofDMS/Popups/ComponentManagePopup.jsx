import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import "./ComponentManagePopup.css";
import AddComponent from "./AddComponent";
import ModifyComponentName from "./ModifyComponentName";

const ComponentManagePopup = ({ closePopup, assetType }) => {
    const normalize = (list) =>
        (Array.isArray(list) ? list : []).map(c =>
            typeof c === 'string'
                ? { name: c, mandatory: true }
                : { name: String(c?.name || ''), mandatory: Boolean(c?.mandatory) }
        );

    const [components, setComponents] = useState(normalize(assetType?.components));
    const [addComponent, setAddComponents] = useState(false);
    const [edit, setEdit] = useState(false);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        setComponents(normalize(assetType?.components));
    }, [assetType]);

    const openAdd = () => setAddComponents(true);
    const closeAdd = () => setAddComponents(false);

    const openEdit = (name) => { setEditName(name); setEdit(true); };
    const closeEdit = () => setEdit(false);

    const handleToggleMandatory = (idx) => {
        setComponents(prev =>
            prev.map((c, i) => (i === idx ? { ...c, mandatory: !c.mandatory } : c))
        );
    };

    const handleRemove = (idx) => {
        const item = components[idx];
        if (String(item?.name || '').trim().toLowerCase() === 'master') {
            toast.error("You can't remove the 'Master' component.", {
                autoClose: 900, style: { textAlign: 'center' }
            });
            return;
        }
        setComponents(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        // trim + dedupe by name (case-insensitive), preserve first-seen mandatory
        const byKey = new Map();
        for (const c of components) {
            const name = String(c?.name || '').trim();
            if (!name) continue;
            const key = name.toLowerCase();
            if (!byKey.has(key)) byKey.set(key, { name, mandatory: Boolean(c?.mandatory) });
        }
        const payload = Array.from(byKey.values());

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/asset-types/${assetType._id}/components`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ components: payload }), // <-- send {name, mandatory}
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
                    <h2 className="review-date-title">Standard Asset Management</h2>
                    <button className="review-date-close" onClick={closePopup} title="Close Popup">×</button>
                </div>

                <div className="component-page-table-group">
                    <label className="component-page-label">Required Components</label>
                    <div className="component-page-popup-table-wrapper">
                        <table className="popup-table font-fam">
                            <thead className="component-page-headers">
                                <tr>
                                    <th className="components-types-name" style={{ width: "40%" }}>Component</th>
                                    <th className="components-types-name" style={{ width: "45%" }}>Mandatory</th>
                                    <th className="components-types-delete" style={{ width: "15%" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {components.length > 0 ? (
                                    components.map((component, idx) => (
                                        <tr key={component._id || `${component.name}-${idx}`} style={{ cursor: "pointer" }}>
                                            <td>{component.name || '(unnamed component)'}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {/* no styling as requested */}
                                                {component.name !== "Master" && (<input
                                                    className="checkbox-inp-abbr"
                                                    type="checkbox"
                                                    checked={!!component.mandatory}
                                                    onChange={() => handleToggleMandatory(idx)}
                                                />)}
                                            </td>
                                            <td className="comp-act-icon-delete">
                                                {component.name !== "Master" && (
                                                    <FontAwesomeIcon
                                                        icon={faEdit}
                                                        onClick={() => openEdit(component.name)}
                                                        title="Modify Component"
                                                        style={{ marginLeft: '10px' }}
                                                    />
                                                )}
                                                {component.name !== "Master" && (
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                        onClick={() => handleRemove(idx)}
                                                        title="Remove Component"
                                                        style={{ marginLeft: '10px' }}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No components found.</td>
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

            {addComponent && (
                <AddComponent
                    components={components}
                    isOpen={addComponent}
                    onClose={closeAdd}
                    setComponents={setComponents}
                />
            )}

            {edit && (
                <ModifyComponentName
                    components={components}
                    isOpen={edit}
                    onClose={closeEdit}
                    originalName={editName}
                    setComponents={setComponents}
                />
            )}
        </div>
    );
};

export default ComponentManagePopup;
