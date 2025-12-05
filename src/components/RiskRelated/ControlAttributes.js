import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faEraser, faTimes, faDownload, faCaretLeft, faCaretRight, faTableColumns, faArrowsLeftRight, faArrowsRotate, faFolderOpen, faCirclePlus, faEdit } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { saveAs } from "file-saver";
import TopBar from "../Notifications/TopBar";
import "./ControlAttributes.css";
import { canIn, getCurrentUser } from "../../utils/auth";
import AddControlPopup from "./AddControlPopup";
import { ToastContainer } from "react-toastify";
import EditControlPopup from "./EditControlPopup";

const ControlAttributes = () => {
    const [controls, setControls] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [filteredControls, setFilteredControls] = useState([]);
    const [searchPopupVisible, setSearchPopupVisible] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const access = getCurrentUser();
    const scrollerRef = useRef(null);   // the horizontal scroller (wrapper div)
    const tbodyRef = useRef(null);      // to listen for row pointer events
    const drag = useRef({ active: false, startX: 0, startLeft: 0 });
    const [addControl, setAddControl] = useState(false);
    const [modifyControl, setModifyControl] = useState(false);
    const [modifyingControl, setModifyingControl] = useState("")

    const openAddControl = () => {
        setAddControl(true);
    }

    const closeAddControl = () => {
        setAddControl(false);
        fetchControls();
    }

    const openModifyControl = (control) => {
        setModifyingControl(control);
        setModifyControl(true);
    }

    const closeModifyControl = () => {
        setModifyControl(false);
        fetchControls();
    }

    const onNativeDragStart = (e) => {
        // Kill native drag/ghost image that can fade elements
        e.preventDefault();
    };

    const onRowPointerDown = (e) => {
        // 🔴 Do NOT start drag when clicking on the edit button or other interactive elements
        if (
            e.target.closest(".rca-action-btn") ||                  // your edit button
            e.target.closest(".risk-control-attributes-action-cell") ||
            e.target.closest("button") ||
            e.target.closest("a") ||
            e.target.closest("input") ||
            e.target.closest("textarea") ||
            e.target.closest("select")
        ) {
            return;
        }

        if (!e.target.closest("tr")) return;

        const scroller = scrollerRef.current;
        if (!scroller) return;

        drag.current.active = true;
        drag.current.startX = e.clientX;
        drag.current.startLeft = scroller.scrollLeft;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        scroller.classList.add("dragging");
    };

    const onRowPointerMove = (e) => {
        if (!drag.current.active) return;
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const dx = e.clientX - drag.current.startX;
        scroller.scrollLeft = drag.current.startLeft - dx; // pan like a scrollbar
        e.preventDefault(); // avoid text selection while dragging
    };

    const endRowDrag = (e) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        scrollerRef.current?.classList.remove("dragging");
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        fetchControls();
    }, []);

    const handleDownload = async () => {
        const dataToStore = controls;

        const documentName = `Site Controls Output Register`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/generateExcels/generate-xlsx-siteControls`, {
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
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
        }
    };

    // Fetch files from the API
    const fetchControls = async () => {
        const route = `/api/riskInfo/controls`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`);

            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }

            const data = await response.json();

            // 🔥 SORT HERE
            const sortedControls = data.controls.sort((a, b) =>
                a.control.localeCompare(b.control, undefined, { sensitivity: 'base' })
            );

            setControls(sortedControls);
            setFilteredControls(sortedControls);

        } catch (error) {
            setError(error.message);
        }
    };

    const handleSearchClick = () => setSearchPopupVisible(prev => !prev);

    const handleCloseSearch = () => {
        setSearchPopupVisible(false)
        setSearchInput("");
        setFilteredControls(controls);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        const filtered = controls.filter(c =>
            c.control.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredControls(filtered);
    };
    const availableColumns = [
        { id: "nr", title: "Nr" },
        { id: "control", title: "Control" },
        { id: "description", title: "Control Description" },
        { id: "performance", title: "Performance Requirements & Verification" },
        { id: "critical", title: "Critical Control" },
        { id: "act", title: "Act, Object or System" },
        { id: "activation", title: "Control Activation (Pre or Post Unwanted Event)" },
        { id: "hierarchy", title: "Hierarchy of Controls" },
        { id: "quality", title: "Control Quality" },
        { id: "cons", title: "Main Consequence Addressed" },
        { id: "action", title: "Action" },
    ];

    // Default: all columns ON except performance + quality
    const [showColumns, setShowColumns] = useState([
        "nr",
        "control",
        "description",
        "critical",
        "act",
        "activation",
        "hierarchy",
        "cons",
        "action",
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const allColumnIds = availableColumns.map(c => c.id);

    const toggleColumn = (columnId) => {
        // Never allow Nr to be hidden
        if (columnId === "nr") return;
        if (columnId === "action") return;

        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                return prev.filter(id => id !== columnId);
            }
            return [...prev, columnId];
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            // Select every column (nr included)
            setShowColumns(allColumnIds);
        } else {
            // Keep only Nr when "select none"
            setShowColumns(["nr", "action"]);
        }
    };

    const areAllColumnsSelected = () => {
        return allColumnIds.every(id => showColumns.includes(id));
    };

    // Groupings for the first header row
    const identificationColumns = ["nr", "control", "description", "performance", "critical"];
    const cerColumns = ["act", "activation", "hierarchy", "quality", "cons"];

    const visibleIdentificationColumns = identificationColumns.filter(id => showColumns.includes(id));
    const visibleCerColumns = cerColumns.filter(id => showColumns.includes(id));

    useEffect(() => {
        if (!showColumnSelector) return;

        const handleClickOutside = (e) => {
            if (
                !e.target.closest('.column-selector-popup') &&
                !e.target.closest('.top-right-button-control-att-3')
            ) {
                setShowColumnSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showColumnSelector]);

    const [columnWidths, setColumnWidths] = useState({
        nr: 60,
        control: 250,
        description: 320,
        performance: 260,
        critical: 90,
        act: 140,
        activation: 200,
        hierarchy: 220,
        quality: 120,
        cons: 150,
        action: 80,
    });

    const [initialColumnWidths] = useState({
        nr: 60,
        control: 250,
        description: 320,
        performance: 260,
        critical: 90,
        act: 140,
        activation: 200,
        hierarchy: 220,
        quality: 120,
        cons: 150,
        action: 80,
    });

    const columnSizeLimits = {
        nr: { min: 60, max: 60 },
        control: { min: 150, max: 600 },
        description: { min: 200, max: 800 },
        performance: { min: 150, max: 600 },
        critical: { min: 70, max: 200 },
        act: { min: 100, max: 300 },
        activation: { min: 150, max: 400 },
        hierarchy: { min: 150, max: 400 },
        quality: { min: 100, max: 250 },
        cons: { min: 120, max: 300 },
        action: { min: 80, max: 80 },
    };

    const [tableWidth, setTableWidth] = useState(null);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const [hasFittedOnce, setHasFittedOnce] = useState(false);
    const widthsInitializedRef = useRef(false);
    const isResizingRef = useRef(false);
    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);

    const getDisplayColumns = () => showColumns;

    const startColumnResize = (e, columnId) => {
        e.preventDefault();
        e.stopPropagation();

        isResizingRef.current = true;
        resizingColRef.current = columnId;
        resizeStartXRef.current = e.clientX;

        const th = e.target.closest('th');
        const currentWidth =
            columnWidths[columnId] ??
            (th ? th.getBoundingClientRect().width : 150);

        resizeStartWidthRef.current = currentWidth;

        document.addEventListener('mousemove', handleColumnResizeMove);
        document.addEventListener('mouseup', stopColumnResize);
    };

    const handleColumnResizeMove = (e) => {
        const colId = resizingColRef.current;
        if (!colId) return;

        const deltaX = e.clientX - resizeStartXRef.current;
        let newWidth = resizeStartWidthRef.current + deltaX;

        const limits = columnSizeLimits[colId];
        if (limits) {
            if (limits.min != null) newWidth = Math.max(limits.min, newWidth);
            if (limits.max != null) newWidth = Math.min(limits.max, newWidth);
        }

        setColumnWidths(prev => {
            const updated = { ...prev, [colId]: newWidth };

            // recompute the *total* width so the "fit" / "reset" buttons know
            const visibleCols = getDisplayColumns().filter(
                id => typeof updated[id] === "number"
            );

            const totalWidth = visibleCols.reduce(
                (sum, id) => sum + (updated[id] || 0),
                0
            );

            setTableWidth(totalWidth);

            return updated;
        });
    };

    const stopColumnResize = () => {
        document.removeEventListener('mousemove', handleColumnResizeMove);
        document.removeEventListener('mouseup', stopColumnResize);

        setTimeout(() => {
            isResizingRef.current = false;
        }, 0);

        resizingColRef.current = null;
    };

    useEffect(() => {
        if (widthsInitializedRef.current) return;
        if (!scrollerRef.current) return;

        const wrapperEl = scrollerRef.current;
        const wWidth = wrapperEl.clientWidth;
        if (!wWidth) return;

        const displayColumns = getDisplayColumns();

        const totalWidth = displayColumns.reduce((sum, colId) => {
            const w = columnWidths[colId];
            return sum + (typeof w === "number" ? w : 0);
        }, 0);

        if (!totalWidth) return;

        const factor = wWidth / totalWidth;

        setColumnWidths(prev => {
            const updated = { ...prev };
            displayColumns.forEach(colId => {
                const w = prev[colId];
                if (typeof w === "number") {
                    updated[colId] = Math.round(w * factor);
                }
            });
            return updated;
        });

        setWrapperWidth(wrapperEl.getBoundingClientRect().width);
        setTableWidth(wWidth);
        setHasFittedOnce(true);

        widthsInitializedRef.current = true;
    }, [showColumns, columnWidths]);

    const fitTableToWidth = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof columnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => columnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);

        // Only grow when table narrower than wrapper
        if (totalWidth >= wrapperWidth) {
            setTableWidth(totalWidth);
            return;
        }

        const scale = wrapperWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);
        newWidths = newWidths.map(w => Math.round(w));

        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            newWidths[i % newWidths.length] += diff > 0 ? 1 : -1;
            diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidth);
        setWrapperWidth(wrapperWidth);
    };

    const resetColumnWidths = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;

        const wrapperWidth = wrapper.getBoundingClientRect().width;
        if (!wrapperWidth) return;

        const visibleCols = getDisplayColumns().filter(
            id => typeof initialColumnWidths[id] === "number"
        );
        if (!visibleCols.length) return;

        const prevWidths = visibleCols.map(id => initialColumnWidths[id]);
        const totalWidth = prevWidths.reduce((a, b) => a + b, 0);
        if (!totalWidth) return;

        const scale = wrapperWidth / totalWidth;
        let newWidths = prevWidths.map(w => w * scale);
        newWidths = newWidths.map(w => Math.round(w));

        let diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) {
            const idx = i % newWidths.length;
            newWidths[idx] += diff > 0 ? 1 : -1;
            diff = wrapperWidth - newWidths.reduce((s, w) => s + w, 0);
            i++;
        }

        setColumnWidths(prev => {
            const updated = { ...prev };
            visibleCols.forEach((id, index) => {
                updated[id] = newWidths[index];
            });
            return updated;
        });

        setTableWidth(wrapperWidth);
        setWrapperWidth(wrapperWidth);
    };

    const isTableFitted =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        Math.abs(tableWidth - wrapperWidth) <= 1;

    const showFitButton =
        hasFittedOnce &&
        wrapperWidth > 0 &&
        tableWidth != null &&
        tableWidth < wrapperWidth - 1;

    const showResetButton =
        hasFittedOnce && !isTableFitted;

    useEffect(() => {
        if (!hasFittedOnce) return;
        fitTableToWidth();
    }, [isSidebarVisible, showColumns]);

    return (
        <div className="risk-control-attributes-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>
                    <div className="button-container-create">

                        {canIn(access, "RMS", ["systemAdmin", "contributor"]) && (
                            <button className="but-um" onClick={openAddControl}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faCirclePlus} className="button-logo-custom" />
                                    <span className="button-text">Add Control</span>
                                </div>
                            </button>
                        )}
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/controlAttributes.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{`Manage Controls`}</p>
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

            <div className="main-box-risk-control-attributes">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper">
                        <label className="risk-control-label">Manage Controls</label>

                        <FontAwesomeIcon
                            icon={faSearch}
                            title="Search"
                            className="top-right-button-control-att"
                            onClick={handleSearchClick}
                        />

                        <FontAwesomeIcon
                            icon={faDownload}
                            title="Download Excel"
                            className="top-right-button-control-att-2"
                            onClick={handleDownload}
                        />

                        <FontAwesomeIcon
                            icon={faTableColumns}
                            title="Show / Hide Columns"
                            className="top-right-button-control-att-3"
                            onClick={() => setShowColumnSelector(prev => !prev)}
                        />

                        {showResetButton && (
                            <FontAwesomeIcon
                                icon={faArrowsRotate}
                                title="Reset column widths"
                                className={showFitButton ? "top-right-button-control-att-4" : "top-right-button-control-att-4"}
                                onClick={resetColumnWidths}
                            />
                        )}

                        {searchPopupVisible && (
                            <div className="search-popup-rca">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    placeholder="Search control name."
                                    className="search-popup-input-rca"
                                />
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    className="search-popup-close-rca"
                                    onClick={handleCloseSearch}
                                />
                            </div>
                        )}

                        {showColumnSelector && (
                            <div className="column-selector-popup" onMouseDown={e => e.stopPropagation()}>
                                <div className="column-selector-header">
                                    <h4>Select Columns</h4>
                                    <button
                                        className="close-popup-btn"
                                        type="button"
                                        onClick={() => setShowColumnSelector(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="column-selector-content">
                                    <p className="column-selector-note">Select columns to display</p>

                                    <div className="select-all-container">
                                        <label className="select-all-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={areAllColumnsSelected()}
                                                onChange={(e) => toggleAllColumns(e.target.checked)}
                                            />
                                            <span className="select-all-text">Select All</span>
                                        </label>
                                    </div>

                                    <div
                                        className="column-checkbox-container"
                                    >
                                        {availableColumns.map(column => (
                                            <div className="column-checkbox-item" key={column.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(column.id)}
                                                        disabled={column.id === 'nr' || column.id === 'action'}
                                                        onChange={() => toggleColumn(column.id)}
                                                    />
                                                    <span>{column.title}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="column-selector-footer">
                                        <p>{showColumns.length} columns selected</p>
                                        <button
                                            className="apply-columns-btn"
                                            type="button"
                                            onClick={() => setShowColumnSelector(false)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="table-scroll-wrapper-attributes-controls" ref={scrollerRef}>
                        <table className={`${isSidebarVisible ? `risk-control-attributes-table` : `risk-control-attributes-table-ws`}`}>
                            <thead className="risk-control-attributes-head">
                                <tr>
                                    {visibleIdentificationColumns.length > 0 && (
                                        <th
                                            colSpan={visibleIdentificationColumns.length}
                                            className="risk-control-attributes-split"
                                        >
                                            Control Identification
                                        </th>
                                    )}
                                    {visibleCerColumns.length > 0 && (
                                        <th
                                            colSpan={visibleCerColumns.length}
                                            className="risk-control-attributes-th"
                                        >
                                            Control Effectiveness Rating (CER)
                                        </th>
                                    )}
                                    {showColumns.includes("action") && (
                                        <th
                                            className="risk-control-attributes-action"
                                            rowSpan={2}
                                            style={{
                                                position: "relative",
                                                width: columnWidths.action
                                                    ? `${columnWidths.action}px`
                                                    : undefined,
                                                minWidth: columnSizeLimits.action?.min,
                                                maxWidth: columnSizeLimits.action?.max,
                                            }}
                                        >
                                            <span>Action</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={(e) => startColumnResize(e, "action")}
                                            />
                                        </th>
                                    )}
                                </tr>
                                <tr>
                                    {showColumns.includes("nr") && (
                                        <th
                                            className="risk-control-attributes-nr"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.nr ? `${columnWidths.nr}px` : undefined,
                                                minWidth: columnSizeLimits.nr?.min,
                                                maxWidth: columnSizeLimits.nr?.max,
                                            }}
                                        >
                                            <span>Nr</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "nr")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("control") && (
                                        <th
                                            className="risk-control-attributes-control"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.control ? `${columnWidths.control}px` : undefined,
                                                minWidth: columnSizeLimits.control?.min,
                                                maxWidth: columnSizeLimits.control?.max,
                                            }}
                                        >
                                            <span>Control</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "control")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("description") && (
                                        <th
                                            className="risk-control-attributes-description"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.description ? `${columnWidths.description}px` : undefined,
                                                minWidth: columnSizeLimits.description?.min,
                                                maxWidth: columnSizeLimits.description?.max,
                                            }}
                                        >
                                            <span>Control Description</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "description")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("performance") && (
                                        <th
                                            className="risk-control-attributes-perf"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.performance ? `${columnWidths.performance}px` : undefined,
                                                minWidth: columnSizeLimits.performance?.min,
                                                maxWidth: columnSizeLimits.performance?.max,
                                            }}
                                        >
                                            <span>Performance Requirements &amp; Verification</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "performance")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("critical") && (
                                        <th
                                            className="risk-control-attributes-critcal"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.critical ? `${columnWidths.critical}px` : undefined,
                                                minWidth: columnSizeLimits.critical?.min,
                                                maxWidth: columnSizeLimits.critical?.max,
                                            }}
                                        >
                                            <span>Critical Control</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "critical")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("act") && (
                                        <th
                                            className="risk-control-attributes-act"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.act ? `${columnWidths.act}px` : undefined,
                                                minWidth: columnSizeLimits.act?.min,
                                                maxWidth: columnSizeLimits.act?.max,
                                            }}
                                        >
                                            <span>Act, Object or System</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "act")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("activation") && (
                                        <th
                                            className="risk-control-attributes-activation"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.activation ? `${columnWidths.activation}px` : undefined,
                                                minWidth: columnSizeLimits.activation?.min,
                                                maxWidth: columnSizeLimits.activation?.max,
                                            }}
                                        >
                                            <span>Control Activation (Pre or Post Unwanted Event)</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "activation")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("hierarchy") && (
                                        <th
                                            className="risk-control-attributes-hiearchy"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.hierarchy ? `${columnWidths.hierarchy}px` : undefined,
                                                minWidth: columnSizeLimits.hierarchy?.min,
                                                maxWidth: columnSizeLimits.hierarchy?.max,
                                            }}
                                        >
                                            <span>Hierarchy of Controls</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "hierarchy")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("quality") && (
                                        <th
                                            className="risk-control-attributes-quality"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.quality ? `${columnWidths.quality}px` : undefined,
                                                minWidth: columnSizeLimits.quality?.min,
                                                maxWidth: columnSizeLimits.quality?.max,
                                            }}
                                        >
                                            <span>Control Quality</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "quality")}
                                            />
                                        </th>
                                    )}

                                    {showColumns.includes("cons") && (
                                        <th
                                            className="risk-control-attributes-cons"
                                            style={{
                                                position: "relative",
                                                width: columnWidths.cons ? `${columnWidths.cons}px` : undefined,
                                                minWidth: columnSizeLimits.cons?.min,
                                                maxWidth: columnSizeLimits.cons?.max,
                                            }}
                                        >
                                            <span>Main Consequence Addressed</span>
                                            <div
                                                className="rca-col-resizer"
                                                onMouseDown={e => startColumnResize(e, "cons")}
                                            />
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody
                                ref={tbodyRef}
                                onPointerDown={onRowPointerDown}
                                onPointerMove={onRowPointerMove}
                                onPointerUp={endRowDrag}
                                onPointerCancel={endRowDrag}
                                onDragStart={onNativeDragStart}
                            >
                                {filteredControls.map((row, index) => (
                                    <tr className="table-scroll-wrapper-attributes-controls" key={index}>
                                        {showColumns.includes("nr") && (
                                            <td className="procCent" style={{ fontSize: "14px" }}>
                                                {index + 1}
                                            </td>
                                        )}

                                        {showColumns.includes("control") && (
                                            <td style={{ fontSize: "14px" }}>{row.control}</td>
                                        )}

                                        {showColumns.includes("description") && (
                                            <td style={{ fontSize: "14px" }}>{row.description}</td>
                                        )}

                                        {showColumns.includes("performance") && (
                                            <td style={{ fontSize: "14px" }}>{row.performance}</td>
                                        )}

                                        {showColumns.includes("critical") && (
                                            <td
                                                className={`${row.critical === "Yes"
                                                    ? "procCent cea-table-page-critical"
                                                    : "procCent"
                                                    }`}
                                                style={{ fontSize: "14px" }}
                                            >
                                                {row.critical}
                                            </td>
                                        )}

                                        {showColumns.includes("act") && (
                                            <td className="procCent" style={{ fontSize: "14px" }}>
                                                {row.act}
                                            </td>
                                        )}

                                        {showColumns.includes("activation") && (
                                            <td style={{ fontSize: "14px" }}>{row.activation}</td>
                                        )}

                                        {showColumns.includes("hierarchy") && (
                                            <td style={{ fontSize: "14px" }}>{row.hierarchy}</td>
                                        )}

                                        {showColumns.includes("quality") && (
                                            <td style={{ fontSize: "14px" }}>{row.quality}</td>
                                        )}

                                        {showColumns.includes("cons") && (
                                            <td style={{ fontSize: "14px" }}>{row.cons}</td>
                                        )}

                                        {showColumns.includes("action") && (
                                            <td className="risk-control-attributes-action-cell">
                                                <button
                                                    type="button"
                                                    className="rca-action-btn"
                                                    onClick={() => openModifyControl(row)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {addControl && (<AddControlPopup onClose={closeAddControl} />)}
            {modifyControl && (<EditControlPopup onClose={closeModifyControl} data={modifyingControl} />)}
            <ToastContainer />
        </div >
    );
};

export default ControlAttributes;