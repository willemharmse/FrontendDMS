import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faDownload,
    faCaretLeft,
    faCaretRight,
    faFilter
} from "@fortawesome/free-solid-svg-icons";
import DownloadPopup from "../FileInfo/DownloadPopup";
import TopBar from "../Notifications/TopBar";

const SGIVersionHistory = () => {
    const [activity, setActivity] = useState([]);
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingId, setLoadingId] = useState(null);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileId, setDownloadFileId] = useState(null);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const navigate = useNavigate();

    const excelPopupRef = useRef(null);

    const BLANK = "(Blanks)";

    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());

    const DEFAULT_SORT = { colId: null, direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const [filters, setFilters] = useState({});

    const columns = [
        { id: "nr", title: "Nr" },
        { id: "fileName", title: "File Name" },
        { id: "version", title: "Version" },
        { id: "uploadDate", title: "Date Uploaded" },
        { id: "reason", title: "Reason For Change" },
        { id: "action", title: "Action" }
    ];

    const removeFileExtension = (fileName) => (fileName || "").replace(/\.[^/.]+$/, "");

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const getCellValue = (row, colId) => {
        switch (colId) {
            case "nr":
                return "";
            case "fileName":
                return removeFileExtension(row.fileName || "");
            case "version":
                return row.version ? `V ${row.version}` : "";
            case "uploadDate":
                return formatDate(row.uploadDate);
            case "reason":
                return row.reason || "";
            default:
                return "";
        }
    };

    const normalizeValue = (value) => {
        const s = value == null ? "" : String(value).trim();
        return s === "" ? BLANK : s;
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    const getAvailableOptions = (targetColId) => {
        const rowsAfterOtherFilters = activity.filter((row) => {
            for (const [colId, selected] of Object.entries(filters)) {
                if (colId === targetColId) continue;
                if (!Array.isArray(selected) || selected.length === 0) continue;

                const cellValue = normalizeValue(getCellValue(row, colId));
                if (!selected.includes(cellValue)) return false;
            }
            return true;
        });

        const uniqueValues = Array.from(
            new Set(
                rowsAfterOtherFilters.map((row) =>
                    normalizeValue(getCellValue(row, targetColId))
                )
            )
        );

        return uniqueValues.sort((a, b) =>
            String(a).localeCompare(String(b), undefined, {
                sensitivity: "base",
                numeric: true
            })
        );
    };

    const openExcelFilter = (colId, e) => {
        if (colId === "nr" || colId === "action") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const allValues = getAvailableOptions(colId);
        const existing = filters[colId];

        setExcelSelected(new Set(Array.isArray(existing) ? existing : allValues));
        setExcelSearch("");
        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(rect.width, 220)
            }
        });
    };

    useEffect(() => {
        if (!excelFilter.open) return;

        const handleClickOutside = (e) => {
            if (excelPopupRef.current && !excelPopupRef.current.contains(e.target)) {
                setExcelFilter({
                    open: false,
                    colId: null,
                    anchorRect: null,
                    pos: { top: 0, left: 0, width: 0 }
                });
            }
        };

        const handleScroll = () => {
            setExcelFilter({
                open: false,
                colId: null,
                anchorRect: null,
                pos: { top: 0, left: 0, width: 0 }
            });
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [excelFilter.open]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchActivity();
        }
    }, [token]);

    const openDownloadModal = (fileId, fileName) => {
        setDownloadFileId(fileId);
        setDownloadFileName(fileName);
        setIsDownloadModalOpen(true);
    };

    const closeDownloadModal = () => {
        setDownloadFileId(null);
        setDownloadFileName(null);
        setIsDownloadModalOpen(false);
    };

    const confirmDownload = () => {
        if (downloadFileId && downloadFileName) {
            downloadFile(downloadFileId, downloadFileName);
        }
        closeDownloadModal();
    };

    const downloadFile = async (fileId, fileName) => {
        try {
            setLoading(true);
            setLoadingId(fileId);

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/file/site-information-versions/download/${fileId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to download the file");
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName || "Site Information Version N/A.xlsx");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Error downloading the file. Please try again.");
        } finally {
            setLoading(false);
            setLoadingId(null);
        }
    };

    const fetchActivity = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/file/site-information-versions`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch site information backups");
            }

            const data = await response.json();
            setActivity(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const displayedActivity = useMemo(() => {
        let current = [...activity];

        current = current.filter((row) => {
            for (const [colId, selected] of Object.entries(filters)) {
                if (!Array.isArray(selected) || selected.length === 0) continue;

                const cellValue = normalizeValue(getCellValue(row, colId));
                if (!selected.includes(cellValue)) return false;
            }
            return true;
        });

        const colId = sortConfig?.colId ?? "fileName";
        const dir = sortConfig?.direction === "desc" ? -1 : 1;

        current.sort((a, b) => {
            const av = normalizeValue(getCellValue(a, colId));
            const bv = normalizeValue(getCellValue(b, colId));

            const aBlank = av === BLANK;
            const bBlank = bv === BLANK;
            if (aBlank && !bBlank) return 1;
            if (!aBlank && bBlank) return -1;

            return String(av).localeCompare(String(bv), undefined, {
                sensitivity: "base",
                numeric: true,
            }) * dir;
        });

        return current;
    }, [activity, filters, sortConfig]);

    const isSortActive = (colId) => sortConfig?.colId === colId;

    const isFilterActive = (colId) =>
        Array.isArray(filters[colId]) && filters[colId].length > 0;

    const isHeaderIconVisible = (colId) =>
        isSortActive(colId) || isFilterActive(colId);

    return (
        <div className="version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img
                            src={`${process.env.PUBLIC_URL}/CH_Logo.svg`}
                            alt="Logo"
                            className="logo-img-um"
                            onClick={() => navigate("/FrontendDMS/home")}
                            title="Home"
                        />
                        <p className="logo-text-um">Site Information Backups</p>
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

            <div className="main-box-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">SGI Version History</label>
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        <table className="version-history-file-info-table">
                            <thead className="version-history-file-info-head" style={{ fontSize: "14px" }}>
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.id}
                                            className="version-history-file-th"
                                            onClick={(e) => {
                                                if (col.id !== "nr" && col.id !== "action") {
                                                    openExcelFilter(col.id, e);
                                                }
                                            }}
                                            style={{
                                                cursor: col.id !== "nr" && col.id !== "action" ? "pointer" : "default",
                                                position: "relative"
                                            }}
                                        >
                                            {col.title}

                                            {col.id !== "nr" && col.id !== "action" && isHeaderIconVisible(col.id) && (
                                                <FontAwesomeIcon
                                                    icon={faFilter}
                                                    style={{
                                                        marginLeft: "8px",
                                                        pointerEvents: "none"
                                                    }}
                                                />
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayedActivity.length > 0 ? (
                                    displayedActivity.map((act, index) => (
                                        <tr style={{ fontSize: "14px" }} key={act._id} className="file-info-row-height version-history-file-info-tr">
                                            <td style={{ textAlign: "center" }}>{index + 1}</td>
                                            <td style={{ textAlign: "left" }}>{removeFileExtension(act.fileName)}</td>
                                            <td style={{ textAlign: "center" }}>{act.version ? `V ${act.version}` : ""}</td>
                                            <td style={{ textAlign: "center" }}>{formatDate(act.uploadDate)}</td>
                                            <td style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>{act.reason || ""}</td>
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    className="verion-download-button"
                                                    onClick={() => openDownloadModal(act._id, act.fileName)}
                                                    disabled={loading && loadingId === act._id}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} title="Download" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6">
                                            {loading ? "Loading version history..." : error ? error : "No Site Information Version History"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

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
                                        visibleValues.length > 0 &&
                                        visibleValues.every(v => excelSelected.has(v));

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

                                        const isTotalReset =
                                            allValues.length > 0 &&
                                            allValues.length === selectedArr.length &&
                                            selectedArr.every(v => finalSelection.has(v));

                                        setFilters(prev => {
                                            const next = { ...prev };
                                            if (isTotalReset) {
                                                delete next[colId];
                                            } else {
                                                next[colId] = selectedArr;
                                            }
                                            return next;
                                        });

                                        setExcelFilter({
                                            open: false,
                                            colId: null,
                                            anchorRect: null,
                                            pos: { top: 0, left: 0, width: 0 }
                                        });
                                    };

                                    const onCancel = () => {
                                        setExcelFilter({
                                            open: false,
                                            colId: null,
                                            anchorRect: null,
                                            pos: { top: 0, left: 0, width: 0 }
                                        });
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
                                                    <div
                                                        style={{
                                                            padding: "8px",
                                                            color: "#888",
                                                            fontStyle: "italic",
                                                            fontSize: "12px"
                                                        }}
                                                    >
                                                        No matches found
                                                    </div>
                                                )}
                                            </div>

                                            <div className="excel-filter-actions">
                                                <button type="button" className="excel-filter-btn" onClick={onOk}>
                                                    Apply
                                                </button>
                                                <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isDownloadModalOpen && (
                <DownloadPopup
                    closeDownloadModal={closeDownloadModal}
                    confirmDownload={confirmDownload}
                    downloadFileName={downloadFileName}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default SGIVersionHistory;