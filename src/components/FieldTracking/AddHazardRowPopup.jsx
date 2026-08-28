import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';

const AddHazardRowPopup = ({ onClose, data, onSubmit, readOnly = false }) => {
    const unwantedEventInputRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [filteredUnwantedEvents, setFilteredUnwantedEvents] = useState([]);
    const [showUnwantedEventsDropdown, setShowUnwantedEventsDropdown] = useState(false);
    const [filteredControls, setFilteredControls] = useState([]);
    const [showControlsDropdown, setShowControlsDropdown] = useState(false);
    const [activeControlIndex, setActiveControlIndex] = useState(null);
    const [sourceData, setSourceData] = useState([]);
    const [jraInfo, setJraInfo] = useState([]);
    const controlsInputRefs = useRef({});

    const normalizeData = (raw) => ({
        hazard: raw?.hazard || "",
        unwantedEvent: raw?.unwantedEvent || "",
        controls: (raw?.controls && raw.controls.length > 0)
            ? raw.controls.map((c) => ({ id: c.id || uuidv4(), control: c.control || "" }))
            : [{ id: uuidv4(), control: "" }]
    });

    const [jraData, setJraData] = useState(() => normalizeData(data));

    const handleAddControl = (idx) => {
        setJraData(prev => {
            const newControl = { id: uuidv4(), control: "" };
            const nextControls = [
                ...prev.controls.slice(0, idx + 1),
                newControl,
                ...prev.controls.slice(idx + 1)
            ];
            return { ...prev, controls: nextControls };
        });
    };

    const handleDeleteControl = (idx) => {
        setJraData(prev => ({
            ...prev,
            controls: prev.controls.filter((_, i) => i !== idx)
        }));
    };

    const closeAllDropdowns = () => {
        setShowControlsDropdown(false);
        setShowUnwantedEventsDropdown(false);
    };

    useEffect(() => {
        const popupSelector = '.floating-dropdown';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('input') &&
                !e.target.closest('textarea');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowUnwantedEventsDropdown(false);
            setShowControlsDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showUnwantedEventsDropdown, showControlsDropdown]);

    useEffect(() => {
        async function fetchValues() {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/jraInfo`);
                if (!res.ok) throw new Error('Failed to fetch lookup data');
                const { jraInfo: raw } = await res.json();
                const jraList = Array.isArray(raw[0]) ? raw[0] : raw;
                setJraInfo(jraList);
            } catch (err) {
                console.error("Error fetching areas:", err);
            }
        }
        fetchValues();
    }, []);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/source`);
                if (!response.ok) {
                    throw new Error("Failed to fetch values");
                }

                const data = await response.json();

                setSourceData(data.risks);
            } catch (error) {
                console.error("Error fetching equipment:", error);
            }
        };

        fetchValues();
    }, []);

    const allUnwantedOptions = useMemo(
        () => Array.from(
            new Set(
                jraInfo.flatMap(h =>
                    h.hazards.flatMap(u => u.unwantedEvents.map(e => e.unwantedEvent))
                )
            )
        ),
        [jraInfo]
    );

    const allSubStepOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    jraInfo.flatMap(n =>
                        n.hazards.flatMap(h =>
                            h.unwantedEvents.flatMap(e => e.subTaskSteps)
                        )
                    )
                )
            ),
        [jraInfo]
    );

    function getUnwantedOptions(hazard) {
        if (!hazard) return allUnwantedOptions.slice().sort();

        const matches = jraInfo.flatMap(node =>
            node.hazards
                .filter(h => h.hazard === hazard)
                .flatMap(h => h.unwantedEvents.map(e => e.unwantedEvent))
        );

        return Array.from(new Set(matches)).sort();
    }

    // Hazard
    const handleHazardChange = (value) => {
        setJraData(prev => ({
            ...prev,
            hazard: value,
        }));
    };

    const handleUnwantedEventInput = (value) => {
        closeAllDropdowns();
        handleUnwantedEventChange(value);
        const base = getUnwantedOptions(jraData.hazard);
        const matches = base
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredUnwantedEvents(matches);
        setShowUnwantedEventsDropdown(true);

        const el = unwantedEventInputRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleUnwantedEventFocus = (value) => {
        if (readOnly) return;
        closeAllDropdowns();
        const base = getUnwantedOptions(jraData.hazard);
        const matches = base
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredUnwantedEvents(matches);
        setShowUnwantedEventsDropdown(true);

        const el = unwantedEventInputRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const selectUnwantedEventSuggestion = (suggestion) => {
        handleUnwantedEventChange(suggestion);
        setShowUnwantedEventsDropdown(false);
    };

    const handleUnwantedEventChange = (value) => {
        setJraData(prev => ({
            ...prev,
            unwantedEvent: value,
        }));
    };

    function getSubStepOptions(hazard, ue) {
        if (!hazard && !ue) return allSubStepOptions;

        if (hazard && !ue) {
            return Array.from(
                new Set(
                    jraInfo.flatMap(n =>
                        n.hazards
                            .filter(h => h.hazard === hazard)
                            .flatMap(h =>
                                h.unwantedEvents.flatMap(e => e.subTaskSteps)
                            )
                    )
                )
            );
        }

        if (!hazard && ue) {
            const validUE = jraInfo.some(node =>
                node.hazards.some(hazard =>
                    hazard.unwantedEvents.some(event =>
                        event.unwantedEvent.toLowerCase() === ue.toLowerCase()
                    )
                )
            );

            if (!validUE) {
                return allSubStepOptions;
            }
            return Array.from(
                new Set(
                    jraInfo.flatMap(n =>
                        n.hazards.flatMap(h =>
                            h.unwantedEvents
                                .filter(e => e.unwantedEvent === ue)
                                .flatMap(e => e.subTaskSteps)
                        )
                    )
                )
            );
        }

        // hazard + ue
        const validUE = jraInfo.some(node =>
            node.hazards.some(hazard =>
                hazard.unwantedEvents.some(event =>
                    event.unwantedEvent.toLowerCase() === ue.toLowerCase()
                )
            )
        );

        if (!validUE) {
            return Array.from(
                new Set(
                    jraInfo.flatMap(n =>
                        n.hazards
                            .filter(h => h.hazard === hazard)
                            .flatMap(h =>
                                h.unwantedEvents.flatMap(e => e.subTaskSteps)
                            )
                    )
                )
            );
        }

        return Array.from(
            new Set(
                jraInfo.flatMap(n =>
                    n.hazards
                        .filter(h => h.hazard === hazard)
                        .flatMap(h =>
                            h.unwantedEvents
                                .filter(e => e.unwantedEvent === ue)
                                .flatMap(e => e.subTaskSteps)
                        )
                )
            )
        );
    }

    const handleControlInput = (idx, value) => {
        closeAllDropdowns();
        handleControlChange(idx, value);

        const base = getSubStepOptions(jraData.hazard, jraData.unwantedEvent);
        const matches = base.filter(opt =>
            opt.toLowerCase().includes(value.toLowerCase())
        );

        setFilteredControls(matches);
        setShowControlsDropdown(true);
        setActiveControlIndex(idx);

        const el = controlsInputRefs.current[idx];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleControlFocus = (idx, value) => {
        if (readOnly) return;
        setActiveControlIndex(idx);

        const base = getSubStepOptions(jraData.hazard, jraData.unwantedEvent);
        const matches = base.filter(opt =>
            opt.toLowerCase().includes(value.toLowerCase())
        );

        setFilteredControls(matches);
        setShowControlsDropdown(true);

        const el = controlsInputRefs.current[idx];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const selectControlSuggestion = (suggestion) => {
        handleControlChange(activeControlIndex, suggestion);
        setShowControlsDropdown(false);
    };

    const handleControlChange = (idx, value) => {
        setJraData(prev => ({
            ...prev,
            controls: prev.controls.map((controlObj, cIdx) =>
                cIdx === idx
                    ? { ...controlObj, control: value }
                    : controlObj
            )
        }));
    };

    return (
        <div className="jra-popup-page-container">
            <div className="jra-popup-page-overlay">
                <div className="jra-popup-page-popup-right" style={{ minHeight: 0, height: "auto" }}>
                    <div className="jra-popup-page-popup-header-right">
                        <h2>Add Hazard Row</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="jra-popup-page-form-group-main-container">
                        <div className="jra-popup-page-scroll-box">
                            <div>
                                <div className="jra-popup-page-form-group-main-container-2" style={{ marginBottom: "0px" }}>
                                    <div className="jra-popup-page-additional-group" style={{ paddingBottom: "0px" }}>
                                        <div className="text-unwanted" style={{ marginBottom: "10px" }}>
                                            Unwanted Event Evaluation
                                        </div>
                                        <div className="jra-popup-page-additional-row">
                                            <div className="jra-popup-page-column-half">
                                                <div className="jra-popup-page-component-wrapper">
                                                    <div className="ibra-popup-page-form-group">
                                                        <label>Hazard Classification / Energy Release</label>
                                                        <div className="ibra-popup-page-select-container">
                                                            <select
                                                                type="text"
                                                                style={{ color: jraData.hazard === "" ? "grey" : "black", cursor: "text" }}
                                                                disabled={readOnly}
                                                                className="jra-popup-page-select ibra-popup-page-row-input"
                                                                placeholder="Select Hazard / Energy Release"
                                                                value={jraData.hazard}
                                                                onChange={(e) => handleHazardChange(e.target.value)}
                                                            >
                                                                <option value="" hidden>Select Hazard</option>

                                                                {[...sourceData]
                                                                    .sort((a, b) => {
                                                                        const aIsOther = a.term?.trim().toLowerCase() === "other";
                                                                        const bIsOther = b.term?.trim().toLowerCase() === "other";

                                                                        if (aIsOther && !bIsOther) return 1;
                                                                        if (!aIsOther && bIsOther) return -1;

                                                                        return a.term.localeCompare(b.term, undefined, { sensitivity: "base" });
                                                                    })
                                                                    .map((hazard, index) => (
                                                                        <option key={index} value={hazard.term} style={{ color: "black" }}>
                                                                            {hazard.term}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="jra-popup-page-column-half">
                                                <div className="jra-popup-page-component-wrapper">
                                                    <div className="ibra-popup-page-form-group">
                                                        <label>Unwanted Event</label>
                                                        <div className="ibra-popup-page-select-container">
                                                            <input
                                                                type="text"
                                                                style={{ color: "black", cursor: "text" }}
                                                                ref={unwantedEventInputRef}
                                                                readOnly={readOnly}
                                                                className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                placeholder="Insert Unwanted Event"
                                                                value={jraData.unwantedEvent}
                                                                onChange={(e) => handleUnwantedEventInput(e.target.value)}
                                                                onFocus={(e) => handleUnwantedEventFocus(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="jra-popup-page-additional-group">
                                        <div className="text-unwanted" style={{ marginBottom: "10px" }}>
                                            Control Evaluation
                                        </div>
                                        <div className="jra-popup-page-form-group-main-container-sub-controls" style={{ overflowX: "hidden" }}>
                                            {jraData.controls.map((controlItem, idx) => (
                                                <div key={controlItem.id} className="jra-popup-page-form-group" style={{ position: "relative", marginTop: "10px", paddingTop: "5px", cursor: "default", width: "100%" }}>
                                                    <div
                                                        className="jra-popup-page-control-container"
                                                        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "default" }}
                                                    >
                                                        <textarea
                                                            type="text"
                                                            style={{ resize: "none", color: "black", cursor: "text", flex: 1, minWidth: 0 }}
                                                            ref={el => {
                                                                if (el) {
                                                                    controlsInputRefs.current[idx] = el;
                                                                } else {
                                                                    delete controlsInputRefs.current[idx];
                                                                }
                                                            }}
                                                            className="jra-popup-page-control-table jra-popup-page-row-input"
                                                            placeholder="Insert Control"
                                                            value={controlItem.control}
                                                            readOnly={readOnly}
                                                            onChange={(e) => handleControlInput(idx, e.target.value)}
                                                            onFocus={(e) => handleControlFocus(idx, e.target.value)}
                                                        />
                                                        {!readOnly && (<>
                                                            <button
                                                                type="button"
                                                                className="jra-popup-page-add-subrow-button"
                                                                onClick={() => handleAddControl(idx)}
                                                                title="Add Control"
                                                                style={{ flexShrink: 0 }}
                                                            >
                                                                <FontAwesomeIcon icon={faPlusCircle} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="jra-popup-page-delete-subrow-button"
                                                                onClick={() => handleDeleteControl(idx)}
                                                                disabled={jraData.controls.length <= 1}
                                                                title={
                                                                    jraData.controls.length <= 1
                                                                        ? "At least one control must remain"
                                                                        : "Delete control"
                                                                }
                                                                style={{ flexShrink: 0 }}
                                                            >
                                                                <FontAwesomeIcon icon={faTrashAlt} />
                                                            </button>
                                                        </>)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ibra-popup-page-form-footer" style={{ marginTop: "0px" }}>
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={() => onSubmit(jraData)}
                            >
                                {(readOnly ? `Close Popup` : `Submit`)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showUnwantedEventsDropdown && filteredUnwantedEvents.length > 0 && (
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
                    {filteredUnwantedEvents.sort().filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectUnwantedEventSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {showControlsDropdown && filteredControls.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                    onMouseDown={e => e.preventDefault()}     // ← prevents input blur on scrollbar drag
                    onTouchStart={e => e.preventDefault()}
                    onScroll={e => e.preventDefault()} // ← prevents input blur on scrollbar drag
                >
                    {filteredControls.sort().filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectControlSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}
        </div >
    );
};

export default AddHazardRowPopup;