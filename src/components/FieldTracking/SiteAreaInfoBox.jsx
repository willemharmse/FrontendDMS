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
    noOptions = false
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;

    // Site dropdown options - same route RiskManagementPageBLRA.js uses to
    // build its site suggestions.
    const [siteOptions, setSiteOptions] = useState([]);
    const [loadingSites, setLoadingSites] = useState(true);

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
        setFormData(prev => ({ ...prev, site: value }));
    };

    const handleMainAreaInput = (value) => {
        setFormData(prev => ({ ...prev, mainArea: value }));
        setShowSubAreasDropdown(false);

        const matches = noOptions
            ? []
            : mainAreas.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredMainAreas(matches);
        setShowMainAreasDropdown(true);
        positionDropdown(mainAreasInputRef.current);
    };

    const handleMainAreaFocus = () => {
        if (readOnly) return;
        clearErrorOnFocus();
        setShowSubAreasDropdown(false);
        setFilteredMainAreas(noOptions ? [] : mainAreas);
        setShowMainAreasDropdown(true);
        positionDropdown(mainAreasInputRef.current);
    };

    const selectMainAreaSuggestion = (value) => {
        setFormData(prev => ({ ...prev, mainArea: value }));
        setShowMainAreasDropdown(false);
    };

    const handleSubAreaInput = (value) => {
        setFormData(prev => ({ ...prev, subArea: value }));
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
        if (readOnly) return;
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
        setFormData(prev => ({ ...prev, subArea: value }));
        setShowSubAreasDropdown(false);
    };

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`}>
                <h3 className="font-fam-labels">Site and Area Information <span className="required-field">*</span></h3>

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
                                            disabled={readOnly || loadingSites}
                                            style={{ fontSize: "14px" }}
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
                                            className="jra-info-popup-page-textarea"
                                            value={formData.mainArea || ""}
                                            placeholder="Select Main Area"
                                            onChange={e => handleMainAreaInput(e.target.value)}
                                            onFocus={handleMainAreaFocus}
                                            readOnly={readOnly}
                                            style={{ resize: "none" }}
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
                                            className="jra-info-popup-page-textarea"
                                            value={formData.subArea || ""}
                                            placeholder="Select Sub Area"
                                            onChange={e => handleSubAreaInput(e.target.value)}
                                            onFocus={handleSubAreaFocus}
                                            readOnly={readOnly}
                                            style={{ resize: "none" }}
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