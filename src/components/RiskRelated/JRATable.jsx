import React, { useEffect, useState, useRef } from "react";
import './JRATable.css';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlus, faPlusCircle, faMagicWandSparkles, faTableColumns, faTimes, faInfoCircle, faArrowUpRightFromSquare, faCheck, faCirclePlus, faDownload } from '@fortawesome/free-solid-svg-icons';
import IBRAPopup from "./IBRAPopup";
import Hazard from "./RiskInfo/Hazard";
import UnwantedEvent from "./RiskInfo/UnwantedEvent";
import TaskExecution from "./RiskInfo/TaskExecution";
import ControlExecution from "./RiskInfo/ControlExecution";
import CurrentControls from "./RiskInfo/CurrentControls";
import { saveAs } from 'file-saver';

const JRATable = ({ formData, setFormData, isSidebarVisible }) => {
    const ibraBoxRef = useRef(null);
    const [filters, setFilters] = useState({});
    const tableWrapperRef = useRef(null);
    const [ibraPopup, setIbraPopup] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [hoveredBody, setHoveredBody] = useState({ rowId: null, bodyIdx: null });
    const savedWidthRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [filteredHazards, setFilteredHazards] = useState([]);
    const [showHazardsDropdown, setShowHazardsDropdown] = useState(false);
    const [controls, setControls] = useState([]);
    const [riskSources, setRiskSources] = useState([]);
    const [helpHazards, setHelpHazards] = useState(false);
    const [helpUnwantedEvents, setHelpUnwantedEvents] = useState(false);
    const [helpResponsible, setHelpResponsible] = useState(false);
    const [helpSub, setHelpSub] = useState(false);
    const [helpTaskExecution, setHelpTaskExecution] = useState(false);

    const openHazardsHelp = () => {
        setHelpHazards(true);
    };

    const openUnwantedEventsHelp = () => {
        setHelpUnwantedEvents(true);
    };

    const openResponsibleHelp = () => {
        setHelpResponsible(true);
    };

    const openSubHelp = () => {
        setHelpSub(true);
    };

    const openTaskExecutionHelp = () => {
        setHelpTaskExecution(true);
    };

    const closeHazardsHelp = () => {
        setHelpHazards(false);
    };

    const closeUnwantedEventsHelp = () => {
        setHelpUnwantedEvents(false);
    };

    const closeResponsibleHelp = () => {
        setHelpResponsible(false);
    };

    const closeSubHelp = () => {
        setHelpSub(false);
    };

    const closeTaskExecutionHelp = () => {
        setHelpTaskExecution(false);
    };

    const unwantedEvents = [
        'Exposure to Pathogen', 'Allergic Reaction', 'Contamination', 'Infestation', 'Chemical Spill', 'Toxic Fume Release', 'Corrosion Damage', 'Chemical Reaction', 'Flooding',
        'High Wind Damage', 'Lightning Strike', 'Heatwave', 'Asphyxiation', 'Entrapment', 'Explosion in Space', 'Equipment Failure', 'Airborne Dust Cloud', 'Silica Exposure',
        'Respiratory Irritation', 'Dust Explosion', 'Electric Shock', 'Short Circuit', 'Fire Due to Wiring', 'Equipment Overload', 'Repetitive Strain Injury', 'Musculoskeletal Disorder',
        'Poor Posture Injury', 'Fatigue', 'Uncontrolled Detonation', 'Shrapnel Release', 'Blast Overpressure', 'Fire from Explosion', 'Protest Disruption', 'Legislative Change',
        'Cyber Attack', 'Market Volatility', 'Building Fire', 'Wildfire Spread', 'Equipment Fire', 'Flash Over', 'Falling Object Impact', 'Structural Collapse',
        'Equipment Drop', 'Material Spill', 'Slip and Fall', 'Trip Hazard', 'Fall from Height', 'Uneven Surface', 'Soil Erosion', 'Contamination Spread', 'Habitat Destruction',
        'Land Subsidence', 'Glare', 'Insufficient Lighting', 'Flicker Effect', 'Burns from Heat', 'Machine Entanglement', 'Crush Injury', 'Mechanical Failure', 'Tool Breakage',
        'Vehicle Collision', 'Equipment Rollaway', 'Forklift Tip-Over', 'Mobile Crane Collapse', 'Magnetized Object Attraction', 'Equipment Malfunction', 'Personnel Injury',
        'Field Leakage', 'Hearing Damage', 'Noise Complaint', 'Acoustic Resonance', 'Human Error', 'Intentional Sabotage', 'Fatigue-Related Error', 'Violence', 'Pressure Vessel Burst',
        'Blast Wave Injury', 'Air Blast Damage', 'Loud Noise Damage', 'Stress Reaction', 'Anxiety Episode', 'Depression', 'Insomnia', 'Radiation Leak', 'Skin Burn', 'Equipment Damage',
        'Community Protest', 'Cultural Insensitivity', 'Reputation Damage', 'Boycott', 'Heat Stress', 'Cold Exposure', 'Thermal Shock', 'Burn Injury', 'Hand-Arm Vibration Syndrome',
        'Whole Body Vibration', 'Structural Fatigue', 'Vibration-Induced Failure', 'Hazardous Waste Leak', 'Landfill Overflow', 'Illegal Dumping', 'Greenhouse Gas Emission',
        'Flood Contamination', 'Drowning', 'Water Scarcity', 'Water Pollution', 'Unanticipated Hazard', 'Unexpected Reaction', 'Unknown Failure'
    ];


    useEffect(() => {
        async function fetchValues() {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/getValues`);
                if (!res.ok) throw new Error('Failed to fetch lookup data');
                // parse once, pull out both
                const { risks, controls } = await res.json();

                setRiskSources(risks);
                setControls(controls);
            } catch (err) {
                console.error("Error fetching areas:", err);
            }
        }
        fetchValues();
    }, []);

    const handleGenerateJRADocument = async () => {
        const dataToStore = {
            formData: formData.jra,
        };

        const documentName = (formData.title) + ' ' + formData.documentType;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-jra-xlsx`, {
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

    const hazardsInputRefs = useRef({});
    const unwantedEventRefs = useRef({});
    const responsibleInputRefs = useRef({});

    const [activeHazardCell, setActiveHazardCell] = useState({ row: null, body: null, idx: null });
    const [filteredUnwantedEvents, setFilteredUnwantedEvents] = useState([]);
    const [showUnwantedEventsDropdown, setShowUnwantedEventsDropdown] = useState(false);
    const [filteredExe, setFilteredExe] = useState([]);
    const [showExeDropdown, setShowExeDropdown] = useState(false);
    const hazardsOptions = ["Hazard1", "Hazard2", "Hazard3"];
    const unwantedOptions = ["Unwanted1", "Unwanted2", "Unwanted3"];
    const responsibleOptions = ["Responsible1", "Responsible2", "Responsible3"];

    const [filterPopup, setFilterPopup] = useState({
        visible: false,
        column: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const [controlPopup, setControlPopup] = useState({
        visible: false,
        rowId: null,
        bodyIdx: null,
        controlIdx: null,
        pos: { top: 0, left: 0 }
    });

    const closeAllDropdowns = () => {
        setShowExeDropdown(null);
        setShowHazardsDropdown(false);
        setShowUnwantedEventsDropdown(false);
    };

    function openControlPopup(rowId, bodyIdx, controlIdx, e) {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setControlPopup({
            visible: true,
            rowId,
            bodyIdx,
            controlIdx,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            }
        });
    }

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                controlPopup.visible &&
                !e.target.closest('.jra-control-popup') &&
                !e.target.closest('.popup-trigger-icon')
            ) {
                setControlPopup(cp => ({ ...cp, visible: false }));
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [controlPopup.visible]);

    function extractColumnValues(row, colId) {
        if (colId === "nr") return [String(row.nr)];
        if (colId === "main") return [row.main];
        return row.jraBody.flatMap(body => {
            switch (colId) {
                case "hazards": return body.hazards.map(h => h.hazard);
                case "UE": return body.UE.map(u => u.ue);
                case "sub": return body.sub.map(s => s.task);
                case "taskExecution": return body.taskExecution.map(te => te.R);
                case "controls": return body.controls.map(c => c.control);
                default: return [];
            }
        });
    }

    function extractBodyValues(body, colId) {
        switch (colId) {
            case "hazards": return body.hazards.map(h => h.hazard);
            case "UE": return body.UE.map(u => u.ue);
            case "sub": return body.sub.map(s => s.task);
            case "taskExecution": return body.taskExecution.map(te => te.R);
            case "controls": return body.controls.map(c => c.control);
            default: return [];
        }
    }

    function applyFilter(value) {
        setFilters(prev => ({
            ...prev,
            [filterPopup.column]: value
        }));
        setFilterPopup(prev => ({ ...prev, visible: false }));
    }

    // clear the filter & close popup
    function clearFilter() {
        setFilters(prev => {
            const next = { ...prev };
            delete next[filterPopup.column];
            return next;
        });
        setFilterPopup(prev => ({ ...prev, visible: false }));
    }

    function openFilterPopup(colId, e) {
        const rect = e.target.getBoundingClientRect();
        setFilterPopup({
            visible: true,
            column: colId,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            }
        });
    }

    const filteredRows = formData.jra.reduce((acc, row) => {
        let keepRow = true;
        let survivingBodies = row.jraBody;

        for (const [colId, text] of Object.entries(filters)) {
            const lcText = text.toLowerCase();

            // 1) group-level filters:
            if (colId === "nr") {
                if (!String(row.nr).toLowerCase().includes(lcText)) {
                    keepRow = false;
                    break;
                }
            } else if (colId === "main") {
                if (!row.main.toLowerCase().includes(lcText)) {
                    keepRow = false;
                    break;
                }

                // 2) body-level filters: prune jraBody array
            } else {
                survivingBodies = survivingBodies.filter(body =>
                    extractBodyValues(body, colId)
                        .some(val => val.toLowerCase().includes(lcText))
                );
                // if no bodies remain, we must drop the whole row
                if (survivingBodies.length === 0) {
                    keepRow = false;
                    break;
                }
            }
        }

        if (keepRow) {
            // push a copy of the row with its pruned jraBody
            acc.push({ ...row, jraBody: survivingBodies });
        }
        return acc;

    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest('.floating-dropdown') &&
                !e.target.closest('input');
            if (outside) {
                setShowExeDropdown(null);
                setShowHazardsDropdown(false);
                setShowUnwantedEventsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUnwantedEventsDropdown, showExeDropdown, showHazardsDropdown]);

    const updateHazard = (rowIndex, bodyIdx, hIdx, newValue) => {
        setFormData(prev => {
            const newJra = prev.jra.map((row, r) => {
                if (r !== rowIndex) return row;
                return {
                    ...row,
                    jraBody: row.jraBody.map((body, b) => {
                        if (b !== bodyIdx) return body;
                        return {
                            ...body,
                            hazards: body.hazards.map((hObj, h) => {
                                if (h !== hIdx) return hObj;
                                return { ...hObj, hazard: newValue };
                            })
                        };
                    })
                };
            });
            return { ...prev, jra: newJra };
        });
    };

    const handleHazardsInput = (rowIndex, bodyIdx, hIdx, value) => {
        closeAllDropdowns();
        updateHazard(rowIndex, bodyIdx, hIdx, value);
        const matches = hazardsOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);
        setFilteredHazards(matches);
        setShowHazardsDropdown(true);
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
        const el = hazardsInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // On focus, show all options
    const handleHazardsFocus = (rowIndex, bodyIdx, hIdx) => {
        closeAllDropdowns();
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });
        setFilteredHazards(hazardsOptions.slice(0, 15));
        setShowHazardsDropdown(true);

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
        const el = hazardsInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // When they pick one
    const selectHazardsSuggestion = (suggestion) => {
        const { row, body, idx } = activeHazardCell;
        updateHazard(row, body, idx, suggestion);
        setShowHazardsDropdown(false);
    };

    const updateUnwantedEvent = (rowIndex, bodyIdx, hIdx, newValue) => {
        setFormData(prev => {
            const newJra = prev.jra.map((row, r) => {
                if (r !== rowIndex) return row;
                return {
                    ...row,
                    jraBody: row.jraBody.map((body, b) => {
                        if (b !== bodyIdx) return body;
                        return {
                            ...body,
                            UE: body.UE.map((hObj, h) => {
                                if (h !== hIdx) return hObj;
                                return { ...hObj, ue: newValue };
                            })
                        };
                    })
                };
            });
            return { ...prev, jra: newJra };
        });
    };

    const handleUnwantedEventInput = (rowIndex, bodyIdx, hIdx, value) => {
        closeAllDropdowns();
        updateUnwantedEvent(rowIndex, bodyIdx, hIdx, value);
        const matches = unwantedOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);
        setFilteredUnwantedEvents(matches);
        setShowUnwantedEventsDropdown(true);
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
        const el = unwantedEventRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // On focus, show all options
    const handleUnwantedEventFocus = (rowIndex, bodyIdx, hIdx) => {
        closeAllDropdowns();
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });
        setFilteredUnwantedEvents(unwantedOptions.slice(0, 15));
        setShowUnwantedEventsDropdown(true);

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
        const el = unwantedEventRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // When they pick one
    const selectUnwantedEventSuggestion = (suggestion) => {
        const { row, body, idx } = activeHazardCell;
        updateUnwantedEvent(row, body, idx, suggestion);
        setShowUnwantedEventsDropdown(false);
    };

    const updateResponsible = (rowIndex, bodyIdx, hIdx, newValue) => {
        closeAllDropdowns();
        setFormData(prev => {
            const newJra = prev.jra.map((row, r) => {
                if (r !== rowIndex) return row;
                return {
                    ...row,
                    jraBody: row.jraBody.map((body, b) => {
                        if (b !== bodyIdx) return body;
                        return {
                            ...body,
                            taskExecution: body.taskExecution.map((hObj, h) => {
                                if (h !== hIdx) return hObj;
                                return { ...hObj, R: newValue };
                            })
                        };
                    })
                };
            });
            return { ...prev, jra: newJra };
        });
    };

    const handleResponsibleInput = (rowIndex, bodyIdx, hIdx, value) => {
        closeAllDropdowns();
        updateResponsible(rowIndex, bodyIdx, hIdx, value);
        const matches = responsibleOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);
        setFilteredExe(matches);
        setShowExeDropdown(true);
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
        const el = responsibleInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // On focus, show all options
    const handleResponsibleFocus = (rowIndex, bodyIdx, hIdx) => {
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });
        setFilteredExe(responsibleOptions.slice(0, 15));
        setShowExeDropdown(true);

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
        const el = responsibleInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // When they pick one
    const selectResponsibleSuggestion = (suggestion) => {
        const { row, body, idx } = activeHazardCell;
        updateResponsible(row, body, idx, suggestion);
        setShowExeDropdown(false);
    };

    const closePopup = () => {
        setIbraPopup(false);
    }

    const updateRows = (nrToUpdate, newValues) => {
        setFormData(prev => ({
            ...prev,
            jra: prev.jra.map(item =>
                item.nr === nrToUpdate
                    ? { ...item, ...newValues }
                    : item
            )
        }));
    };

    const insertSubControl = (rowId, bodyId) => {
        setFormData(prev => ({
            ...prev,
            jra: prev.jra.map(item => {
                if (item.id !== rowId) return item;
                return {
                    ...item,
                    jraBody: item.jraBody.map(body => {
                        if (body.idBody !== bodyId) return body;
                        return {
                            ...body,
                            sub: [...body.sub, { task: "" }],
                            taskExecution: [...body.taskExecution, { R: "" }],
                            controls: [...body.controls, { control: "" }],
                            go_noGo: [...body.go_noGo, { go: "" }],
                        };
                    })
                };
            })
        }));
    };

    // Remove sub & control at the same index
    const removeSubControl = (rowId, bodyId, idx) => {
        setFormData(prev => ({
            ...prev,
            jra: prev.jra.map(item => {
                if (item.id !== rowId) return item;
                return {
                    ...item,
                    jraBody: item.jraBody.map(body => {
                        if (body.idBody !== bodyId) return body;

                        // Only filter if there's more than one item
                        const updatedSub = body.sub.length > 1
                            ? body.sub.filter((_, i) => i !== idx)
                            : body.sub;

                        const updatedControls = body.controls.length > 1
                            ? body.controls.filter((_, i) => i !== idx)
                            : body.controls;

                        const updatedTE = body.taskExecution.length > 1
                            ? body.taskExecution.filter((_, i) => i !== idx)
                            : body.taskExecution;

                        const updatedGO = body.go_noGo.length > 1
                            ? body.go_noGo.filter((_, i) => i !== idx)
                            : body.go_noGo;

                        return {
                            ...body,
                            sub: updatedSub,
                            taskExecution: updatedTE,
                            controls: updatedControls,
                            go_noGo: updatedGO,
                        };
                    })
                };
            })
        }));
    };


    const insertBodyRow = (rowId, insertAtIndex) => {
        setFormData(prev => {
            const newJra = prev.jra.map(item => {
                if (item.id !== rowId) return item;

                const newEntry = {
                    idBody: uuidv4(),
                    hazards: [{ hazard: "" }],
                    UE: [{ ue: "" }],
                    sub: [{ task: "" }],
                    taskExecution: [{ R: "" }],
                    controls: [{ control: "" }],
                    go_noGo: [{ go: "" }],
                };

                const bodies = [
                    ...item.jraBody.slice(0, insertAtIndex),
                    newEntry,
                    ...item.jraBody.slice(insertAtIndex)
                ];
                return { ...item, jraBody: bodies };
            });
            return { ...prev, jra: newJra };
        });
    };

    const insertMainRow = (afterIndex) => {
        setFormData(prev => {
            // build the new main‐step entry
            const newEntry = {
                id: uuidv4(),
                nr: null,           // we’ll renumber in a moment
                main: "",
                jraBody: [{
                    idBody: uuidv4(),
                    hazards: [{ hazard: "" }],
                    UE: [{ ue: "" }],
                    sub: [{ task: "" }],
                    taskExecution: [{ R: "" }],
                    controls: [{ control: "" }],
                    go_noGo: [{ go: "" }],
                }]
            };

            // splice it into the right position
            const newJra = [
                ...prev.jra.slice(0, afterIndex + 1),
                newEntry,
                ...prev.jra.slice(afterIndex + 1)
            ];

            // renumber all rows
            const renumbered = newJra.map((item, idx) => ({
                ...item,
                nr: idx + 1
            }));

            return { ...prev, jra: renumbered };
        });
    };

    const removeRow = (idToRemove) => {
        if (formData.jra.length === 1) {
            toast.error("You must keep at least one row.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
            return;
        }

        const updatedRows = formData.jra.filter(row => row.id !== idToRemove);

        if (updatedRows.length === formData.jra.length) {
            toast.error("Row not found.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
            return;
        }

        // Re-number the rows in ascending order starting from 1
        const reNumberedRows = updatedRows.map((jra, index) => ({
            ...jra,
            nr: index + 1
        }));

        console.log('After re-numbering:', reNumberedRows);

        setFormData({
            ...formData,
            jra: reNumberedRows,
        });
    };

    const availableColumns = [
        { id: "nr", title: "Nr", className: "ibraCent ibraNr", icon: null },
        { id: "main", title: "Main Task Step", className: "ibraCent ibraMainJRA", icon: null },
        { id: "hazards", title: "Hazard Classification / Energy Release", className: "ibraCent ibraSubJRA", icon: faInfoCircle },
        { id: "UE", title: "Unwanted Event", className: "ibraCent ibraStatus", icon: faInfoCircle },
        { id: "sub", title: "Controls/ Sub Task Steps\n(Procedure to complete the Main Task Step)", className: "ibraCent ibraSubJRA", icon: faInfoCircle },
        { id: "taskExecution", title: "Task Execution", className: "ibraCent ibraMainJRA", icon: faInfoCircle },
        { id: "controls", title: "Contol Execution Specification\n(For Work Execution Document [WED])", className: "ibraCent ibraEXEJRA", icon: faInfoCircle },
        { id: "go", title: "Go/ No-Go", className: "ibraCent ibraDeadlineJRA", icon: null },
        { id: "action", title: "Action", className: "ibraCent ibraAct", icon: null },
    ];

    const openInfo = (type) => {
        switch (type) {
            case "hazards": {
                openHazardsHelp();
                break;
            }
            case "UE": {
                openUnwantedEventsHelp();
                break;
            }
            case "sub": {
                openSubHelp();
                break;
            }
            case "taskExecution": {
                openTaskExecutionHelp();
                break;
            }
            case "controls": {
                openResponsibleHelp();
                break;
            }
        }
    }

    const removeBodyRow = (rowId, bodyId) => {
        setFormData(prev => {
            const newJra = prev.jra.flatMap(item => {
                if (item.id !== rowId) return item;

                // if it’s the only sub-step, delegate back to removeRow
                if (item.jraBody.length === 1) {
                    // don’t delete the very last row in the table
                    if (prev.jra.length === 1) {
                        toast.clearWaitingQueue();
                        toast.dismiss();

                        toast.error("You must keep at least one row.", {
                            closeButton: true,
                            autoClose: 800,
                            style: { textAlign: 'center' }
                        });
                        return item;
                    }
                    return []; // drop the entire JRA entry
                }

                // otherwise just filter out that one body entry
                return {
                    ...item,
                    jraBody: item.jraBody.filter(b => b.idBody !== bodyId)
                };
            });

            // re-number the remaining main rows
            const renumbered = newJra.map((j, i) => ({ ...j, nr: i + 1 }));
            return { ...prev, jra: renumbered };
        });
    };

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const mouseDownHandler = (e) => {
            if (e.target.closest('input, textarea, select, button')) {
                return;
            }
            isDown = true;
            wrapper.classList.add('grabbing');
            startX = e.pageX - wrapper.offsetLeft;
            scrollLeft = wrapper.scrollLeft;
        };

        const mouseLeaveHandler = () => {
            isDown = false;
            wrapper.classList.remove('grabbing');
        };

        const mouseUpHandler = () => {
            isDown = false;
            wrapper.classList.remove('grabbing');
        };

        const mouseMoveHandler = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const walk = (x - startX) * 1.5;
            wrapper.scrollLeft = scrollLeft - walk;
        };

        wrapper.addEventListener('mousedown', mouseDownHandler);
        wrapper.addEventListener('mouseleave', mouseLeaveHandler);
        wrapper.addEventListener('mouseup', mouseUpHandler);
        wrapper.addEventListener('mousemove', mouseMoveHandler);

        return () => {
            wrapper.removeEventListener('mousedown', mouseDownHandler);
            wrapper.removeEventListener('mouseleave', mouseLeaveHandler);
            wrapper.removeEventListener('mouseup', mouseUpHandler);
            wrapper.removeEventListener('mousemove', mouseMoveHandler);
        };
    }, []);

    useEffect(() => {
        const adjust = () => {
            if (!ibraBoxRef.current || !tableWrapperRef.current) return;
            const boxW = ibraBoxRef.current.offsetWidth;
            tableWrapperRef.current.style.width = `${boxW - 30}px`;
        };
        window.addEventListener('resize', adjust);
        adjust();
        return () => window.removeEventListener('resize', adjust);
    }, []);

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        if (!isSidebarVisible) {
            // Sidebar just hid: remember current width
            savedWidthRef.current = wrapper.offsetWidth;
        } else if (savedWidthRef.current != null) {
            // Sidebar just shown again: re-apply the old width
            wrapper.style.width = `${savedWidthRef.current}px`;
            // skip the "live" recalc this one time
            return;
        }
        // otherwise (e.g. initial mount or no saved width) do a normal recalc
        const boxW = ibraBoxRef.current.offsetWidth;
        wrapper.style.width = `${boxW - 30}px`;
    }, [isSidebarVisible]);

    const [showColumns, setShowColumns] = useState([
        "nr", "main", "hazards", "sub", "UE", "action",
    ]);

    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const getDisplayColumns = () => {
        let result = availableColumns
            .map(col => col.id)
            .filter(id => showColumns.includes(id) && id !== 'action');
        while (result.length < 5) {
            result.push(`blank-${result.length}`);
        }
        result.push('action');
        return result;
    };

    const popupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowColumnSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleColumn = (columnId) => {
        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                if (columnId === 'action' || columnId === 'nr') return prev;
                return prev.filter(id => id !== columnId);
            } else {
                const actionIndex = prev.indexOf('action');
                if (actionIndex !== -1) {
                    return [...prev.slice(0, actionIndex), columnId, ...prev.slice(actionIndex)];
                } else {
                    return [...prev, columnId];
                }
            }
        });
    };

    // New function to handle "Select All" functionality
    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            // Select all columns except 'action' (which is added separately)
            const allColumns = availableColumns
                .map(col => col.id)
                .filter(id => id !== 'action');
            setShowColumns([...allColumns, 'action']);
        } else {
            // Keep only required columns
            setShowColumns(['nr', 'action']);
        }
    };

    // Check if all selectable columns are selected
    const areAllColumnsSelected = () => {
        const selectableColumns = availableColumns
            .filter(col => col.id !== 'action')
            .map(col => col.id);

        return selectableColumns.every(colId =>
            showColumns.includes(colId) || colId === 'nr'
        );
    };

    const displayColumns = getDisplayColumns();

    return (
        <div className="input-row-risk-ibra">
            <div className="ibra-box" ref={ibraBoxRef}>
                <button
                    className="top-left-button-refs"
                    title="Information"
                >
                    <FontAwesomeIcon icon={faInfoCircle} className="icon-um-search" />
                </button>
                <h3 className="font-fam-labels">Job Risk Assesment (JRA) <span className="required-field">*</span></h3>
                <button
                    className="top-right-button-ibra"
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>
                <button
                    className="top-right-button-ibra2"
                    title="Generate JRA"
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" onClick={handleGenerateJRADocument} />
                </button>

                {showColumnSelector && (
                    <div className="column-selector-popup" ref={popupRef}>
                        <div className="column-selector-header">
                            <h4>Select Columns</h4>
                            <button
                                className="close-popup-btn"
                                onClick={() => setShowColumnSelector(false)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="column-selector-content">
                            <p className="column-selector-note">Select columns to display</p>

                            {/* Select All option */}
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

                            <div className="column-checkbox-container">
                                {availableColumns.map(column => (
                                    <div className="column-checkbox-item" key={column.id}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={showColumns.includes(column.id)}
                                                disabled={column.id === 'action' || column.id === 'nr'}
                                                onChange={() => toggleColumn(column.id)}
                                            />
                                            <span>{column.title}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="column-selector-footer">
                                <p>{showColumns.length - 1} columns selected</p> {/* Subtract 1 to exclude 'action' */}
                                <button
                                    className="apply-columns-btn"
                                    onClick={() => setShowColumnSelector(false)}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="table-wrapper-jra" ref={tableWrapperRef}>
                    <table className="table-borders-ibra">
                        <thead className="ibra-table-header">
                            <tr>
                                {displayColumns.map((columnId, index) => {
                                    const column = availableColumns.find(col => col.id === columnId);
                                    if (!column) {
                                        return <th key={index} className="ibraCent ibraBlank"></th>;
                                    }
                                    return (
                                        <th
                                            key={index}
                                            className={`${column.className} jra-header-cell ${filters[columnId] ? 'jra-filter-active' : ''}`}
                                            onClick={e => openFilterPopup(columnId, e)}
                                        >
                                            {/* top-left icon, if any */}
                                            {column.icon && (
                                                <FontAwesomeIcon icon={column.icon} className="header-icon" onClick={e => {
                                                    e.stopPropagation();          // ← prevent the th’s onClick
                                                    openInfo(column.id);          // ← your “info” popup
                                                }} />
                                            )}
                                            {/* the column title (split subtitle in parentheses) */}
                                            <div>{column.title.split('(')[0].trim()}</div>
                                            {column.title.includes('(') && (
                                                <div className="column-subtitle">
                                                    ({column.title.split('(')[1].split(')')[0]})
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row, rowIndex) => {
                                const rowCount = row.jraBody.length;

                                return (
                                    <React.Fragment key={row.id}>
                                        {row.jraBody.map((body, bodyIdx) => (
                                            <tr
                                                key={`${row.id}-${body.idBody}`}
                                                onMouseEnter={() => setHoveredBody({ rowId: row.id, bodyIdx })}
                                                onMouseLeave={() => setHoveredBody({ rowId: null, bodyIdx: null })}
                                                className="jra-body-row"
                                            >
                                                {displayColumns.map((colId, colIdx) => {
                                                    if ((colId === 'nr' || colId === 'main') && bodyIdx > 0) {
                                                        return null;
                                                    }

                                                    const meta = availableColumns.find(c => c.id === colId);
                                                    const cls = meta?.className || "";

                                                    // ─────── GROUP-LEVEL ───────
                                                    if (colId === "nr" && bodyIdx === 0) {
                                                        return (
                                                            <td key={colIdx} rowSpan={rowCount} className={cls}>
                                                                {row.nr}
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "main") {
                                                        return (
                                                            <td
                                                                key={colIdx}
                                                                rowSpan={rowCount}
                                                                className={[cls, 'main-cell'].join(' ')}
                                                            >
                                                                <div className="main-cell-content">
                                                                    <textarea
                                                                        className="aim-textarea-risk-jra"
                                                                        rows={1}
                                                                        value={row.main}
                                                                        onChange={e => {
                                                                            const upd = [...formData.jra];
                                                                            upd[rowIndex].main = e.target.value;
                                                                            updateRows(upd);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="insert-mainrow-button"
                                                                    title="Add Main Step Here"
                                                                    onClick={() => insertMainRow(rowIndex)}
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} />
                                                                </button>
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "action") {
                                                        return (
                                                            <td key={colIdx} className={cls}>
                                                                <button
                                                                    className="remove-row-button font-fam"
                                                                    title={
                                                                        row.jraBody.length > 1
                                                                            ? "Delete Sub-step"
                                                                            : "Delete Row"
                                                                    }
                                                                    onClick={() =>
                                                                        removeBodyRow(row.id, body.idBody)
                                                                    }
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </td>
                                                        );
                                                    }


                                                    // ─────── BODY-LEVEL ───────

                                                    // 3. Hazard
                                                    if (colId === "hazards") {
                                                        return (
                                                            <td key={colIdx} className="hazard-cell">
                                                                {body.hazards.map((hObj, hIdx) => (
                                                                    <div className="ibra-popup-page-select-container" key={hIdx}>
                                                                        <div className="ibra-popup-page-select-container">
                                                                            <input
                                                                                type="text"
                                                                                style={{ color: "black", cursor: "text" }}
                                                                                ref={el => {
                                                                                    const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
                                                                                    if (el) {
                                                                                        hazardsInputRefs.current[key] = el;
                                                                                    } else {
                                                                                        delete hazardsInputRefs.current[key];
                                                                                    }
                                                                                }}
                                                                                className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                                placeholder="Choose Hazard"
                                                                                value={hObj.hazard}
                                                                                onChange={e => handleHazardsInput(rowIndex, bodyIdx, hIdx, e.target.value)}
                                                                                onFocus={() => handleHazardsFocus(rowIndex, bodyIdx, hIdx)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {/* the floating “+” icon */}
                                                                <button
                                                                    type="button"
                                                                    className="insert-subrow-button"
                                                                    onClick={() => insertBodyRow(row.id, bodyIdx + 1)}
                                                                    title="Add sub-step here"
                                                                >
                                                                    <FontAwesomeIcon icon={faPlus} />
                                                                </button>
                                                            </td>
                                                        );
                                                    }

                                                    // 4. Unwanted Event
                                                    if (colId === "UE") {
                                                        return (
                                                            <td key={colIdx} className={cls} >
                                                                {/* remove paired sub/control */}


                                                                {body.UE.map((uObj, uIdx) => (
                                                                    <div className="ibra-popup-page-select-container" key={uIdx}>
                                                                        <div className="ibra-popup-page-select-container">
                                                                            <input
                                                                                type="text"
                                                                                style={{ color: "black", cursor: "text" }}
                                                                                ref={el => {
                                                                                    const key = `${rowIndex}-${bodyIdx}-${uIdx}`;
                                                                                    if (el) {
                                                                                        unwantedEventRefs.current[key] = el;
                                                                                    } else {
                                                                                        delete unwantedEventRefs.current[key];
                                                                                    }
                                                                                }}
                                                                                className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                                placeholder="Choose Unwanted Event"
                                                                                value={uObj.ue}
                                                                                onChange={e => handleUnwantedEventInput(rowIndex, bodyIdx, uIdx, e.target.value)}
                                                                                onFocus={() => handleUnwantedEventFocus(rowIndex, bodyIdx, uIdx)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }

                                                    // 6. Sub Task Steps
                                                    if (colId === "sub") {
                                                        return (
                                                            <td key={colIdx} className={cls}>
                                                                {body.sub.map((sObj, sIdx) => (
                                                                    <div className="control-with-icons" key={colIdx}>
                                                                        <FontAwesomeIcon
                                                                            icon={faTrash}
                                                                            className="control-icon trash-icon"
                                                                            title="Remove this control & sub-step"
                                                                            onClick={() => removeSubControl(row.id, body.idBody, sIdx)}
                                                                        />

                                                                        {/* add new paired sub/control at end */}
                                                                        <FontAwesomeIcon
                                                                            icon={faCirclePlus}
                                                                            className="control-icon plus-icon"
                                                                            title="Add sub & control here"
                                                                            onClick={() => insertSubControl(row.id, body.idBody)}
                                                                        />
                                                                        <textarea
                                                                            key={sIdx}
                                                                            className="aim-textarea-sub-jra"
                                                                            rows={1}
                                                                            value={sObj.task}
                                                                            style={{
                                                                                display: "block",       // ← force it onto its own line
                                                                                width: "100%",        // ← optional: make it fill cell width
                                                                                marginBottom: "5px"
                                                                            }}
                                                                            onChange={e => {
                                                                                const upd = [...formData.jra];
                                                                                upd[rowIndex].jraBody[bodyIdx].sub[sIdx].task = e.target.value;
                                                                                updateRows(upd);
                                                                            }}
                                                                        />
                                                                        <FontAwesomeIcon
                                                                            icon={faMagicWandSparkles}
                                                                            className="control-icon-ai magic-icon"
                                                                            title="Do the magic"
                                                                            onClick={() => {/* your “magic” logic */ }} />
                                                                    </div>
                                                                ))}

                                                            </td>
                                                        );
                                                    }

                                                    // 7. Task Execution
                                                    if (colId === "taskExecution") {
                                                        const TE = body.taskExecution[0];
                                                        return (
                                                            <td key={colIdx} className={cls}>
                                                                {body.taskExecution.map((teObj, teIdx) => (
                                                                    <div className="ibra-popup-page-select-container">
                                                                        <input
                                                                            type="text"
                                                                            style={{ color: "black", cursor: "text", marginBottom: "5px" }}
                                                                            ref={el => {
                                                                                const key = `${rowIndex}-${bodyIdx}-${teIdx}`;
                                                                                if (el) {
                                                                                    responsibleInputRefs.current[key] = el;
                                                                                } else {
                                                                                    delete responsibleInputRefs.current[key];
                                                                                }
                                                                            }}
                                                                            className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                            placeholder="Choose Responsible"
                                                                            value={teObj.R}
                                                                            onChange={e => handleResponsibleInput(rowIndex, bodyIdx, teIdx, e.target.value)}
                                                                            onFocus={() => handleResponsibleFocus(rowIndex, bodyIdx, teIdx)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }

                                                    // 8. Controls
                                                    if (colId === "controls") {
                                                        return (
                                                            <td key={colIdx} className={cls}>
                                                                {body.controls.map((cObj, cIdx) => (
                                                                    <div className="control-with-icons" key={cIdx}>
                                                                        <textarea
                                                                            key={cIdx}
                                                                            className="aim-textarea-WED-jra"
                                                                            rows={1}
                                                                            value={cObj.control}
                                                                            style={{
                                                                                display: "block",      // ← optional: make it fill cell width
                                                                                marginBottom: "5px",
                                                                                paddingRight: "35px",
                                                                            }}
                                                                            onChange={e => {
                                                                                const upd = [...formData.jra];
                                                                                upd[rowIndex].jraBody[bodyIdx].controls[cIdx].control = e.target.value;
                                                                                updateRows(upd);
                                                                            }}
                                                                        />

                                                                        {/* magic sparkles */}
                                                                        <FontAwesomeIcon
                                                                            icon={faMagicWandSparkles}
                                                                            className="control-icon-ai magic-icon"
                                                                            title="Do the magic"
                                                                            onClick={e => openControlPopup(row.id, bodyIdx, cIdx, e)} />
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "go") {
                                                        return (
                                                            <td key={colIdx} className={cls}>
                                                                {body.go_noGo.map((goObj, goIdx) => (
                                                                    <div className="ibra-popup-page-select-container">
                                                                        <select
                                                                            key={goIdx}
                                                                            className="ibra-popup-page-select"
                                                                            value={goObj.go}
                                                                            style={{
                                                                                display: "block",      // ← optional: make it fill cell width
                                                                                marginBottom: "5px",
                                                                                paddingRight: "35px",
                                                                            }}
                                                                            onChange={e => {
                                                                                const upd = [...formData.jra];
                                                                                upd[rowIndex].jraBody[bodyIdx].go_noGo[goIdx].go = e.target.value;
                                                                                updateRows(upd);
                                                                            }}
                                                                        >
                                                                            <option value="">Select Option</option>
                                                                            <option value="Go">Go</option>
                                                                            <option value="No-Go">No-Go</option>
                                                                        </select>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }

                                                    // else empty
                                                    return <td key={colIdx} />;
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                </div>
            </div>

            {controlPopup.visible && (
                <div
                    className="jra-control-popup"
                    style={{
                        position: 'fixed',
                        top: controlPopup.pos.top,
                        left: controlPopup.pos.left,
                        zIndex: 10000
                    }}
                >
                    <button
                        className="jra-control-popup-btn jra-control-popup-option1"
                        onClick={() => {
                            // Option 1 logic here…
                            setControlPopup(cp => ({ ...cp, visible: false }));
                        }}
                    >
                        Option 1
                    </button>
                    <button
                        className="jra-control-popup-btn jra-control-popup-option2"
                        onClick={() => {
                            // Option 2 logic here…
                            setControlPopup(cp => ({ ...cp, visible: false }));
                        }}
                    >
                        Option 2
                    </button>
                </div>
            )}

            {filterPopup.visible && (
                <div
                    className="jra-filter-popup"
                    style={{
                        position: 'fixed',
                        top: filterPopup.pos.top,
                        left: filterPopup.pos.left - 10,
                        width: filterPopup.pos.width,
                        zIndex: 10000
                    }}
                >
                    <input
                        className="jra-filter-input"
                        type="text"
                        placeholder="Filter..."
                        defaultValue={filters[filterPopup.column] || ''}
                        onKeyDown={e => {
                            if (e.key === 'Enter') applyFilter(e.target.value);
                        }}
                    />
                    <div className="jra-filter-buttons">
                        <button
                            type="button"
                            className="jra-filter-apply"
                            onClick={() => {
                                const val = document
                                    .querySelector('.jra-filter-input')
                                    .value;
                                applyFilter(val);
                            }}
                        >
                            Apply
                        </button>
                        <button
                            type="button"
                            className="jra-filter-clear"
                            onClick={clearFilter}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

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
                    {unwantedEvents.map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectUnwantedEventSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {showHazardsDropdown && filteredHazards.length > 0 && (
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
                    {riskSources.map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectHazardsSuggestion(term.term)}
                        >
                            {term.term}
                        </li>
                    ))}
                </ul>
            )}

            {showExeDropdown && filteredExe.length > 0 && (
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
                    {filteredExe.map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectResponsibleSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {helpHazards && (<Hazard setClose={closeHazardsHelp} />)}
            {helpResponsible && (<ControlExecution setClose={closeResponsibleHelp} />)}
            {helpSub && (<CurrentControls setClose={closeSubHelp} />)}
            {helpTaskExecution && (<TaskExecution setClose={closeTaskExecutionHelp} />)}
            {helpUnwantedEvents && (<UnwantedEvent setClose={closeUnwantedEventsHelp} />)}
        </div>
    );
};

export default JRATable;