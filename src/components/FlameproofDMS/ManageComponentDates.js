import React, { useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faDownload, faDownLong, faEdit, faSpinner, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";
import TopBar from "../Notifications/TopBar";
import { useParams, useNavigate } from "react-router-dom";
import ModifySerialDate from "./Popups/ModifySerialDate";

const ManageComponentDates = () => {
    const { id } = useParams();
    const [userID, setUserID] = useState('');
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState({});
    const [files, setFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState(null);
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [selectedArea, setSelectedArea] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [rows, setRows] = useState([]);
    const todayStr = new Date().toISOString().split("T")[0];
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [modify, setModify] = useState(false);
    const [index, setIndex] = useState("");
    const [component, setComponent] = useState("");
    const [updateDate, setUpdateDate] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const navigate = useNavigate();

    const openModify = (idx, comp, ud, sn) => {
        setIndex(idx);
        setComponent(comp);
        setUpdateDate(ud);
        setSerialNumber(sn)
        setModify(true);
    }

    const closeModify = () => {
        setIndex("");
        setComponent("");
        setUpdateDate("");
        setSerialNumber("")
        setModify(false);
    }

    const isValidDateObj = (d) => d instanceof Date && !Number.isNaN(d.getTime());

    const formatSerial = (serial) => {
        if (serial === "") return "-"

        return serial
    }

    const parseMaybeDate = (v) => {
        if (!v) return null;
        if (v instanceof Date) return isValidDateObj(v) ? v : null;
        if (typeof v === 'string') {
            const s = v.trim();
            if (!s || s === '—') return null;
            const d = new Date(s);
            return isValidDateObj(d) ? d : null;
        }
        return null;
    };

    const toInputDate = (v) => {
        const d = parseMaybeDate(v);
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const toISOFromInputLoose = (s) => {
        const norm = normalizeLooseDate(s);
        if (!norm) return null;
        const dt = new Date(`${norm}T00:00:00.000Z`);
        return isValidDateObj(dt) ? dt.toISOString() : null;
    };

    const normalizeLooseDate = (s) => {
        if (!s) return null;
        const m = String(s).trim().match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
        if (!m) return null;
        let [, yStr, moStr, dStr] = m;
        const y = Number(yStr);
        const mo = Number(moStr);
        const d = Number(dStr);
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

        const dt = new Date(Date.UTC(y, mo - 1, d));
        if (!isValidDateObj(dt)) return null;
        if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== mo || dt.getUTCDate() !== d) return null;

        const mm = String(mo).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
            console.log(userID);
        }
    }, []);

    const fetchFiles = async () => {
        const route = `/api/flameproof/certificates/with-updates/${id}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, { headers: {} });
            if (!response.ok) throw new Error('Failed to fetch files');

            const data = await response.json();
            setFiles(data.certificates);

            console.log(data.certificates);

            setRows(
                (data.certificates || []).map((c) => {
                    const parsed = parseMaybeDate(c.dateUpdated);
                    return {
                        _id: c._id,
                        component: c.component,
                        assetId: c.asset?._id,
                        originalISO: parsed ? parsed.toISOString() : null,
                        dateUpdatedStr: toInputDate(parsed),     // "" if none
                        serialNumber: c.serialNumber ?? "",      // <<=== keep empty when undefined
                        changed: false,
                    };
                })
            );
        } catch (error) {
            setError(error.message);
        } finally {
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const filteredFiles = files;

    // ManageComponentDates.jsx
    const submitUpdates = async (rowsOverride) => {
        try {
            setLoading(true);

            const useRows = Array.isArray(rowsOverride) ? rowsOverride : rows;
            if (!useRows.length) return;

            const assetID = useRows[0].assetId;

            const updates = useRows.map((r) => {
                const changedTo = toISOFromInputLoose(r.dateUpdatedStr);
                return {
                    component: r.component,
                    dateUpdated: changedTo,
                    serialNumber: r.serialNumber ?? "",   // <-- include serial number
                    changedByUser: !!r.changed,
                    changedFrom: r.originalISO,
                    changedTo,
                };
            });

            const token = localStorage.getItem("token");

            await axios.put(
                `${process.env.REACT_APP_URL}/api/flameproof/modifyComponents/${assetID}/component-updates`,
                { updates },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Component dates updated.");
            await fetchFiles(); // refresh from server
        } catch (e) {
            console.error(e);
            toast.error("Failed to update component dates.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="file-info-container">

            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Flameproof Component Management</p>
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

            <div className="main-box-file-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="table-container-file">
                    <table>
                        <thead>
                            <tr>
                                <th className="col" style={{ width: "5%" }}>Nr</th>
                                <th className="col" style={{ width: "20%" }}>Component Name</th>
                                <th className="col" style={{ width: "20%" }}>Serial Number</th>
                                <th className="col" style={{ width: "20%" }}>Component Update/Installation Date</th>
                                <th className="col" style={{ width: "20%" }}>User Updated</th>
                                <th className="col" style={{ width: "5%" }}>Action</th></tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file, index) => (
                                <tr key={index} className={`file-info-row-height`}>
                                    <td className="col">{index + 1}</td>
                                    <td style={{ textAlign: "center" }} className="col">{(file.component) ?? ""}</td>
                                    <td style={{ textAlign: "center" }} className="col">{formatSerial(rows[index]?.serialNumber) ?? "-"}</td>
                                    <td style={{ textAlign: "center" }} className="col">{formatSerial(rows[index]?.dateUpdatedStr) ?? "-"}</td>
                                    <td className="col">{file?.updater}</td>
                                    <td className={"col-act"}>
                                        <button
                                            className={"modify-asset-button-fi col-but-res"}
                                            onClick={() => openModify(index, file.component, rows[index]?.dateUpdatedStr, rows[index]?.serialNumber)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} title="Edit Component" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {modify && (<ModifySerialDate isOpen={true} component={component} index={index} onClose={closeModify} serialNum={serialNumber} setRows={setRows} updateDate={updateDate} rows={rows} onUpdate={submitUpdates} />)}
        </div >
    );
};

export default ManageComponentDates;