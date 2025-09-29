import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlus } from '@fortawesome/free-solid-svg-icons';
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

const CreateBatchProfiles = ({ onClose, openExcel, refresh }) => {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
    const fileInputRef = useRef(null);

    const updateCell = (index, field, value) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const addRow = () => setRows(prev => [...prev, emptyRow()]);

    const parseCsvText = (text) => {
        // Simple CSV parser (comma or semicolon); trims and ignores empty lines
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
        const parsed = lines.map(line => {
            const parts = line.split(/,|;/).map(s => s.trim());
            const [name, surname, email, contactNumber, idPassport, company] = parts;
            return { name: name || '', surname: surname || '', email: email || '', contactNumber: contactNumber || '', idPassport: idPassport || '', company: company || '' };
        });
        return parsed;
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleSubmit = async () => {
        // Minimal validation for required fields on each row
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

            const payload = { rows };

            const res = await axios.post(url, payload, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json'
                }
            });

            // Success (HTTP 200)
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

            // Fallback: generic message
            toast.error(data?.error || 'Failed to import visitors.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-visitor-profile-page-container">
            <div className="create-visitor-profile-page-overlay">
                <div className="create-visitor-profile-page-popup-right-batch">
                    {/* Header (leave classes as-is per instructions) */}
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
                            <div className="cbp-table-header">
                                <div className="cbp-th">Name <span className="cbp-req">*</span></div>
                                <div className="cbp-th">Surname <span className="cbp-req">*</span></div>
                                <div className="cbp-th">Email</div>
                                <div className="cbp-th">Contact Number <span className="cbp-req">*</span></div>
                                <div className="cbp-th">ID/ Passport Number <span className="cbp-req">*</span></div>
                                <div className="cbp-th">Company <span className="cbp-req">*</span></div>
                            </div>

                            <div className="cbp-table-body">
                                {rows.map((r, idx) => (
                                    <div className="cbp-tr" key={idx}>
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
                            <button className="cbp-import-btn" onClick={openExcel}>
                                Import From Excel File
                            </button>
                        </div>
                    </div>

                    {/* Footer (keep existing classes per instructions) */}
                    <div className="create-visitor-profile-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="create-visitor-profile-page-upload-button"
                                onClick={handleSubmit}
                                disabled={loading}
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