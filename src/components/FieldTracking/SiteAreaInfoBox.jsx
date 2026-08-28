import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

const SiteAreaInfoBox = ({
    collapsible = false,
    formData,
    setFormData,
    error,
    setErrors,
    readOnly = false,
    noOptions = false,
    // "create" | "template" | "assignment". On "template" (the Template
    // Preview view) Site/Main Area/Sub Area stay visible and interactive
    // (whatever the Work Order Basis is) but never write to formData - only
    // "create" and "assignment" commit changes. Which of Main/Sub Area is
    // disabled is unrelated to viewMode - it always follows the Work Order
    // Basis (asset based -> disabled), the same in all three views - so on
    // "assignment" a field that isn't disabled behaves exactly like it does
    // on "create".
    viewMode = "create",
    // Names of formData keys that must stay non-interactive regardless of
    // the Work Order Basis. Used by WorkOrderAssignment to lock fields
    // that already held a value when the assignment popup was opened.
    // Empty by default everywhere else, so this has no effect unless a
    // caller explicitly passes it.
    lockedFields = []
}) => {
    const commitChanges = viewMode !== "template";
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;

    // Site dropdown options - same route RiskManagementPageBLRA.js uses to
    // build its site suggestions.
    const [siteOptions, setSiteOptions] = useState([]);
    const [loadingSites, setLoadingSites] = useState(true);
    const [editAllowed, setEditAllowed] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchSites = async () => {
            try {
                setLoadingSites(true);
                const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/sites`);
                if (!response.ok) throw new Error("Failed to fetch values");
                const data = await response.json();

                if (isMounted) {
                    const allSites = (data.sites || []).map(s => s.site).filter(Boolean);

                    // Keep "Other" out of the alphabetical sort and always
                    // place it last, wherever it happened to be in the source data.
                    const otherSites = allSites.filter(s => s.toLowerCase() === "other");
                    const sortedSites = allSites
                        .filter(s => s.toLowerCase() !== "other")
                        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                    setSiteOptions([...sortedSites, ...otherSites]);
                }
            } catch (err) {
                console.error("Error fetching sites:", err);
            } finally {
                if (isMounted) setLoadingSites(false);
            }
        };

        fetchSites();

        return () => {
            isMounted = false;
        };
    }, []);

    // Main/Sub Area typable dropdowns - same lookup route and behaviour as IBRAPopup
    const [groupedAreas, setGroupedAreas] = useState({}); // { MainArea: [subAreas...] }
    const [mainAreas, setMainAreas] = useState([]);

    const [filteredMainAreas, setFilteredMainAreas] = useState([]);
    const [showMainAreasDropdown, setShowMainAreasDropdown] = useState(false);
    const mainAreasInputRef = useRef(null);

    const [filteredSubAreas, setFilteredSubAreas] = useState([]);
    const [showSubAreasDropdown, setShowSubAreasDropdown] = useState(false);
    const subAreasInputRef = useRef(null);

    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const clearErrorOnFocus = () => {
        if (error) {
            setErrors(prev => ({ ...prev, siteAreaDetails: false }));
        }
    };

    const isLocked = (field) => lockedFields.includes(field);

    // Same lookup route IBRAPopup uses to build { mainArea: [subAreas] }
    useEffect(() => {
        async function fetchValues() {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/getValues`);
                if (!res.ok) throw new Error('Failed to fetch lookup data');
                const { areas } = await res.json();

                const lookup = {};
                (areas || []).forEach(({ mainArea, subAreas }) => {
                    lookup[mainArea] = subAreas;
                });

                setGroupedAreas(lookup);
                setMainAreas(Object.keys(lookup));
            } catch (err) {
                console.error("Error fetching areas:", err);
            }
        }
        fetchValues();
    }, []);

    // Close the floating dropdowns on outside click / page scroll, same as IBRAPopup
    useEffect(() => {
        const popupSelector = '.floating-dropdown';

        const closeDropdowns = () => {
            setShowMainAreasDropdown(false);
            setShowSubAreasDropdown(false);
        };

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('textarea');
            if (outside) closeDropdowns();
        };

        const handleScroll = (e) => {
            if (e.target.closest('textarea, input')) return;
            if (e.target.closest(popupSelector)) return;
            closeDropdowns();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const positionDropdown = (el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setDropdownPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
            width: rect.width
        });
    };

    const handleSiteChange = (value) => {
        if (!commitChanges || isLocked("site")) return;
        setFormData(prev => ({ ...prev, site: value }));
    };

    const handleMainAreaInput = (value) => {
        if (commitChanges && !isLocked("mainArea")) {
            setFormData(prev => ({ ...prev, mainArea: value }));
        }
        setShowSubAreasDropdown(false);

        const matches = noOptions
            ? []
            : mainAreas.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredMainAreas(matches);
        setShowMainAreasDropdown(true);
        positionDropdown(mainAreasInputRef.current);
    };

    const handleMainAreaFocus = () => {
        if (editAllowed) return;
        if (readOnly) return;
        if (isLocked("mainArea")) return;
        clearErrorOnFocus();
        setShowSubAreasDropdown(false);
        setFilteredMainAreas(noOptions ? [] : mainAreas);
        setShowMainAreasDropdown(true);
        positionDropdown(mainAreasInputRef.current);
    };

    const selectMainAreaSuggestion = (value) => {
        if (!commitChanges || isLocked("mainArea")) {
            setShowMainAreasDropdown(false);
            return;
        }
        setFormData(prev => ({ ...prev, mainArea: value }));
        setShowMainAreasDropdown(false);
    };

    const handleSubAreaInput = (value) => {
        if (commitChanges && !isLocked("subArea")) {
            setFormData(prev => ({ ...prev, subArea: value }));
        }
        setShowMainAreasDropdown(false);

        if (noOptions) {
            setFilteredSubAreas([]);
            setShowSubAreasDropdown(true);
            positionDropdown(subAreasInputRef.current);
            return;
        }

        const currentMainArea = formData.mainArea;
        const options = (currentMainArea && groupedAreas[currentMainArea])
            ? groupedAreas[currentMainArea]
            : Object.values(groupedAreas).flat();

        const matches = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredSubAreas(matches);
        setShowSubAreasDropdown(true);
        positionDropdown(subAreasInputRef.current);
    };

    const handleSubAreaFocus = () => {
        if (editAllowed) return;
        if (readOnly) return;
        if (isLocked("subArea")) return;
        clearErrorOnFocus();
        setShowMainAreasDropdown(false);

        if (noOptions) {
            setFilteredSubAreas([]);
            setShowSubAreasDropdown(true);
            positionDropdown(subAreasInputRef.current);
            return;
        }

        const currentMainArea = formData.mainArea;
        const matches = (currentMainArea && groupedAreas[currentMainArea])
            ? groupedAreas[currentMainArea]
            : Object.values(groupedAreas).flat();

        setFilteredSubAreas(matches);
        setShowSubAreasDropdown(true);
        positionDropdown(subAreasInputRef.current);
    };

    const selectSubAreaSuggestion = (value) => {
        if (!commitChanges || isLocked("subArea")) {
            setShowSubAreasDropdown(false);
            return;
        }
        setFormData(prev => ({ ...prev, subArea: value }));
        setShowSubAreasDropdown(false);
    };

    useEffect(() => {
        const isAssetBased =
            String(formData.workOrderBases || "").toLowerCase() === "assetbased";

        setEditAllowed(isAssetBased);
    }, [formData.workOrderBases]);

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`}>
                <h3 className="font-fam-labels">Area Information <span className="required-field">*</span></h3>

                {collapsible && (<button
                    className="top-right-button-ibra"
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>)}

                {(!isCollapsed) && (
                    <table className="table-borders-jra-info" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "25%" }} />
                            <col />
                        </colgroup>
                        <tbody>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Site
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.site || ""}
                                            onChange={e => handleSiteChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingSites || isLocked("site")}
                                            style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                        >
                                            <option value="">
                                                {loadingSites ? "Loading..." : "Select Site"}
                                            </option>
                                            {!noOptions && siteOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Main Area
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="ibra-popup-page-select-container">
                                        <textarea
                                            ref={mainAreasInputRef}
                                            className="jra-info-popup-page-textarea-new"
                                            value={formData.mainArea || ""}
                                            placeholder="Select Main Area"
                                            onChange={e => handleMainAreaInput(e.target.value)}
                                            onFocus={handleMainAreaFocus}
                                            readOnly={readOnly}
                                            style={{
                                                resize: "none",
                                                color: (readOnly || editAllowed || isLocked("mainArea")) ? "gray" : "black",
                                            }}
                                            disabled={editAllowed || isLocked("mainArea")}
                                        />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Sub Area
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="ibra-popup-page-select-container">
                                        <textarea
                                            ref={subAreasInputRef}
                                            className="jra-info-popup-page-textarea-new"
                                            value={formData.subArea || ""}
                                            placeholder="Select Sub Area"
                                            onChange={e => handleSubAreaInput(e.target.value)}
                                            onFocus={handleSubAreaFocus}
                                            readOnly={readOnly}
                                            style={{
                                                resize: "none",
                                                color: (readOnly || editAllowed || isLocked("subArea")) ? "gray" : "black",
                                            }}
                                            disabled={editAllowed || isLocked("subArea")}
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            {showMainAreasDropdown && filteredMainAreas.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {(() => {
                        const unique = [...new Set(filteredMainAreas)].filter(Boolean);
                        const other = unique.filter(t => t.toLowerCase() === "other");
                        const rest = unique
                            .filter(t => t.toLowerCase() !== "other")
                            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                        return [...rest, ...other];
                    })().map((term) => (
                        <li
                            key={term}
                            onMouseDown={() => selectMainAreaSuggestion(term)}
                            style={{ fontSize: "14px" }}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {showSubAreasDropdown && filteredSubAreas.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {(() => {
                        const unique = [...new Set(filteredSubAreas)].filter(Boolean);
                        const other = unique.filter(t => t.toLowerCase() === "other");
                        const rest = unique
                            .filter(t => t.toLowerCase() !== "other")
                            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                        return [...rest, ...other];
                    })().map((term) => (
                        <li
                            key={term}
                            onMouseDown={() => selectSubAreaSuggestion(term)}
                            style={{ fontSize: "14px" }}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SiteAreaInfoBox;