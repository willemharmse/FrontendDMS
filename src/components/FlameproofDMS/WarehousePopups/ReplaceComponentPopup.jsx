import React, { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faCircleLeft, faPenToSquare, faRotateLeft, faArrowsRotate, faMagnifyingGlass, faCircleXmark, faX, faFilter, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import MoveComponentConfirm from "./MoveComponentConfirm";

const ReplaceComponentPopup = ({ isOpen, onClose, assetType, component, replaceComponent }) => {
    const [components, setComponents] = useState([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showNoDrafts, setShowNoDrafts] = useState(false);
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [replace, setReplace] = useState(false);
    const [serial, setSerial] = useState("");
    const [fileId, setFileId] = useState("");

    const startReplace = (serial, id) => {
        setFileId(id);
        setSerial(serial);
        setReplace(true);
    }

    const stopReplace = () => {
        setReplace(false);
    }

    const toggleSort = (field) => {
        if (sortBy !== field) {
            setSortBy(field);
            setSortDir('asc');
            return;
        }
        if (sortDir === 'asc') { setSortDir('desc'); return; }
        // turn off
        setSortBy(null);
        setSortDir(null);
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;
        if (sortDir === 'asc') return <FontAwesomeIcon icon={faSortUp} style={{ marginLeft: 6 }} />;
        if (sortDir === 'desc') return <FontAwesomeIcon icon={faSortDown} style={{ marginLeft: 6 }} />;
        return null;
    };

    const filteredComponents = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return components;
        return components.filter(d =>
            (d?.formData?.serialNumber || '').toLowerCase().includes(q)
        );
    }, [components, query]);

    const displayComponents = useMemo(() => {
        const list = [...filteredComponents];
        if (!sortBy || !sortDir) return list;

        const getTime = (d) => {
            if (sortBy === 'created') return new Date(d.issueDate).getTime();
            if (sortBy === 'modified') return d.expiryDate ? new Date(d.expiryDate).getTime() : null;
            return null;
        };

        return list.sort((a, b) => {
            const at = getTime(a);
            const bt = getTime(b);

            if (at == null && bt == null) return 0;
            if (at == null) return 1;
            if (bt == null) return -1;

            return sortDir === 'asc' ? at - bt : bt - at;
        });
    }, [filteredComponents, sortBy, sortDir]);

    useEffect(() => {
        const getDraftDocuments = async () => {
            setIsLoading(true);
            setShowNoDrafts(false);
            let route;
            const token = localStorage.getItem("token");

            route = `${process.env.REACT_APP_URL}/api/flameWarehouse/getReplacementComponents/${component}/${assetType}`

            try {
                const response = await fetch(route, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch drafts");
                }

                const data = await response.json();

                setComponents(data.warehouseDocuments);
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        getDraftDocuments();
    }, []);

    useEffect(() => {
        if (!isLoading && components.length === 0) {
            const timer = setTimeout(() => setShowNoDrafts(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowNoDrafts(false);
        }
    }, [isLoading, components]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Johannesburg'
        };

        const formatter = new Intl.DateTimeFormat(undefined, options);
        const parts = formatter.formatToParts(date);

        const datePart = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;

        return `${datePart}`;
    };

    if (!isOpen) return null;

    return (
        <div className="draftLoad-popup-overlay">
            <div className="draftLoad-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Digital Warehouse Components</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>
                <div className="draft-table-group">
                    <div className="draft-select-header">
                        <div className="draft-select-text">Select an available component</div>
                    </div>
                    <div className="draft-searchbar draft-searchbar--full">
                        <input
                            type="text"
                            className="draft-search-input"
                            placeholder="Search Serial Number"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
                        />
                        <div className="draft-search-icons">
                            {query && (
                                <span className="icon-static" title="Clear Search" onClick={() => setQuery('')}>
                                    <FontAwesomeIcon icon={faX} />
                                </span>
                            )}
                            {!query && (
                                <span className="icon-static" title="Search">
                                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="popup-table-wrapper-draft">
                        <table className="popup-table font-fam">
                            <thead className="draft-headers">
                                <tr>
                                    <th className="draft-nr" style={{ width: "10%" }}>Nr</th>
                                    <th className="draft-name" style={{ width: "30%" }}>Serial Number {query && (<FontAwesomeIcon icon={faFilter} style={{ marginLeft: "10px" }} />)}</th>
                                    <th
                                        className="draft-created"
                                        onClick={() => toggleSort('created')}
                                        style={{ cursor: 'pointer', userSelect: 'none', width: "30%" }}
                                    >
                                        Certificate Issue Date <SortIcon field="created" />
                                    </th>

                                    <th
                                        className="draft-updated"
                                        onClick={() => toggleSort('modified')}
                                        style={{ cursor: 'pointer', userSelect: 'none', width: "30%" }}
                                    >
                                        Certificate Expiry Date <SortIcon field="modified" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {!isLoading && components.length > 0 && filteredComponents.length > 0 && (
                                    displayComponents
                                        .map((item, index) => (
                                            <tr key={item._id} style={{ cursor: "pointer" }} onClick={() => startReplace(item.serialNumber, item._id)}>
                                                <td className="draft-nr">{index + 1}</td>
                                                <td className="load-draft-td" style={{ textAlign: "center" }}>{`${item.serialNumber}`}</td>
                                                <td className="cent-draft-class">{item.issueDate ? formatDateTime(item.issueDate) : "-"}</td>
                                                <td className="cent-draft-class">{item.expiryDate ? formatDateTime(item.expiryDate) : "-"}</td>
                                            </tr>
                                        ))
                                )}

                                {isLoading && (
                                    <tr>
                                        <td colSpan="4" className="cent">
                                            Loading components
                                        </td>
                                    </tr>
                                )}

                                {!isLoading && components.length === 0 && showNoDrafts && (
                                    <tr>
                                        <td colSpan="4" className="cent">
                                            No Components Available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {replace && (<MoveComponentConfirm closeModal={stopReplace} component={component} serialNumber={serial} moveCertificate={replaceComponent} id={fileId} />)}
        </div>
    );
};

export default ReplaceComponentPopup;
