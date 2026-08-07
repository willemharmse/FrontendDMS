import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

const ManagementInfoBox = ({
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

    // All three fields below (Accountable Level, Person in Charge, Minimum
    // Team/Task Executors) share the same options - the same "person"
    // designations list IntroTaskInfo.jsx's "Person in Charge of Work"
    // field builds from GET /api/riskInfo/desgntions.
    const [personOptions, setPersonOptions] = useState([]);
    const [loadingPersonOptions, setLoadingPersonOptions] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchDesignations = async () => {
            try {
                setLoadingPersonOptions(true);
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/desgntions`);
                if (!res.ok) throw new Error("Failed to fetch designations");
                const data = await res.json();

                if (isMounted) {
                    const allPositions = Array.from(
                        new Set((data.designations || []).map(d => d.person).filter(Boolean))
                    );

                    // Keep "Other" out of the alphabetical sort and always
                    // place it last, wherever it happened to be in the source data.
                    const otherPositions = allPositions.filter(p => p.toLowerCase() === "other");
                    const sortedPositions = allPositions
                        .filter(p => p.toLowerCase() !== "other")
                        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                    setPersonOptions([...sortedPositions, ...otherPositions]);
                }
            } catch (err) {
                console.error("Error fetching designations:", err);
            } finally {
                if (isMounted) setLoadingPersonOptions(false);
            }
        };

        fetchDesignations();

        return () => {
            isMounted = false;
        };
    }, []);

    // Person in Charge - typeable dropdown (same behaviour as Main/Sub Area in SiteAreaInfoBox)
    const [filteredPeople, setFilteredPeople] = useState([]);
    const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
    const personInChargeInputRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Minimum Team / Task Executors - multiselect popup (same pattern as FileInfo's excel-style column filter)
    const [showExecutorsPopup, setShowExecutorsPopup] = useState(false);
    const [executorsSearch, setExecutorsSearch] = useState("");
    const [tempSelectedExecutors, setTempSelectedExecutors] = useState(new Set());
    const [executorsPopupPosition, setExecutorsPopupPosition] = useState({ top: 0, left: 0, width: 0 });
    const executorsTriggerRef = useRef(null);
    const executorsPopupRef = useRef(null);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const clearErrorOnFocus = () => {
        if (error) {
            setErrors(prev => ({ ...prev, managementDetails: false }));
        }
    };

    const positionDropdown = (el, setter) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setter({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
            width: rect.width
        });
    };

    // --- Accountable Level (plain dropdown) ---
    const handleAccountableLevelChange = (value) => {
        setFormData(prev => ({ ...prev, accountableLevel: value }));
    };

    // --- Person in Charge (typeable dropdown) ---
    const handlePersonInChargeInput = (value) => {
        setFormData(prev => ({ ...prev, personInCharge: value }));

        const matches = noOptions
            ? []
            : personOptions.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredPeople(matches);
        setShowPeopleDropdown(true);
        positionDropdown(personInChargeInputRef.current, setDropdownPosition);
    };

    const handlePersonInChargeFocus = () => {
        if (readOnly) return;
        clearErrorOnFocus();
        setFilteredPeople(noOptions ? [] : personOptions);
        setShowPeopleDropdown(true);
        positionDropdown(personInChargeInputRef.current, setDropdownPosition);
    };

    const selectPersonInChargeSuggestion = (value) => {
        setFormData(prev => ({ ...prev, personInCharge: value }));
        setShowPeopleDropdown(false);
    };

    // --- Minimum Team / Task Executors (multiselect) ---
    const selectedExecutors = formData.minTeamExecutors || [];

    const openExecutorsPopup = () => {
        if (readOnly) return;
        clearErrorOnFocus();
        setTempSelectedExecutors(new Set(selectedExecutors));
        setExecutorsSearch("");
        setShowExecutorsPopup(true);
        positionDropdown(executorsTriggerRef.current, setExecutorsPopupPosition);
    };

    const visibleExecutorOptions = noOptions
        ? []
        : personOptions.filter(opt => opt.toLowerCase().includes(executorsSearch.toLowerCase()));

    const isAllVisibleSelected =
        visibleExecutorOptions.length > 0 && visibleExecutorOptions.every(opt => tempSelectedExecutors.has(opt));

    const toggleAllExecutors = (checked) => {
        setTempSelectedExecutors(prev => {
            const next = new Set(prev);
            if (checked) {
                visibleExecutorOptions.forEach(opt => next.add(opt));
            } else {
                visibleExecutorOptions.forEach(opt => next.delete(opt));
            }
            return next;
        });
    };

    const toggleExecutor = (opt) => {
        setTempSelectedExecutors(prev => {
            const next = new Set(prev);
            if (next.has(opt)) next.delete(opt);
            else next.add(opt);
            return next;
        });
    };

    const applyExecutorsSelection = () => {
        setFormData(prev => ({ ...prev, minTeamExecutors: Array.from(tempSelectedExecutors) }));
        setShowExecutorsPopup(false);
    };

    const cancelExecutorsSelection = () => {
        setShowExecutorsPopup(false);
    };

    // Close open dropdowns/popups on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                showPeopleDropdown &&
                !e.target.closest('.floating-dropdown') &&
                !e.target.closest('input')
            ) {
                setShowPeopleDropdown(false);
            }

            if (
                showExecutorsPopup &&
                !e.target.closest('.excel-filter-popup') &&
                !e.target.closest('.jra-info-multiselect-trigger')
            ) {
                setShowExecutorsPopup(false);
            }
        };

        const handleScroll = (e) => {
            if (
                showPeopleDropdown &&
                !e.target.closest('.floating-dropdown') &&
                !e.target.closest('input')
            ) {
                setShowPeopleDropdown(false);
            }

            if (
                showExecutorsPopup &&
                !e.target.closest('.excel-filter-popup') &&
                !e.target.closest('.jra-info-multiselect-trigger')
            ) {
                setShowExecutorsPopup(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showPeopleDropdown, showExecutorsPopup]);

    return (
        <div className="input-row">
            <div className={`input-box-ref ${error ? 'error-create' : ''}`}>
                <h3 className="font-fam-labels">Management Level and RACI Information <span className="required-field">*</span></h3>

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
                                    Level Allocated for Management in CTS / Accountable Level
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.accountableLevel || ""}
                                            onChange={e => handleAccountableLevelChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingPersonOptions}
                                            style={{ fontSize: "14px" }}
                                        >
                                            <option value="">
                                                {loadingPersonOptions ? "Loading..." : "Select Accountable Level"}
                                            </option>
                                            {!noOptions && personOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Person in Charge
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div className="ibra-popup-page-select-container">
                                        <textarea
                                            ref={personInChargeInputRef}
                                            className="jra-info-popup-page-textarea"
                                            value={formData.personInCharge || ""}
                                            placeholder="Select Person in Charge"
                                            onChange={e => handlePersonInChargeInput(e.target.value)}
                                            onFocus={handlePersonInChargeFocus}
                                            readOnly={readOnly}
                                            style={{ resize: "none" }}
                                        />
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Minimum Team / Task Executors
                                    <span className="required-field" title="Required"> *</span>
                                </th>
                                <td>
                                    <div
                                        ref={executorsTriggerRef}
                                        className="jra-info-popup-page-select-container jra-info-multiselect-trigger"
                                        onClick={openExecutorsPopup}
                                        style={{ cursor: readOnly ? "default" : "pointer" }}
                                    >
                                        <div className="table-control font-fam remove-default-styling"
                                            style={{ fontSize: "14px" }}>
                                            {selectedExecutors.length > 0
                                                ? selectedExecutors.join(", ")
                                                : "Select Minimum Team / Task Executors"}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            {showPeopleDropdown && filteredPeople.length > 0 && (
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
                        const unique = [...new Set(filteredPeople)].filter(Boolean);
                        const other = unique.filter(t => t.toLowerCase() === "other");
                        const rest = unique
                            .filter(t => t.toLowerCase() !== "other")
                            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
                        return [...rest, ...other];
                    })().map((term) => (
                        <li
                            key={term}
                            onMouseDown={() => selectPersonInChargeSuggestion(term)}
                            style={{ fontSize: "14px" }}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {showExecutorsPopup && (
                <div
                    className="excel-filter-popup"
                    ref={executorsPopupRef}
                    style={{
                        position: "fixed",
                        top: executorsPopupPosition.top,
                        left: executorsPopupPosition.left,
                        width: executorsPopupPosition.width,
                        zIndex: 9999,
                    }}
                >
                    <input
                        type="text"
                        className="excel-filter-search"
                        placeholder="Search"
                        value={executorsSearch}
                        style={{ fontSize: "14px" }}
                        onChange={(e) => setExecutorsSearch(e.target.value)}
                    />

                    <div className="excel-filter-list">
                        <label className="excel-filter-item">
                            <span className="excel-filter-checkbox">
                                <input
                                    type="checkbox"
                                    className="checkbox-excel-attend"
                                    checked={isAllVisibleSelected}
                                    onChange={(e) => toggleAllExecutors(e.target.checked)}
                                />
                            </span>
                            {executorsSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                        </label>

                        {visibleExecutorOptions.map(opt => (
                            <label className="excel-filter-item" key={opt}>
                                <span className="excel-filter-checkbox">
                                    <input
                                        type="checkbox"
                                        className="checkbox-excel-attend"
                                        checked={tempSelectedExecutors.has(opt)}
                                        onChange={() => toggleExecutor(opt)}
                                    />
                                </span>
                                <span className="excel-filter-text"
                                    style={{ fontSize: "14px" }}>{opt}</span>
                            </label>
                        ))}

                        {visibleExecutorOptions.length === 0 && (
                            <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "14px" }}>
                                No matches found
                            </div>
                        )}
                    </div>

                    <div className="excel-filter-actions">
                        <button type="button" className="excel-filter-btn" onClick={applyExecutorsSelection}>Apply</button>
                        <button type="button" className="excel-filter-btn-cnc" onClick={cancelExecutorsSelection}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagementInfoBox;