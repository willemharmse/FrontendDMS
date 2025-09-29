import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import "./ComponentManagePopup.css";
import AddComponent from "./AddComponent";

const norm = (v) => String(v || "").trim();
const lower = (v) => norm(v).toLowerCase();

// ---- helpers: Master-first sorting ----
const sortRowsMasterFirst = (rows) =>
    [...rows].sort((a, b) => {
        const al = lower(a.name), bl = lower(b.name);
        const am = al === "master", bm = bl === "master";
        if (am && !bm) return -1;
        if (!am && bm) return 1;
        return al.localeCompare(bl);
    });

const sortNamesMasterFirst = (names) =>
    [...names].sort((a, b) => {
        const al = lower(a), bl = lower(b);
        const am = al === "master", bm = bl === "master";
        if (am && !bm) return -1;
        if (!am && bm) return 1;
        return al.localeCompare(bl);
    });

const AssetComponentManagePopup = ({ closePopup, asset, originalComponents = [] }) => {
    const [assetComponents, setAssetComponents] = useState(Array.isArray(asset?.components) ? asset.components : []);
    const [rows, setRows] = useState([]);
    const [addOpen, setAddOpen] = useState(false);

    useEffect(() => {
        setAssetComponents(Array.isArray(asset?.components) ? asset.components : []);
    }, [asset]);

    // originals -> { name, required }
    const originals = useMemo(() => {
        const list = Array.isArray(originalComponents) ? originalComponents : [];
        return list
            .map(c => (typeof c === "string" ? { name: norm(c), required: true } : { name: norm(c?.name), required: !!c?.mandatory }))
            .filter(o => o.name);
    }, [originalComponents]);

    // build rows
    useEffect(() => {
        const assetSet = new Set((assetComponents || []).map(lower));

        // ensure Master exists as required original
        const hasMasterInOriginals = originals.some(o => lower(o.name) === "master");
        const originalsPlusMaster = hasMasterInOriginals ? originals : [{ name: "Master", required: true }, ...originals];

        const map = new Map();

        for (const { name, required } of originalsPlusMaster) {
            const present = assetSet.has(lower(name));
            const showCheckbox = !required || !present; // optional or missing
            map.set(lower(name), {
                name,
                required,
                present,
                showCheckbox,
                checked: present || required
            });
        }

        for (const c of (assetComponents || [])) {
            const nm = norm(c);
            const key = lower(nm);
            if (!nm || map.has(key)) continue;
            map.set(key, { name: nm, required: false, present: true, showCheckbox: true, checked: true });
        }

        setRows(sortRowsMasterFirst(Array.from(map.values())));
    }, [assetComponents, originals]);

    const toggleRow = (idx) => {
        setRows(prev => prev.map((r, i) => {
            if (i !== idx) return r;
            if (r.required && !r.showCheckbox) return r;
            return { ...r, checked: !r.checked };
        }));
    };

    const onAddFromModal = (list) => {
        const incoming = Array.isArray(list) ? list : [];
        setRows(prev => {
            const map = new Map(prev.map(r => [lower(r.name), r]));
            for (const raw of incoming) {
                const nm = norm(typeof raw === "string" ? raw : raw?.name);
                if (!nm) continue;
                const k = lower(nm);
                const exists = map.get(k);
                map.set(k, exists ? { ...exists, checked: true } : { name: nm, required: false, present: false, showCheckbox: true, checked: true });
            }
            return sortRowsMasterFirst(Array.from(map.values()));
        });
    };

    const handleSubmit = async () => {
        const requiredNames = rows.filter(r => r.required).map(r => r.name);
        const optionalChecked = rows.filter(r => !r.required && r.checked).map(r => r.name);

        // dedupe + Master-first alpha sort
        const seen = new Set();
        const combined = [...requiredNames, ...optionalChecked].filter(n => {
            const k = lower(n);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
        const finalNames = sortNamesMasterFirst(combined);
        if (!seen.has('master')) finalNames.unshift('Master'); // (safety)

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/assetsComponents/${asset?._id}/components`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ components: finalNames }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to save');
            toast.success('Asset components updated', { autoClose: 800, style: { textAlign: 'center' } });
            closePopup();
        } catch (err) {
            toast.error(err.message || 'Failed to save', { autoClose: 1200, style: { textAlign: 'center' } });
        }
    };

    return (
        <div className="popup-overlay-component-page">
            <div className="popup-content-component-page-sub">
                <div className="review-date-header">
                    <h2 className="review-date-title">{asset?.assetNr} Management</h2>
                    <button className="review-date-close" onClick={closePopup} title="Close Popup">×</button>
                </div>

                <div className="component-page-table-group">
                    <label className="component-page-label">Asset Components</label>
                    <div className="component-page-popup-table-wrapper">
                        <table className="popup-table font-fam">
                            <thead className="component-page-headers">
                                <tr>
                                    <th className="components-types-name" style={{ width: "70%" }}>Component</th>
                                    <th style={{ width: "30%", textAlign: "center" }}>Available</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length > 0 ? (
                                    rows.map((r, idx) => (
                                        <tr key={`${r.name}-${idx}`} style={{ cursor: "pointer" }}>
                                            <td >{r.name || '(unnamed component)'}</td>
                                            <td style={{ textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    className={[
                                                        "checkbox-inp-component",
                                                        r.required ? "is-required" : "is-optional",
                                                        r.present ? "is-present" : "is-missing"
                                                    ].join(" ")}
                                                    data-required={r.required ? "true" : "false"}
                                                    data-present={r.present ? "true" : "false"}
                                                    checked={!!r.checked}
                                                    onChange={() => toggleRow(idx)}
                                                    title={
                                                        r.required
                                                            ? (r.present ? "Required (already on asset)" : "Required (will be added)")
                                                            : (r.present ? "Optional (on asset)" : "Optional (not on asset)")
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3">No components found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="component-page-footer">
                    <button className="add-row-button-conmponent-page" onClick={handleSubmit}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetComponentManagePopup;
