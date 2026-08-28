import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
    faCheck,
    faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import DatePicker from 'react-multi-date-picker';

const NOT_APPLICABLE_OPTION = "N/A";

// Same values as the Priority select in AddTaskPopup.jsx.
const PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"];

const ManagementInfoBox = ({
    collapsible = false,
    formData,
    setFormData,
    error,
    setErrors,
    readOnly = false,
    noOptions = false,
    isAssignmentView = false,
    // "create" | "template" | "assignment". On "template" (the Template
    // Preview view) every field in this box stays visible and interactive
    // but must not write to formData - only "create" and "assignment"
    // commit changes. This is unconditional - it does not depend on the
    // Work Order Basis or anything else.
    viewMode = "create",
    // Names of formData keys that must stay non-interactive regardless of
    // viewMode. Used by WorkOrderAssignment to lock fields that already
    // held a value when the assignment popup was opened. Empty by default
    // everywhere else, so this has no effect unless a caller explicitly
    // passes it.
    lockedFields = [],
    required = false
}) => {
    const commitChanges = viewMode !== "template";
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const isViewable = isAssignmentView || viewMode === "template";

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

    // --- Assignment View: Accountable / Responsible person selects ---
    // Only relevant (and only fetched) when isAssignmentView is true. Both
    // lists come from the same "assignable users" endpoint AddTaskPopup.jsx
    // uses for its Responsible Person select. The accountable list is
    // pointed at the same endpoint for now - swap ACCOUNTABLE_USERS_ENDPOINT
    // to the real route once one exists.
    const RESPONSIBLE_USERS_ENDPOINT = `${process.env.REACT_APP_URL}/api/complainceTasks/getUsers/assignable-users`;
    const ACCOUNTABLE_USERS_ENDPOINT = `${process.env.REACT_APP_URL}/api/complainceTasks/getUsers/assignable-users`;

    const [responsibleUsers, setResponsibleUsers] = useState([]);
    const [loadingResponsibleUsers, setLoadingResponsibleUsers] = useState(false);
    const [accountableUsers, setAccountableUsers] = useState([]);
    const [loadingAccountableUsers, setLoadingAccountableUsers] = useState(false);

    useEffect(() => {
        if (!isViewable) return;
        let isMounted = true;

        const fetchUsersList = async (endpoint, setList, setLoading) => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const res = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch users");
                const data = await res.json();

                if (isMounted) {
                    const sortedUsers = [...(data.users || [])].sort((a, b) =>
                        String(a.username || "").localeCompare(String(b.username || ""), undefined, { sensitivity: "base" })
                    );
                    setList(sortedUsers);
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchUsersList(RESPONSIBLE_USERS_ENDPOINT, setResponsibleUsers, setLoadingResponsibleUsers);
        fetchUsersList(ACCOUNTABLE_USERS_ENDPOINT, setAccountableUsers, setLoadingAccountableUsers);

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isViewable]);

    const handleAccountableIdChange = (value) => {
        if (!commitChanges || isLocked("accountableId")) return;
        setFormData(prev => ({ ...prev, accountableId: value }));
    };

    const handleResponsibleIdChange = (value) => {
        if (!commitChanges || isLocked("responsibleId")) return;
        setFormData(prev => ({ ...prev, responsibleId: value }));
    };

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

    // Executor values typed in by a user via the "add new" row below, rather
    // than coming from the designations list. Seeded from formData so a
    // value typed in a previous session (i.e. loaded back in with a draft)
    // still shows up as a real, checkable option instead of just sitting
    // invisibly inside the selected list.
    const [customExecutorOptions, setCustomExecutorOptions] = useState([]);
    const [newExecutorValue, setNewExecutorValue] = useState("");
    const [newExecutorChecked, setNewExecutorChecked] = useState(true);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const clearErrorOnFocus = () => {
        if (error) {
            setErrors(prev => ({ ...prev, managementDetails: false }));
        }
    };

    const isLocked = (field) => lockedFields.includes(field);

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
        if (!commitChanges || isLocked("accountableLevel")) return;
        setFormData(prev => ({ ...prev, accountableLevel: value }));
    };

    // --- Due Date / Priority (assignment view only) ---
    const handleDueDateChange = (value) => {
        if (!commitChanges || isLocked("dueDate")) return;
        setFormData(prev => ({ ...prev, dueDate: value }));
    };

    const handlePriorityChange = (value) => {
        if (!commitChanges || isLocked("priority")) return;
        setFormData(prev => ({ ...prev, priority: value }));
    };

    // --- Person in Charge (typeable dropdown) ---
    const handlePersonInChargeInput = (value) => {
        if (commitChanges && !isLocked("personInCharge")) {
            setFormData(prev => ({ ...prev, personInCharge: value }));
        }

        const matches = noOptions
            ? []
            : personOptions.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredPeople(matches);
        setShowPeopleDropdown(true);
        positionDropdown(personInChargeInputRef.current, setDropdownPosition);
    };

    const handlePersonInChargeFocus = () => {
        if (readOnly) return;
        if (isLocked("personInCharge")) return;
        clearErrorOnFocus();
        setFilteredPeople(noOptions ? [] : personOptions);
        setShowPeopleDropdown(true);
        positionDropdown(personInChargeInputRef.current, setDropdownPosition);
    };

    const selectPersonInChargeSuggestion = (value) => {
        if (!commitChanges || isLocked("personInCharge")) {
            setShowPeopleDropdown(false);
            return;
        }
        setFormData(prev => ({ ...prev, personInCharge: value }));
        setShowPeopleDropdown(false);
    };

    // --- Minimum Team / Task Executors (multiselect) ---
    const selectedExecutors = formData.minTeamExecutors || [];
    const minTeamExecutorsKey = selectedExecutors.join("|");

    // The designations list ("official" options), or none if this instance
    // is configured with noOptions - custom entries still work either way.
    const baseExecutorOptions = noOptions ? [] : personOptions;
    const baseExecutorOptionsKey = baseExecutorOptions.join("|");

    // Combined pool of real designations + user-typed custom entries.
    // "N/A" is always available for Other Team Members Involved and is
    // kept at the bottom of the list regardless of the other values.
    const allExecutorOptions = useMemo(() => {
        const merged = [...baseExecutorOptions];
        customExecutorOptions.forEach((opt) => {
            if (!merged.some((m) => m.toLowerCase() === opt.toLowerCase())) {
                merged.push(opt);
            }
        });

        const sortedOptions = merged
            .filter((opt) => opt.toLowerCase() !== NOT_APPLICABLE_OPTION.toLowerCase())
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

        return [...sortedOptions, NOT_APPLICABLE_OPTION];
    }, [baseExecutorOptions, customExecutorOptions]);

    // Seed customExecutorOptions with any already-selected value that isn't
    // part of the designations list - this is what makes a value typed in
    // during a previous session show back up as a real option once the
    // draft (and the designations list) has finished loading.
    useEffect(() => {
        if (loadingPersonOptions) return;

        setCustomExecutorOptions((prev) => {
            const known = new Set(
                [...baseExecutorOptions, ...prev, NOT_APPLICABLE_OPTION].map((o) => o.toLowerCase())
            );
            const missing = selectedExecutors.filter(
                (val) => val && !known.has(String(val).toLowerCase())
            );
            if (missing.length === 0) return prev;
            return [...prev, ...missing];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minTeamExecutorsKey, baseExecutorOptionsKey, loadingPersonOptions]);

    const openExecutorsPopup = () => {
        if (readOnly) return;
        if (isLocked("minTeamExecutors")) return;
        clearErrorOnFocus();
        setTempSelectedExecutors(new Set(selectedExecutors));
        setExecutorsSearch("");
        setNewExecutorValue("");
        setNewExecutorChecked(true);
        setShowExecutorsPopup(true);
        positionDropdown(executorsTriggerRef.current, setExecutorsPopupPosition);
    };

    const visibleExecutorOptions = allExecutorOptions.filter(opt =>
        opt.toLowerCase().includes(executorsSearch.toLowerCase())
    );

    // Runs synchronously right after the popup (re)renders, so it can measure
    // its *actual* height (which changes as the list/search/new-item row
    // grow or shrink) and decide whether it still fits below the trigger.
    // If there isn't enough room below but there is above, it flips the
    // popup to open upward instead - otherwise it falls back to opening
    // downward, clamped so it never renders above the top of the viewport.
    useLayoutEffect(() => {
        if (!showExecutorsPopup) return;
        if (!executorsTriggerRef.current || !executorsPopupRef.current) return;

        const triggerRect = executorsTriggerRef.current.getBoundingClientRect();
        const popupHeight = executorsPopupRef.current.getBoundingClientRect().height;
        const margin = 5;

        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        const openUpward = spaceBelow < popupHeight + margin && spaceAbove > spaceBelow;

        const top = openUpward
            ? Math.max(window.scrollY, triggerRect.top + window.scrollY - popupHeight - margin)
            : triggerRect.bottom + window.scrollY + margin;

        setExecutorsPopupPosition({
            top,
            left: triggerRect.left + window.scrollX,
            width: triggerRect.width
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showExecutorsPopup, executorsSearch, tempSelectedExecutors, visibleExecutorOptions.length]);

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

    // Adds whatever's typed in the bottom row to the option list (unless it's
    // a duplicate of an existing one) and, if its checkbox is ticked, selects
    // it right away. Triggered on Enter.
    const addNewExecutorOption = () => {
        const trimmed = newExecutorValue.trim();
        if (!trimmed) return;

        const alreadyExists = allExecutorOptions.some(
            (opt) => opt.toLowerCase() === trimmed.toLowerCase()
        );

        if (!alreadyExists) {
            setCustomExecutorOptions(prev => [...prev, trimmed]);
        }

        setTempSelectedExecutors(prev => {
            const next = new Set(prev);
            if (newExecutorChecked) next.add(trimmed);
            else next.delete(trimmed);
            return next;
        });

        setNewExecutorValue("");
        setNewExecutorChecked(true);
    };

    const handleNewExecutorKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addNewExecutorOption();
        }
    };

    const applyExecutorsSelection = () => {
        const trimmed = newExecutorValue.trim();
        let finalSelected = tempSelectedExecutors;

        if (trimmed !== "") {
            const alreadyExists = allExecutorOptions.some(
                (opt) => opt.toLowerCase() === trimmed.toLowerCase()
            );

            if (!alreadyExists) {
                setCustomExecutorOptions(prev => [...prev, trimmed]);
            }

            finalSelected = new Set(tempSelectedExecutors);
            if (newExecutorChecked) finalSelected.add(trimmed);
            else finalSelected.delete(trimmed);

            setTempSelectedExecutors(finalSelected);
            setNewExecutorValue("");
            setNewExecutorChecked(true);
        }

        if (commitChanges && !isLocked("minTeamExecutors")) {
            setFormData(prev => ({ ...prev, minTeamExecutors: Array.from(finalSelected) }));
        }
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
                <h3 className="font-fam-labels">Work Order Management {required && (<span className="required-field">*</span>)}</h3>

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
                            <col style={{ width: isViewable ? "20%" : "25%" }} />
                            <col />
                            {isViewable && <col style={{ width: "25%" }} />}
                        </colgroup>
                        <tbody>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Accountable Party {required && (<span className="required-field">*</span>)}
                                </th>
                                <td>
                                    <div className="jra-info-popup-page-select-container">
                                        <select
                                            className="table-control font-fam remove-default-styling"
                                            value={formData.accountableLevel || ""}
                                            onChange={e => handleAccountableLevelChange(e.target.value)}
                                            onFocus={clearErrorOnFocus}
                                            disabled={readOnly || loadingPersonOptions || isLocked("accountableLevel")}
                                            style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                        >
                                            <option value="">
                                                {loadingPersonOptions ? "Loading..." : "Select Accountable Party"}
                                            </option>
                                            {!noOptions && personOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </td>
                                {(isViewable) && (
                                    <td>
                                        <div className="jra-info-popup-page-select-container">
                                            <select
                                                className="table-control font-fam remove-default-styling"
                                                value={formData.accountableId || ""}
                                                onChange={e => handleAccountableIdChange(e.target.value)}
                                                onFocus={clearErrorOnFocus}
                                                disabled={readOnly || loadingAccountableUsers || isLocked("accountableId")}
                                                style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                            >
                                                <option value="">
                                                    {loadingAccountableUsers ? "Loading..." : "Select Accountable Person"}
                                                </option>
                                                {accountableUsers.map(user => (
                                                    <option key={user._id} value={user._id}>{user.username}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Responsible Party {required && (<span className="required-field">*</span>)}
                                </th>
                                <td>
                                    <div className="ibra-popup-page-select-container">
                                        <textarea
                                            ref={personInChargeInputRef}
                                            className="jra-info-popup-page-textarea-new"
                                            value={formData.personInCharge || ""}
                                            placeholder="Select Responsible Party"
                                            onChange={e => handlePersonInChargeInput(e.target.value)}
                                            onFocus={handlePersonInChargeFocus}
                                            readOnly={readOnly || isLocked("personInCharge")}
                                            style={{
                                                resize: "none",
                                                color: (readOnly || isLocked("personInCharge")) ? "gray" : "black",
                                            }}
                                        />
                                    </div>
                                </td>
                                {(isViewable) && (
                                    <td>
                                        <div className="jra-info-popup-page-select-container">
                                            <select
                                                className="table-control font-fam remove-default-styling"
                                                value={formData.responsibleId || ""}
                                                onChange={e => handleResponsibleIdChange(e.target.value)}
                                                onFocus={clearErrorOnFocus}
                                                disabled={readOnly || loadingResponsibleUsers || isLocked("responsibleId")}
                                                style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                            >
                                                <option value="">
                                                    {loadingResponsibleUsers ? "Loading..." : "Select Responsible Person"}
                                                </option>
                                                {responsibleUsers.map(user => (
                                                    <option key={user._id} value={user._id}>{user.username}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr>
                                <th scope="row" className="jra-info-table-header">
                                    Other Team Members Involved {required && (<span className="required-field">*</span>)}
                                </th>
                                <td colSpan={isViewable ? 2 : 1}>
                                    <div
                                        ref={executorsTriggerRef}
                                        className="jra-info-popup-page-select-container jra-info-multiselect-trigger"
                                        onClick={openExecutorsPopup}
                                        style={{ cursor: (readOnly || isLocked("minTeamExecutors")) ? "default" : "pointer" }}
                                    >
                                        <div className="table-control font-fam remove-default-styling"
                                            style={{
                                                fontSize: "14px",
                                                height: "40px",
                                                padding: "10px",
                                                color: (readOnly || isLocked("minTeamExecutors")) ? "gray" : "black",
                                            }}>
                                            {selectedExecutors.length > 0
                                                ? selectedExecutors.join(", ")
                                                : "Select Other Team Members Involved"}
                                        </div>
                                    </div>
                                </td>
                                {isViewable && <td />}
                            </tr>
                            {isAssignmentView && (
                                <>
                                    <tr>
                                        <th scope="row" className="jra-info-table-header">
                                            Due Date {required && (<span className="required-field">*</span>)}
                                        </th>
                                        <td colSpan={isViewable ? 2 : 1}>
                                            <div
                                                style={{
                                                    position: "relative",
                                                    width: "100%",
                                                }}
                                            >
                                                <DatePicker
                                                    value={formData.dueDate || ""}
                                                    onChange={(val) =>
                                                        handleDueDateChange(val?.format("YYYY-MM-DD"))
                                                    }
                                                    format="YYYY/MM/DD"
                                                    rangeHover={false}
                                                    highlightToday={false}
                                                    editable={false}
                                                    placeholder="YYYY-MM-DD"
                                                    hideIcon={false}
                                                    inputClass="add-task-popup-page-input"
                                                    containerStyle={{
                                                        width: "100%",
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        height: "35px",
                                                        marginBottom: 0,
                                                        textAlign: "left",
                                                        boxSizing: "border-box",
                                                        color: (readOnly || isLocked("dueDate")) ? "gray" : "black"
                                                    }}
                                                    portal
                                                    portalTarget={document.body}
                                                    zIndex={999999}
                                                    onOpenPickNewDate={false}
                                                    minDate={new Date()}
                                                    disabled={readOnly || isLocked("dueDate")}
                                                />

                                                <FontAwesomeIcon
                                                    icon={faCalendarDays}
                                                    className="date-input-calendar-icon"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row" className="jra-info-table-header">
                                            Priority {required && (<span className="required-field">*</span>)}
                                        </th>
                                        <td colSpan={isViewable ? 2 : 1}>
                                            <div className="jra-info-popup-page-select-container">
                                                <select
                                                    className="table-control font-fam remove-default-styling"
                                                    value={formData.priority || ""}
                                                    onChange={e => handlePriorityChange(e.target.value)}
                                                    onFocus={clearErrorOnFocus}
                                                    disabled={readOnly || isLocked("priority")}
                                                    style={{ fontSize: "14px", height: "40px", padding: "10px" }}
                                                >
                                                    <option value="">Select Option</option>
                                                    {PRIORITY_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                </>
                            )}
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

                        {false && (
                            <label className="excel-filter-item">
                                <span className="excel-filter-checkbox">
                                    <input
                                        type="checkbox"
                                        className="checkbox-excel-attend"
                                        checked={newExecutorChecked}
                                        onChange={(e) => setNewExecutorChecked(e.target.checked)}
                                    />
                                </span>
                                <input
                                    type="text"
                                    className="excel-filter-search"
                                    placeholder="Type a new value and press Enter"
                                    value={newExecutorValue}
                                    style={{ fontSize: "14px", border: "none", padding: 5, flex: 1 }}
                                    onChange={(e) => setNewExecutorValue(e.target.value)}
                                    onKeyDown={handleNewExecutorKeyDown}
                                />
                                {newExecutorValue.trim() !== "" && (
                                    <FontAwesomeIcon
                                        icon={faCheck}
                                        title="Add this item"
                                        onClick={addNewExecutorOption}
                                        className="jra-info-add-item-icon"
                                    />
                                )}
                            </label>
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