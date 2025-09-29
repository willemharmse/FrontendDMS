import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';

const emptyRow = () => ({
    name: '',
    surname: '',
    email: '',
    contactNumber: '',
    idPassport: '',
    company: ''
});

const GRID_COLS = '1fr 1fr 1.2fr 1fr 1.2fr 1fr 0.4fr'; // 7 columns incl. actions

const CreateBatchProfiles = ({ onClose, openExcel, refresh }) => {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([emptyRow()]); // start with 1 row
    const fileInputRef = useRef(null);

    const updateCell = (index, field, value) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const addRow = () => setRows(prev => [...prev, emptyRow()]);

    const deleteRow = (index) => {
        setRows(prev => {
            if (prev.length === 1) return prev; // must keep at least 1 row
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async () => {
        const invalid = rows.findIndex(r =>
            !r.name.trim() || !r.surname.trim() || !r.contactNumber.trim() || !r.idPassport.trim() || !r.company.trim()
        );
        if (invalid !== -1) {
            toast.error(`Row ${invalid + 1} is missing required fields.`);
            return;
        }

        setLoading(true);
        try {
            const base = process.env.REACT_APP_URL?.replace(/\/+$/, '') || '';
            const url = `${base}/api/visitors/batchCreateVisitors`;
            const token = localStorage.getItem('token');

            const res = await axios.post(url, { rows }, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json'
                }
            });

            toast.success(`Visitors imported successfully. Inserted: ${res?.data?.inserted ?? rows.length}`);
            refresh();
            onClose?.();
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;

            if (status === 400 && Array.isArray(data?.details)) {
                const text = data.details.join('\n');
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `visitor_batch_errors_${new Date().toISOString().slice(0, 10)}.txt`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);

                toast.error(data?.error || 'Some visitors failed to import. A text file with details has been downloaded.');
                return;
            }

            toast.error(data?.error || 'Failed to import visitors.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-visitor-profile-page-container">
            <div className="create-visitor-profile-page-overlay">
                <div className="create-visitor-profile-page-popup-right-batch">
                    <div className="create-visitor-profile-page-popup-header-right">
                        <h2>Create Visitor Group</h2>
                        <button className="review-date-close" onClick={onClose} title="Close">×</button>
                    </div>

                    {/* Body */}
                    <div className="cbp-body-wrapper">
                        <p className="cbp-hint">
                            <strong>To add multiple visitor profiles, you can choose one of the following two options:</strong><br />
                            • <strong>Import from Excel File:</strong> This will automatically populate the editable table below, where you can review and adjust the information before submitting.<br />
                            • <strong>Insert Manually:</strong> Skip the upload and enter the information directly into the table.
                        </p>

                        <div className="cbp-table-shell">
                            {/* Make header 7 columns */}
                            <div
                                className="cbp-table-header"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: GRID_COLS,
                                    gap: 8,
                                    alignItems: 'center'
                                }}
                            >
                                <div className="cbp-th">Name <span className="cbp-req">*</span></div>
                                <div className="cbp-th">Surname <span className="cbp-req">*</span></div>
                                <div className="cbp-th">Email</div>
                                <div className="cbp-th">Contact Number <span className="cbp-req">*</span></div>
                                <div className="cbp-th">ID/ Passport Number <span className="cbp-req">*</span></div>
                                <div className="cbp-th">Company <span className="cbp-req">*</span></div>
                                <div className="cbp-th" style={{ textAlign: 'center' }}>Action</div>
                            </div>

                            <div className="cbp-table-body">
                                {rows.map((r, idx) => (
                                    <div
                                        className="cbp-tr"
                                        key={idx}
                                        /* Make each row 7 columns too */
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: GRID_COLS,
                                            gap: 8,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div className="cbp-td">
                                            <input
                                                className="cbp-input"
                                                placeholder="Insert Visitor Name"
                                                value={r.name}
                                                onChange={e => updateCell(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="cbp-td">
                                            <input
                                                className="cbp-input"
                                                placeholder="Insert Visitor Surname"
                                                value={r.surname}
                                                onChange={e => updateCell(idx, 'surname', e.target.value)}
                                            />
                                        </div>
                                        <div className="cbp-td">
                                            <input
                                                className="cbp-input"
                                                type="email"
                                                placeholder="Insert Visitor Email"
                                                value={r.email}
                                                onChange={e => updateCell(idx, 'email', e.target.value)}
                                            />
                                        </div>
                                        <div className="cbp-td">
                                            <input
                                                className="cbp-input"
                                                placeholder="Insert Visitor Contact Number"
                                                value={r.contactNumber}
                                                onChange={e => updateCell(idx, 'contactNumber', e.target.value)}
                                            />
                                        </div>
                                        <div className="cbp-td">
                                            <input
                                                className="cbp-input"
                                                placeholder="Insert ID Number (Insert Passport Number if not South African citizen)"
                                                value={r.idPassport}
                                                onChange={e => updateCell(idx, 'idPassport', e.target.value)}
                                            />
                                        </div>
                                        <div className="cbp-td">
                                            <input
                                                className="cbp-input"
                                                placeholder="Insert Visitor Company Name"
                                                value={r.company}
                                                onChange={e => updateCell(idx, 'company', e.target.value)}
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="cbp-td" style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button
                                                className="cbp-row-del-btn"
                                                type={rows.length === 1 ? 'button' : 'button'}
                                                title={rows.length === 1 ? "At least one row is required" : "Delete Row"}
                                                onClick={() => deleteRow(idx)}
                                                disabled={rows.length === 1}
                                                aria-label={`Delete row ${idx + 1}`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '6px 10px',
                                                    border: '1px none #d0d7de',
                                                    borderRadius: 6,
                                                    background: '#fff',
                                                    fontSize: 14,
                                                    lineHeight: 1.2,
                                                    cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                                                    opacity: rows.length === 1 ? 0.6 : 1
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="cbp-add-row">
                                    <button className="cbp-add-row-btn" onClick={addRow} title="Add Row">
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="cbp-import-wrap">
                            <button className="cbp-import-btn" onClick={openExcel} type="button">
                                Import From Excel File
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="create-visitor-profile-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="create-visitor-profile-page-upload-button"
                                onClick={handleSubmit}
                                disabled={loading}
                                type="button"
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBatchProfiles;
