import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faEraser, faTimes, faDownload, faCaretLeft, faCaretRight, faTableColumns } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { saveAs } from "file-saver";
import TopBar from "../Notifications/TopBar";
import "./ControlAttributes.css";

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
    const scrollerRef = useRef(null);   // the horizontal scroller (wrapper div)
    const tbodyRef = useRef(null);      // to listen for row pointer events
    const drag = useRef({ active: false, startX: 0, startLeft: 0 });

    const onNativeDragStart = (e) => {
        // Kill native drag/ghost image that can fade elements
        e.preventDefault();
    };

    const onRowPointerDown = (e) => {
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
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    // 'Authorization': `Bearer ${token}` // Uncomment and fill in the token if needed
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            setControls(data.controls);
            setFilteredControls(data.controls);
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
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const allColumnIds = availableColumns.map(c => c.id);

    const toggleColumn = (columnId) => {
        // Never allow Nr to be hidden
        if (columnId === "nr") return;

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
            setShowColumns(["nr"]);
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
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/controlAttributes.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{`View Controls`}</p>
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
                        <label className="risk-control-label">View Controls</label>

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
                                                        disabled={column.id === 'nr'}
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
                                </tr>
                                <tr>
                                    {showColumns.includes("nr") && (
                                        <th className="risk-control-attributes-nr">Nr</th>
                                    )}
                                    {showColumns.includes("control") && (
                                        <th className="risk-control-attributes-control">Control</th>
                                    )}
                                    {showColumns.includes("description") && (
                                        <th className="risk-control-attributes-description">Control Description</th>
                                    )}
                                    {showColumns.includes("performance") && (
                                        <th className="risk-control-attributes-perf">
                                            Performance Requirements &amp; Verification
                                        </th>
                                    )}
                                    {showColumns.includes("critical") && (
                                        <th className="risk-control-attributes-critcal">Critical Control</th>
                                    )}
                                    {showColumns.includes("act") && (
                                        <th className="risk-control-attributes-act">Act, Object or System</th>
                                    )}
                                    {showColumns.includes("activation") && (
                                        <th className="risk-control-attributes-activation">
                                            Control Activation (Pre or Post Unwanted Event)
                                        </th>
                                    )}
                                    {showColumns.includes("hierarchy") && (
                                        <th className="risk-control-attributes-hiearchy">Hierarchy of Controls</th>
                                    )}
                                    {showColumns.includes("quality") && (
                                        <th className="risk-control-attributes-quality">Control Quality</th>
                                    )}
                                    {showColumns.includes("cons") && (
                                        <th className="risk-control-attributes-cons">Main Consequence Addressed</th>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ControlAttributes;