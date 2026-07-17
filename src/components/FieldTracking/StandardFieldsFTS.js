import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faDownload, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faFilter, faFile, faFileExport, faPlusCircle, faUpload, faCirclePlus, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import DownloadPopup from "../FileInfo/DownloadPopup";
import { jwtDecode } from 'jwt-decode';
import TopBar from "../Notifications/TopBar";
import { canIn, getCurrentUser } from "../../utils/auth";
import { saveAs } from "file-saver";
import BatchImportStandardFields from "./BatchImportStandardFields";
import AddFTSField from "./AddFTSField";
import ModifyFTSField from "./ModifyFTSField";
import DeleteStandardFieldPopup from "./DeleteStandardFieldPopup";
import { toast, ToastContainer } from "react-toastify";

const StandardFieldsFTS = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [fields, setFields] = useState([]);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isModifyOpen, setIsModifyOpen] = useState(false);
    const [modifyTarget, setModifyTarget] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const access = getCurrentUser();

    // --- Excel Filter States ---
    const DEFAULT_SORT = { colId: null, direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        fetchStandardFields();
    }, [token]);

    const openDownloadModal = (fileName, displayName) => {
        setDownloadFileName(fileName);
        setDisplayName(displayName);
        setIsDownloadModalOpen(true);
    };

    const closeDownloadModal = () => {
        setDownloadFileName(null);
        setDisplayName(null);
        setIsDownloadModalOpen(false);
    };

    const confirmDownload = () => {
        if (downloadFileName) {
            downloadFile(downloadFileName, displayName);
        }
        closeDownloadModal();
    };

    const downloadFile = async (fileName, displayName) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/generatedSIHistory/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fileName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to download the file');
            }

            // Confirm the response is a Blob
            const blob = await response.blob();

            // Create a URL and download the file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', displayName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading the file. Please try again.');
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    // Fetch the standard field / definition pairs from the API
    const fetchStandardFields = async () => {
        const route = `/api/ftsGenerate/standardFields`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch standard fields');
            }
            const data = await response.json();

            setFields(data.standardFields);
        } catch (error) {
            setError(error.message);
        }
    };

    // --- Excel Filtering Logic Helpers ---

    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        if (colId === "field") return [row.field ? String(row.field).trim() : "-"];
        if (colId === "definition") return [row.definition ? String(row.definition).trim() : "-"];

        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    // Helper to get options filtered by OTHER columns (cross-filtering)
    const getAvailableOptions = (colId) => {
        let filtered = [...fields];

        for (const [filterColId, selectedValues] of Object.entries(activeExcelFilters)) {
            if (filterColId === colId) continue;
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        const uniqueValues = Array.from(
            new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
        ).sort((a, b) =>
            String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
        );

        return uniqueValues;
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = getAvailableOptions(colId);

        const existing = activeExcelFilters[colId];
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);

        setExcelSelected(initialSelected);
        setExcelSearch("");

        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(220, rect.width),
            },
        });
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    // --- Main Processing: Filter -> Sort ---

    const processedFields = useMemo(() => {
        let current = [...fields];

        // Excel Column Filters
        current = current.filter((row, originalIndex) => {
            for (const [colId, selectedValues] of Object.entries(activeExcelFilters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;

                const cellValues = getFilterValuesForCell(row, colId, originalIndex);
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        const normalize = (v) => {
            const s = v == null ? "" : String(v).trim();
            return s === "" ? "(Blanks)" : s;
        };

        const compareText = (a, b) =>
            String(a).localeCompare(String(b), undefined, {
                numeric: true,
                sensitivity: "base"
            });

        current.sort((a, b) => {
            if (!sortConfig?.colId) {
                const nameA = normalize(a?.field);
                const nameB = normalize(b?.field);
                return compareText(nameA, nameB);
            }

            const { colId, direction } = sortConfig;
            const dir = direction === "desc" ? -1 : 1;

            const valA = normalize(a?.[colId]);
            const valB = normalize(b?.[colId]);

            if (valA === "(Blanks)" && valB !== "(Blanks)") return 1;
            if (valA !== "(Blanks)" && valB === "(Blanks)") return -1;

            return compareText(valA, valB) * dir;
        });

        return current;
    }, [fields, activeExcelFilters, sortConfig]);

    // Cleanup Popup Listeners
    useEffect(() => {
        if (!excelFilter.open) return;

        const handleClickOutside = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        const handleScroll = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [excelFilter.open]);

    // Popup Positioning (keep popup on-screen)
    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;

        const popupRect = el.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;

        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) {
                const desiredTop = anchor.top - popupRect.height - 4;
                newTop = Math.max(margin, desiredTop);
            }
        }

        if (popupRect.right > viewportW - margin) {
            const overflow = popupRect.right - (viewportW - margin);
            newLeft = Math.max(margin, newLeft - overflow);
        }
        if (popupRect.left < margin) newLeft = margin;

        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({
                ...prev,
                pos: { ...prev.pos, top: newTop, left: newLeft }
            }));
        }
    }, [excelFilter.open, excelFilter.pos, excelSearch]);

    // --- Top filter icon (active state + double-click to clear) ---
    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        const hasSort = sortConfig.colId !== null || sortConfig.direction !== "asc";
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortConfig]);

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig(DEFAULT_SORT);
    };

    const handleDownload = async () => {
        const dataToStore = fields;
        const documentName = `FTS Standard Fields`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/generateExcels/generate-xlsx-standardControlsFTS`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.xlsx`);
        } catch (error) {
            console.error("Error generating document:", error);
        }
    };

    const handleImport = () => {
        setIsImportOpen(true);
    };

    const handleImportClose = () => {
        setIsImportOpen(false);
    };

    const handleImportSuccess = () => {
        fetchStandardFields();
        setIsImportOpen(false);
    };

    const handleAddOpen = () => {
        setIsAddOpen(true);
    };

    const handleAddClose = () => {
        setIsAddOpen(false);
        fetchStandardFields();
    };

    const handleModifyOpen = (row) => {
        setModifyTarget(row);
        setIsModifyOpen(true);
    };

    const handleModifyClose = () => {
        setIsModifyOpen(false);
        setModifyTarget(null);
        fetchStandardFields();
    };

    const handleDeleteOpen = (row) => {
        setDeleteTarget(row);
        setIsDeleteOpen(true);
    };

    const handleDeleteClose = () => {
        setIsDeleteOpen(false);
        setDeleteTarget(null);
    };

    const handleDeleteField = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsImports/deleteStandardField/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const responseData = await response.json();

            if (!response.ok) {
                toast.error(responseData?.error || "Failed to delete field", { closeButton: false, autoClose: 1500 });
                return;
            }

            toast.success("Standard Field Deleted", { closeButton: false, autoClose: 1500 });
        } catch (error) {
            toast.error("Failed to delete field", { closeButton: false, autoClose: 1500 });
        } finally {
            handleDeleteClose();
            fetchStandardFields();
        }
    };

    return (
        <div className="dc-version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Standard Fields</p>
                        <div className="button-container-create">

                            {canIn(access, "FTS", ["systemAdmin", "contributor"]) && (
                                <>
                                    <button className="but-um" onClick={() => navigate("/FrontendDMS/suggestedFields/new")}>
                                        <div className="button-content">
                                            <FontAwesomeIcon icon={faFile} className="button-logo-custom" />
                                            <span className="button-text">Suggested Fields</span>
                                        </div>
                                    </button>
                                </>
                            )}
                        </div>
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
            <div className="main-box-dc-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />

                        {false && canIn(access, "FTS", ["systemAdmin", "contributor"]) && (
                            <>
                                <div className="burger-menu-icon-um">
                                    <FontAwesomeIcon icon={faCirclePlus} title="Add New Field" onClick={handleAddOpen} style={{ cursor: "pointer" }} />
                                </div>
                            </>
                        )}
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">Standard Fields</label>

                        <FontAwesomeIcon
                            icon={faFilter}
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{
                                cursor: hasActiveFilters ? "pointer" : "default",
                                color: hasActiveFilters ? "#002060" : "gray",
                                userSelect: "none",
                                marginLeft: "10px"
                            }}
                            className="top-right-button-control-att"
                            onDoubleClick={handleClearFilters}
                        />

                        <FontAwesomeIcon
                            icon={faUpload}
                            title={"Export Standard Fields Table"}
                            className="top-right-button-control-att-2"
                            onClick={handleDownload}
                        />

                        {true && (<FontAwesomeIcon
                            icon={faDownload}
                            title={"Import Standard Fields"}
                            className="top-right-button-control-att-3"
                            onClick={handleImport}
                        />)}
                    </div>
                    <div className="table-containerdc-version-history-file-info" style={{ overflowY: "auto" }}>
                        <table className="dc-version-history-file-info-table">
                            <thead className="dc-version-history-file-info-head">
                                <tr style={{ fontSize: "14px" }}>
                                    <th
                                        style={{ width: "5%", position: "relative", cursor: "pointer", textAlign: "center" }}
                                        onClick={(e) => openExcelFilterPopup("nr", e)}
                                    >
                                        <span>Nr</span>
                                        {(activeExcelFilters["nr"] || sortConfig.colId === "nr") && (
                                            <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                        )}
                                    </th>
                                    <th
                                        style={{ width: "20%", position: "relative", cursor: "pointer", textAlign: "center" }}
                                        onClick={(e) => openExcelFilterPopup("field", e)}
                                    >
                                        <span>Field Name</span>
                                        {(activeExcelFilters["field"] || sortConfig.colId === "field") && (
                                            <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                        )}
                                    </th>
                                    <th
                                        style={{ width: "70%", position: "relative", cursor: "pointer", textAlign: "center" }}
                                        onClick={(e) => openExcelFilterPopup("definition", e)}
                                    >
                                        <span>Field Description</span>
                                        {(activeExcelFilters["definition"] || sortConfig.colId === "definition") && (
                                            <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                        )}
                                    </th>
                                    <th
                                        style={{ width: "5%", textAlign: "center" }}
                                    >
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedFields.length > 0 ? (
                                    processedFields.map((row, index) => (
                                        <tr style={{ fontSize: "14px" }} key={row._id ?? index} className={`file-info-row-height dc-version-history-file-info-tr`}>
                                            <td style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{index + 1}</td>
                                            <td style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{row.field}</td>
                                            <td style={{ textAlign: "left", fontFamily: "Arial", fontSize: "14px" }}>{row.definition}</td>
                                            <td style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>
                                                {false && (
                                                    <>
                                                        <FontAwesomeIcon
                                                            icon={faEdit}
                                                            title="Modify Field"
                                                            style={{ cursor: "pointer", marginRight: "12px" }}
                                                            onClick={() => handleModifyOpen(row)}
                                                        />
                                                        <FontAwesomeIcon
                                                            icon={faTrash}
                                                            title="Delete Field"
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => handleDeleteOpen(row)}
                                                        />
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: "center" }}>No Standard Fields</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Excel Filter Popup */}
            {excelFilter.open && (
                <div
                    className="excel-filter-popup"
                    ref={excelPopupRef}
                    style={{
                        position: "fixed",
                        top: excelFilter.pos.top,
                        left: excelFilter.pos.left,
                        width: excelFilter.pos.width,
                        zIndex: 9999,
                    }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "asc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>

                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "desc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "desc")}
                        >
                            Sort Descending
                        </button>
                    </div>

                    <input
                        type="text"
                        className="excel-filter-search"
                        placeholder="Search"
                        value={excelSearch}
                        onChange={(e) => setExcelSearch(e.target.value)}
                    />

                    {(() => {
                        const colId = excelFilter.colId;

                        const allValues = getAvailableOptions(colId);

                        const visibleValues = allValues.filter(v =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const isAllVisibleSelected =
                            visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (checked) {
                                    visibleValues.forEach(v => next.add(v));
                                } else {
                                    visibleValues.forEach(v => next.delete(v));
                                }
                                return next;
                            });
                        };

                        const toggleValue = (v) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (next.has(v)) next.delete(v);
                                else next.add(v);
                                return next;
                            });
                        };

                        const onOk = () => {
                            let finalSelection = new Set(excelSelected);
                            if (excelSearch.trim() !== "") {
                                const visibleSet = new Set(visibleValues);
                                finalSelection = new Set(
                                    Array.from(excelSelected).filter(v => visibleSet.has(v))
                                );
                            }

                            const selectedArr = Array.from(finalSelection);
                            const isTotalReset = allValues.length > 0 &&
                                allValues.length === selectedArr.length &&
                                selectedArr.every(v => finalSelection.has(v));

                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isTotalReset) {
                                    delete next[colId];
                                } else {
                                    next[colId] = selectedArr;
                                }
                                return next;
                            });

                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        const onCancel = () => {
                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        return (
                            <>
                                <div className="excel-filter-list">
                                    <label className="excel-filter-item">
                                        <span className="excel-filter-checkbox">
                                            <input
                                                type="checkbox"
                                                className="checkbox-excel-attend"
                                                checked={isAllVisibleSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                            />
                                        </span>
                                        <span className="excel-filter-text">
                                            {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                                        </span>
                                    </label>

                                    {visibleValues.map(v => (
                                        <label className="excel-filter-item" key={String(v)}>
                                            <span className="excel-filter-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-excel-attend"
                                                    checked={excelSelected.has(v)}
                                                    onChange={() => toggleValue(v)}
                                                />
                                            </span>
                                            <span className="excel-filter-text">{v}</span>
                                        </label>
                                    ))}

                                    {visibleValues.length === 0 && (
                                        <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                                            No matches found
                                        </div>
                                    )}
                                </div>

                                <div className="excel-filter-actions">
                                    <button type="button" className="excel-filter-btn" onClick={onOk}>Apply</button>
                                    <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>Cancel</button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {isImportOpen && (
                <BatchImportStandardFields
                    onClose={handleImportClose}
                    onImportSuccess={handleImportSuccess}
                />
            )}
            {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={displayName} loading={loading} />)}

            <AddFTSField isOpen={isAddOpen} onClose={handleAddClose} />

            {isModifyOpen && modifyTarget && (
                <ModifyFTSField isOpen={isModifyOpen} onClose={handleModifyClose} data={modifyTarget} />
            )}

            {isDeleteOpen && deleteTarget && (
                <DeleteStandardFieldPopup
                    closeModal={handleDeleteClose}
                    deleteField={handleDeleteField}
                    field={deleteTarget}
                />
            )}

            <ToastContainer />
        </div >
    );
};

export default StandardFieldsFTS;