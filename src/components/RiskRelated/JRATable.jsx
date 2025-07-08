import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import './JRATable.css';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faArrowsUpDown, faCopy, faMagicWandSparkles, faTableColumns, faTimes, faInfoCircle, faCirclePlus, faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Hazard from "./RiskInfo/Hazard";
import UnwantedEvent from "./RiskInfo/UnwantedEvent";
import TaskExecution from "./RiskInfo/TaskExecution";
import ControlExecution from "./RiskInfo/ControlExecution";
import CurrentControls from "./RiskInfo/CurrentControls";
import { saveAs } from 'file-saver';
import axios from "axios";
import HazardJRA from "./RiskInfo/HazardJRA";
import Go_Nogo from "./RiskInfo/Go_Nogo";
import { aiRewrite, aiRewriteWED } from "../../utils/jraAI";

const JRATable = ({ formData, setFormData, isSidebarVisible }) => {
    const ibraBoxRef = useRef(null);
    const [filters, setFilters] = useState({});
    const tableWrapperRef = useRef(null);
    const [hoveredBody, setHoveredBody] = useState({ rowId: null, bodyIdx: null });
    const savedWidthRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [filteredHazards, setFilteredHazards] = useState([]);
    const [showHazardsDropdown, setShowHazardsDropdown] = useState(false);
    const [helpHazards, setHelpHazards] = useState(false);
    const [helpUnwantedEvents, setHelpUnwantedEvents] = useState(false);
    const [helpResponsible, setHelpResponsible] = useState(false);
    const [helpSub, setHelpSub] = useState(false);
    const [helpTaskExecution, setHelpTaskExecution] = useState(false);
    const [go_noGO, setGo_noGO] = useState(false);
    const [posLists, setPosLists] = useState([]);
    const [filteredMainStep, setFilteredMainStep] = useState([]);
    const [showMainStepDropdown, setShowMainStepDropdown] = useState(false);
    const [mainIndex, setMainIndex] = useState("");
    const mainStepInputRefs = useRef({});
    const syncGroups = useRef({});
    const mainOptions = ["Main Step 1", "Main Step 2", "Main Step 3", "Main Step 4", "Main Step 5", "Main Step 6"];
    const hazardsInputRefs = useRef({});
    const unwantedEventRefs = useRef({});
    const responsibleInputRefs = useRef({});
    const controlsInputRefs = useRef({});
    const [filteredControls, setFilteredControls] = useState([]);
    const [showControlsDropdown, setShowControlsDropdown] = useState(false);
    const [activeHazardCell, setActiveHazardCell] = useState({ row: null, body: null, idx: null });
    const [filteredUnwantedEvents, setFilteredUnwantedEvents] = useState([]);
    const [showUnwantedEventsDropdown, setShowUnwantedEventsDropdown] = useState(false);
    const [filteredExe, setFilteredExe] = useState([]);
    const [showExeDropdown, setShowExeDropdown] = useState(false);
    const responsibleOptions = posLists;
    const [armedDragRow, setArmedDragRow] = useState(null);
    const [draggedRowId, setDraggedRowId] = useState(null);
    const [dragOverRowId, setDragOverRowId] = useState(null);
    const draggedElRef = useRef(null);
    const [loadingTaskKey, setLoadingTaskKey] = useState(null);
    const [loadingWEDKey, setLoadingWEDKey] = useState(null);

    function syncHeight(key) {
        // 1) grab the live wrappers for this sub-step
        const els = (syncGroups.current[key] || []).filter(
            el => el instanceof HTMLElement
        );
        if (!els.length) return;

        // 2) reset all heights so they can shrink to fit
        els.forEach(el => {
            el.style.height = 'auto';
        });

        // 3) measure each at its true content height, pick the max
        const maxH = els.reduce(
            (m, el) => Math.max(m, el.scrollHeight),
            0
        );

        // 4) re-apply that max height to *all* wrappers
        els.forEach(el => {
            el.style.height = `${maxH}px`;
        });
    }

    useLayoutEffect(() => {
        // schedule all your syncs in the next paint
        const rafId = window.requestAnimationFrame(() => {
            Object.keys(syncGroups.current).forEach(key => {
                syncHeight(key);
            });
        });

        return () => window.cancelAnimationFrame(rafId);
    }, [formData.jra]);

    const handleDragStart = (e, rowId) => {
        // 1) grab the actual <tr> elements for this row-group
        const rows = Array.from(
            document.querySelectorAll(`tr[data-row-id="${rowId}"]`)
        );

        // 2) clone them into a standalone <table> offscreen
        const dragTable = document.createElement('table');
        dragTable.style.position = 'absolute';
        dragTable.style.top = '-9999px';
        rows.forEach(r => dragTable.appendChild(r.cloneNode(true)));
        document.body.appendChild(dragTable);

        // 3) let the browser know to use _that_ as the drag image
        e.dataTransfer.setDragImage(dragTable, 0, 0);

        // 4) clean up immediately (once the drag has started)
        setTimeout(() => document.body.removeChild(dragTable), 0);

        // …then carry on with your existing state-updates:
        setDraggedRowId(rowId);
        draggedElRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragOver = (e, rowId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverRowId(rowId);
    };

    const handleDragLeave = () => {
        setDragOverRowId(null);
    };

    const handleDrop = (e, dropRowId) => {
        e.preventDefault();
        if (!draggedRowId || draggedRowId === dropRowId) {
            setDraggedRowId(null);
            setDragOverRowId(null);
            setArmedDragRow(null);
            return;
        }
        setFormData(prev => {
            const newJra = [...prev.jra];
            const from = newJra.findIndex(r => r.id === draggedRowId);
            const to = newJra.findIndex(r => r.id === dropRowId);
            const [moved] = newJra.splice(from, 1);
            newJra.splice(to, 0, moved);
            // renumber
            newJra.forEach((r, i) => r.nr = i + 1);
            return { ...prev, jra: newJra };
        });
        setDraggedRowId(null);
        setDragOverRowId(null);
        setArmedDragRow(null);
    };

    const handleDragEnd = (e) => {
        if (draggedElRef.current) {
            draggedElRef.current.style.opacity = '';
            draggedElRef.current = null;
        }
        setDraggedRowId(null);
        setDragOverRowId(null);
        setArmedDragRow(null);
    };

    const handleDuplicateRow = (rowIndex) => {
        setFormData(prev => {
            // 1) shallow-clone the array
            const newJra = [...prev.jra];
            // 2) deep-clone the target row
            const rowCopy = JSON.parse(JSON.stringify(newJra[rowIndex]));
            // 3) give it a fresh row ID
            rowCopy.id = uuidv4();
            // 4) and fresh IDs for each sub-row
            rowCopy.jraBody = rowCopy.jraBody.map(body => ({
                ...body,
                idBody: uuidv4()
            }));
            // 5) insert it right below the original
            newJra.splice(rowIndex + 1, 0, rowCopy);
            // 6) re-number every row
            newJra.forEach((r, idx) => { r.nr = idx + 1; });
            // 7) push it back into formData
            return { ...prev, jra: newJra };
        });
    };

    const updateMainStep = (rowIndex, newValue) => {
        setFormData(prev => {
            const newJra = prev.jra.map((row, idx) => {
                if (idx !== rowIndex) return row;
                return {
                    ...row,
                    main: newValue
                };
            });
            return { ...prev, jra: newJra };
        });
    };

    const handleMainStepInput = (rowIndex, colId, value) => {
        closeAllDropdowns();
        updateMainStep(rowIndex, value);

        const matches = mainTaskOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredMainStep(matches);
        setShowMainStepDropdown(true);
        setMainIndex(rowIndex);

        const key = `${rowIndex}-${colId}`
        const el = mainStepInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleMainStepFocus = (rowIndex, colId) => {
        closeAllDropdowns();
        const matches = mainTaskOptions;
        setFilteredMainStep(matches);
        setShowMainStepDropdown(true);
        setMainIndex(rowIndex);

        const key = `${rowIndex}-${colId}`
        const el = mainStepInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const selectMainStepSuggestion = (suggestion) => {
        updateMainStep(mainIndex, suggestion);
        setShowMainStepDropdown(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/desgntions`);
                const data = res.data.designations;

                const positions = Array.from(new Set(data.map(d => d.person))).sort();

                setPosLists(positions);

                console.log(positions);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, []);

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

    const openGo_noGo = () => {
        setGo_noGO(true)
    }

    const closeGo_noGo = () => {
        setGo_noGO(false)
    }

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

    const [jraInfo, setJraInfo] = useState([]);

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

    const mainTaskOptions = useMemo(
        () => jraInfo.map(node => node.mainTaskStep),
        [jraInfo]
    );

    const allHazardOptions = useMemo(
        () => Array.from(
            new Set(
                jraInfo.flatMap(h => h.hazards.map(e => e.hazard))
            )
        ),
        [jraInfo]
    );

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

    function getHazardOptions(selectedMain) {
        if (!selectedMain) return allHazardOptions

        const exists = jraInfo.some(m => m.mainTaskStep === selectedMain);
        if (!exists) {
            return allHazardOptions;            // or allHazardOptions, or throw, whatever makes sense
        }

        const node = jraInfo.find(m => m.mainTaskStep === selectedMain)
        return node
            ? node.hazards.map(e => e.hazard)
            : []
    }

    function getUnwantedOptions(main, hazard) {
        // no filters → everything
        if (!main && !hazard) return allUnwantedOptions;

        if (!main && hazard) {
            // collect every unwantedEvent where h.hazard matches
            const matches = jraInfo.flatMap(node =>
                node.hazards
                    .filter(h => h.hazard === hazard)
                    .flatMap(h => h.unwantedEvents.map(e => e.unwantedEvent))
            );
            // dedupe
            return Array.from(new Set(matches));
        }

        // if main only, show *all* events under that main
        if (main && !hazard) {
            const exists = jraInfo.some(m => m.mainTaskStep === main);
            if (!exists) {
                return allUnwantedOptions;            // or allHazardOptions, or throw, whatever makes sense
            }

            const node = jraInfo.find(n => n.mainTaskStep === main);
            return node
                ? Array.from(
                    new Set(
                        node.hazards.flatMap(h =>
                            h.unwantedEvents.map(e => e.unwantedEvent)
                        )
                    )
                )
                : [];
        }

        // if both main + hazard
        const exists = jraInfo.some(m => m.mainTaskStep === main);
        if (exists) {
            const node = jraInfo.find(n => n.mainTaskStep === main);
            const haz = node?.hazards.find(h => h.hazard === hazard);
            return haz ? haz.unwantedEvents.map(e => e.unwantedEvent) : [];
        }
        else {
            const matches = jraInfo.flatMap(node =>
                node.hazards
                    .filter(h => h.hazard === hazard)
                    .flatMap(h => h.unwantedEvents.map(e => e.unwantedEvent))
            );
            // dedupe
            return Array.from(new Set(matches));
        }
    }

    function getSubStepOptions(main, hazard, ue) {
        // no filters
        if (!main && !hazard && !ue) return allSubStepOptions;

        // main only
        if (main && !hazard && !ue) {
            const exists = jraInfo.some(m => m.mainTaskStep === main);
            if (!exists) {
                return allSubStepOptions;            // or allHazardOptions, or throw, whatever makes sense
            }

            const node = jraInfo.find(n => n.mainTaskStep === main);
            return node
                ? Array.from(
                    new Set(
                        node.hazards.flatMap(h =>
                            h.unwantedEvents.flatMap(e => e.subTaskSteps)
                        )
                    )
                )
                : [];
        }

        // main + hazard only
        if (main && hazard && !ue) {
            const exists = jraInfo.some(m => m.mainTaskStep === main);
            if (!exists) {
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

            const node = jraInfo.find(n => n.mainTaskStep === main);
            const haz = node?.hazards.find(h => h.hazard === hazard);
            return haz
                ? Array.from(new Set(haz.unwantedEvents.flatMap(e => e.subTaskSteps)))
                : [];
        }

        // **hazard only**  ← new!
        if (!main && hazard && !ue) {
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

        // main + hazard + UE
        if (main && hazard && ue) {
            const exists = jraInfo.some(m => m.mainTaskStep === main);
            if (!exists) {
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

            const node = jraInfo.find(n => n.mainTaskStep === main);
            const haz = node?.hazards.find(h => h.hazard === hazard);
            const ev = haz?.unwantedEvents.find(e => e.unwantedEvent === ue);
            return ev ? ev.subTaskSteps : [];
        }

        // UE only (across all mains)
        if (!main && !hazard && ue) {
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

        // hazard + UE (across all mains)
        if (!main && hazard && ue) {
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

        return [];
    }

    const [filterPopup, setFilterPopup] = useState({
        visible: false,
        column: null,
        pos: { top: 0, left: 0, width: 0 }
    });

    const closeAllDropdowns = () => {
        setShowExeDropdown(null);
        setShowHazardsDropdown(false);
        setShowControlsDropdown(false);
        setShowMainStepDropdown(false);
        setShowUnwantedEventsDropdown(false);
    };

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
            } else {
                survivingBodies = survivingBodies.filter(body =>
                    extractBodyValues(body, colId)
                        .some(val => val.toLowerCase().includes(lcText))
                );
                if (survivingBodies.length === 0) {
                    keepRow = false;
                    break;
                }
            }
        }

        if (keepRow) {
            acc.push({ ...row, jraBody: survivingBodies });
        }
        return acc;

    }, []);

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
        const base = getHazardOptions(formData.jra[rowIndex].main);
        const matches = base
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
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
        const base = getHazardOptions(formData.jra[rowIndex].main);
        setFilteredHazards(base);
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
        const base = getUnwantedOptions(formData.jra[rowIndex].main, formData.jra[rowIndex].jraBody[bodyIdx].hazards[0].hazard);
        const matches = base
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
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

    const handleUnwantedEventFocus = (rowIndex, bodyIdx, hIdx) => {
        closeAllDropdowns();
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });
        const base = getUnwantedOptions(formData.jra[rowIndex].main, formData.jra[rowIndex].jraBody[bodyIdx].hazards[0].hazard);
        setFilteredUnwantedEvents(base);
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
        syncHeight(`${rowIndex}-${bodyIdx}-${hIdx}`)
        closeAllDropdowns();
        updateResponsible(rowIndex, bodyIdx, hIdx, value);
        const matches = responsibleOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
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

    const handleResponsibleFocus = (rowIndex, bodyIdx, hIdx) => {
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });
        setFilteredExe(responsibleOptions);
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

    const selectResponsibleSuggestion = (suggestion) => {
        const { row, body, idx } = activeHazardCell;
        updateResponsible(row, body, idx, suggestion);
        setShowExeDropdown(false);
    };

    const updateSubStep = (rowIndex, bodyIdx, hIdx, newValue) => {
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
                            sub: body.sub.map((hObj, h) => {
                                if (h !== hIdx) return hObj;
                                return { ...hObj, task: newValue };
                            })
                        };
                    })
                };
            });
            return { ...prev, jra: newJra };
        });
    };

    const handleSubStepInput = (rowIndex, bodyIdx, hIdx, value) => {
        closeAllDropdowns();
        updateSubStep(rowIndex, bodyIdx, hIdx, value);

        const main = formData.jra[rowIndex].main;
        const haz = formData.jra[rowIndex].jraBody[bodyIdx].hazards[0].hazard;
        const ue = formData.jra[rowIndex].jraBody[bodyIdx].UE[0].ue;
        const base = getSubStepOptions(main, haz, ue);
        const matches = base.filter(opt =>
            opt.toLowerCase().includes(value.toLowerCase())
        );

        setFilteredControls(matches);
        setShowControlsDropdown(true);
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;

        window.requestAnimationFrame(() => {
            syncHeight(key);
        });

        const el = controlsInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleSubStepFocus = (rowIndex, bodyIdx, hIdx) => {
        setActiveHazardCell({ row: rowIndex, body: bodyIdx, idx: hIdx });
        const main = formData.jra[rowIndex].main;
        const haz = formData.jra[rowIndex].jraBody[bodyIdx].hazards[0].hazard;
        const ue = formData.jra[rowIndex].jraBody[bodyIdx].UE[0].ue;
        const base = getSubStepOptions(main, haz, ue);
        setFilteredControls(base);
        setShowControlsDropdown(true);

        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
        const el = controlsInputRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const selectSubStepSuggestion = (suggestion) => {
        const { row, body, idx } = activeHazardCell;
        updateSubStep(row, body, idx, suggestion);
        setShowControlsDropdown(false);
    };

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

    const removeSubControl = (rowId, bodyId, idx) => {
        setFormData(prev => ({
            ...prev,
            jra: prev.jra.map(item => {
                if (item.id !== rowId) return item;
                return {
                    ...item,
                    jraBody: item.jraBody.map(body => {
                        if (body.idBody !== bodyId) return body;

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
            const newEntry = {
                id: uuidv4(),
                nr: null,
                main: "",
                jraBody: [{
                    idBody: uuidv4(),
                    hazards: [{ hazard: "Work Execution" }],
                    UE: [{ ue: "Non-adherence to task step requirements / specifications" }],
                    sub: [{ task: "" }],
                    taskExecution: [{ R: "" }],
                    controls: [{ control: "" }],
                    go_noGo: [{ go: "" }],
                }]
            };

            const newJra = [
                ...prev.jra.slice(0, afterIndex + 1),
                newEntry,
                ...prev.jra.slice(afterIndex + 1)
            ];

            const renumbered = newJra.map((item, idx) => ({
                ...item,
                nr: idx + 1
            }));

            return { ...prev, jra: renumbered };
        });
    };

    const availableColumns = [
        { id: "nr", title: "Nr", className: "ibraCent ibraNr", icon: null },
        { id: "main", title: "Main Task Step", className: "ibraCent ibraMainJRA", icon: null },
        { id: "hazards", title: "Hazard Classification / Energy Release", className: "ibraCent ibraHazJRA", icon: faInfoCircle },
        { id: "UE", title: "Unwanted Event", className: "ibraCent jraStatus", icon: faInfoCircle },
        { id: "sub", title: "Controls/ Sub Task Steps\n(Procedure to complete the Main Task Step)", className: "ibraCent ibraSubJRA", icon: faInfoCircle },
        { id: "taskExecution", title: "Task Execution", className: "ibraCent ibraTXJRA", icon: faInfoCircle },
        { id: "controls", title: "Control Execution Specification\n(For Work Execution Document [WED])", className: "ibraCent ibraEXEJRA", icon: faInfoCircle },
        { id: "go", title: "Go/ No-Go", className: "ibraCent ibraDeadlineJRA", icon: faInfoCircle },
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
            case "go": {
                openGo_noGo();
                break;
            }
        }
    }

    const removeBodyRow = (rowId, bodyId) => {
        setFormData(prev => {
            const newJra = prev.jra.flatMap(item => {
                if (item.id !== rowId) return item;

                if (item.jraBody.length === 1) {
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
                    return [];
                }

                return {
                    ...item,
                    jraBody: item.jraBody.filter(b => b.idBody !== bodyId)
                };
            });

            const renumbered = newJra.map((j, i) => ({ ...j, nr: i + 1 }));
            return { ...prev, jra: renumbered };
        });
    };

    const removeRow = (rowId) => {
        setFormData(prev => {
            // Don’t allow deleting the last row
            if (prev.jra.length === 1) {
                toast.clearWaitingQueue();
                toast.dismiss();
                toast.error("You must keep at least one row.", {
                    closeButton: true,
                    autoClose: 800,
                    style: { textAlign: 'center' }
                });
                return prev;
            }

            // 1) Remove the entire row
            const filtered = prev.jra.filter(item => item.id !== rowId);

            // 2) Renumber the remaining rows
            const renumbered = filtered.map((j, i) => ({ ...j, nr: i + 1 }));

            // 3) Write back into formData
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
            if (e.target.closest('input, textarea, select, button') || e.target.closest('.drag-handle')) {
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
            tableWrapperRef.current.style.width = `${boxW - 60}px`;
        };
        window.addEventListener('resize', adjust);
        adjust();
        return () => window.removeEventListener('resize', adjust);
    }, []);

    useEffect(() => {
        const wrapper = tableWrapperRef.current;
        if (!wrapper) return;

        if (!isSidebarVisible) {
            savedWidthRef.current = wrapper.offsetWidth;
        } else if (savedWidthRef.current != null) {
            wrapper.style.width = `${savedWidthRef.current}px`;
            return;
        }
        const boxW = ibraBoxRef.current.offsetWidth;
        wrapper.style.width = `${boxW - 30}px`;
    }, [isSidebarVisible]);

    const [showColumns, setShowColumns] = useState([
        "nr", "main", "hazards", "sub", "UE", "taskExecution", "controls", "go", "action",
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

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            const allColumns = availableColumns
                .map(col => col.id)
                .filter(id => id !== 'action');
            setShowColumns([...allColumns, 'action']);
        } else {
            setShowColumns(['nr', 'action']);
        }
    };

    const areAllColumnsSelected = () => {
        const selectableColumns = availableColumns
            .filter(col => col.id !== 'action')
            .map(col => col.id);

        return selectableColumns.every(colId =>
            showColumns.includes(colId) || colId === 'nr'
        );
    };

    const displayColumns = getDisplayColumns();

    useEffect(() => {
        const popupSelector = '.floating-dropdown';
        const columnSelector = '.column-selector-popup';
        const filterSelector = ".jra-filter-popup";

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(columnSelector) &&
                !e.target.closest(filterSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(columnSelector) || e.target.closest(filterSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowColumnSelector(null);
            setShowExeDropdown(false);
            setShowHazardsDropdown(false);
            setShowUnwantedEventsDropdown(false);
            setShowControlsDropdown(false);
            setShowMainStepDropdown(false);
            setFilterPopup(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showColumnSelector, showExeDropdown, showHazardsDropdown, showUnwantedEventsDropdown, filterPopup, showMainStepDropdown, showControlsDropdown]);

    const handleAiRewrite = async (rowIndex, bodyIdx, sIdx) => {
        const control = formData.jra[rowIndex].jraBody[bodyIdx].sub[sIdx].task;
        const key = `${rowIndex}-${bodyIdx}-${sIdx}`;
        setLoadingTaskKey(key);

        try {
            const newText = await aiRewrite(control, "chatControl/jra");
            setFormData(fd => ({
                ...fd,
                jra: fd.jra.map((row, r) => {
                    if (r !== rowIndex) return row;
                    return {
                        ...row,
                        jraBody: row.jraBody.map((body, b) => {
                            if (b !== bodyIdx) return body;
                            return {
                                ...body,
                                sub: body.sub.map((sub, i) =>
                                    i !== sIdx ? sub : { ...sub, task: newText }
                                )
                            };
                        })
                    };
                })
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTaskKey(null);
        }
    };

    const handleAiWEDCreate = async (rowIndex, bodyIdx, sIdx) => {
        const control = formData.jra[rowIndex].jraBody[bodyIdx].sub[sIdx].task;
        const responsible = formData.jra[rowIndex].jraBody[bodyIdx].taskExecution[sIdx].R;
        const key = `${rowIndex}-${bodyIdx}-${sIdx}`;
        setLoadingWEDKey(key);

        try {
            const newText = await aiRewriteWED(control, responsible, "chatWED/jra");
            setFormData(fd => ({
                ...fd,
                jra: fd.jra.map((row, r) => {
                    if (r !== rowIndex) return row;
                    return {
                        ...row,
                        jraBody: row.jraBody.map((body, b) => {
                            if (b !== bodyIdx) return body;
                            return {
                                ...body,
                                controls: body.controls.map((ctl, i) =>
                                    i !== sIdx ? ctl : { ...ctl, control: newText }
                                )
                            };
                        })
                    };
                })
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingWEDKey(null);
        }
    };

    return (
        <div className="input-row-risk-ibra">
            <div className="ibra-box" ref={ibraBoxRef}>
                <h3 className="font-fam-labels">Job Risk Assessment (JRA) <span className="required-field">*</span></h3>
                <button
                    className="top-right-button-ibra"
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
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
                                <p>{showColumns.length - 1} columns selected</p>
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
                                            {column.icon && (
                                                <FontAwesomeIcon icon={column.icon} className="header-icon" onClick={e => {
                                                    e.stopPropagation();
                                                    openInfo(column.id);
                                                }} />
                                            )}
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
                                                className={`jra-body-row ${row.nr % 2 === 0 ? 'weRow' : ''}`}
                                                data-row-id={row.id}
                                                key={`${row.id}-${body.idBody}`}
                                                onMouseEnter={() => setHoveredBody({ rowId: row.id, bodyIdx })}
                                                onMouseLeave={() => setHoveredBody({ rowId: null, bodyIdx: null })}
                                                draggable={armedDragRow === row.id}
                                                onDragStart={armedDragRow === row.id ? e => handleDragStart(e, row.id) : undefined}
                                                onDragOver={e => handleDragOver(e, row.id)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={e => handleDrop(e, row.id)}
                                                onDragEnd={handleDragEnd}
                                            >
                                                {displayColumns.map((colId, colIdx) => {
                                                    if ((colId === 'nr' || colId === 'main') && bodyIdx > 0) {
                                                        return null;
                                                    }

                                                    const meta = availableColumns.find(c => c.id === colId);
                                                    const cls = meta?.className || "";

                                                    if (colId === "nr" && bodyIdx === 0) {
                                                        return (
                                                            <td key={colIdx} rowSpan={rowCount} className={cls}>
                                                                <span>{row.nr}</span>
                                                                <FontAwesomeIcon
                                                                    icon={faArrowsUpDown}
                                                                    className="drag-handle"
                                                                    onMouseDown={() => setArmedDragRow(row.id)}
                                                                    onMouseUp={() => setArmedDragRow(null)}
                                                                    style={{ cursor: 'grab' }}
                                                                />
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
                                                                        ref={el => {
                                                                            const key = `${rowIndex}-${colId}`;
                                                                            if (el) {
                                                                                mainStepInputRefs.current[key] = el;
                                                                            } else {
                                                                                delete mainStepInputRefs.current[key];
                                                                            }
                                                                        }}
                                                                        value={row.main}
                                                                        onChange={e => handleMainStepInput(rowIndex, colId, e.target.value)}
                                                                        onFocus={() => handleMainStepFocus(rowIndex, colId)}
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

                                                                <button
                                                                    type="button"
                                                                    className="delete-mainrow-button"
                                                                    title="Delete Main Step"
                                                                    onClick={() => removeRow(row.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="duplicate-mainrow-button"
                                                                    title="Duplicate Main Step"
                                                                    onClick={() => handleDuplicateRow(rowIndex)}
                                                                >
                                                                    <FontAwesomeIcon icon={faCopy} />
                                                                </button>
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "action") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                <FontAwesomeIcon
                                                                    icon={faCirclePlus}
                                                                    style={{ marginBottom: "0px" }}
                                                                    className="control-icon-action plus-icon"
                                                                    title="Add sub & control here"
                                                                    onClick={() => insertMainRow(rowIndex)}
                                                                />

                                                                {bodyIdx !== 0 && (
                                                                    <FontAwesomeIcon icon={faTrash} style={{ marginBottom: "0px", marginTop: "10px" }} className="control-icon-action font-fam"
                                                                        title={
                                                                            row.jraBody.length > 1
                                                                                ? "Delete Sub-step"
                                                                                : "Delete Row"
                                                                        }
                                                                        onClick={() =>
                                                                            removeBodyRow(row.id, body.idBody)
                                                                        } />
                                                                )}

                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "hazards") {
                                                        return (
                                                            <td key={colIdx} className={`hazard-cell`}>
                                                                {body.hazards.map((hObj, hIdx) => {
                                                                    const isFirst = bodyIdx === 0;
                                                                    if (isFirst) {
                                                                        return (
                                                                            <div key={hIdx} className="static-cell hazard-static jra-normal-text">
                                                                                {hObj.hazard}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <div className="ibra-popup-page-select-container" key={hIdx}>
                                                                            <div className="ibra-popup-page-select-container">
                                                                                <input
                                                                                    type="text"
                                                                                    style={{ color: "black", cursor: "text", marginBottom: "5px" }}
                                                                                    ref={el => {
                                                                                        const key = `${rowIndex}-${bodyIdx}-${hIdx}`;
                                                                                        if (el) {
                                                                                            hazardsInputRefs.current[key] = el;
                                                                                        } else {
                                                                                            delete hazardsInputRefs.current[key];
                                                                                        }
                                                                                    }}
                                                                                    readOnly={isFirst}
                                                                                    className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                                    placeholder="Select Hazard"
                                                                                    value={hObj.hazard}
                                                                                    onChange={e => {
                                                                                        handleHazardsInput(rowIndex, bodyIdx, hIdx, e.target.value);
                                                                                    }}
                                                                                    onFocus={() => {
                                                                                        handleHazardsFocus(rowIndex, bodyIdx, hIdx);
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
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

                                                    if (colId === "UE") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                {body.UE.map((uObj, uIdx) => {
                                                                    const isFirst = bodyIdx === 0;

                                                                    if (isFirst) {
                                                                        return (
                                                                            <div key={uIdx} className="jra-normal-text">
                                                                                {uObj.ue}
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div className="ibra-popup-page-select-container" key={uIdx}>
                                                                            <div className="ibra-popup-page-select-container">
                                                                                <textarea
                                                                                    type="text"
                                                                                    style={{
                                                                                        display: "block",
                                                                                        width: "100%",
                                                                                        marginBottom: "5px"
                                                                                    }}
                                                                                    ref={el => {
                                                                                        const key = `${rowIndex}-${bodyIdx}-${uIdx}`;
                                                                                        if (el) {
                                                                                            unwantedEventRefs.current[key] = el;
                                                                                        } else {
                                                                                            delete unwantedEventRefs.current[key];
                                                                                        }
                                                                                    }}
                                                                                    className="aim-textarea-ue-jra"
                                                                                    placeholder="Select Unwanted Event"
                                                                                    value={uObj.ue}
                                                                                    readOnly={isFirst}
                                                                                    onChange={e => {
                                                                                        handleUnwantedEventInput(rowIndex, bodyIdx, uIdx, e.target.value);
                                                                                    }}
                                                                                    onFocus={() => {
                                                                                        handleUnwantedEventFocus(rowIndex, bodyIdx, uIdx);
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "sub") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                {body.sub.map((sObj, sIdx) => (
                                                                    <div className="test-jra"
                                                                        ref={el => {
                                                                            const key = `${rowIndex}-${bodyIdx}-${sIdx}`;
                                                                            const arr = (syncGroups.current[key] ||= []);
                                                                            if (el) arr.push(el);
                                                                            else syncGroups.current[key] = arr.filter(x => x !== el);
                                                                        }}
                                                                    >
                                                                        <div className="control-with-icons" key={colIdx}>
                                                                            <textarea
                                                                                ref={el => {
                                                                                    const key = `${rowIndex}-${bodyIdx}-${sIdx}`;
                                                                                    if (el) {
                                                                                        controlsInputRefs.current[key] = el;
                                                                                    } else {
                                                                                        delete controlsInputRefs.current[key];
                                                                                    }
                                                                                }}
                                                                                className="aim-textarea-sub-jra"
                                                                                rows={1}
                                                                                value={sObj.task}
                                                                                style={{
                                                                                    display: "block",
                                                                                    width: "100%",
                                                                                    marginBottom: "5px"
                                                                                }}
                                                                                onChange={e => handleSubStepInput(rowIndex, bodyIdx, sIdx, e.target.value)}
                                                                                onFocus={() => handleSubStepFocus(rowIndex, bodyIdx, sIdx)}
                                                                            />

                                                                            {loadingTaskKey === `${rowIndex}-${bodyIdx}-${sIdx}`
                                                                                ? <FontAwesomeIcon
                                                                                    icon={faSpinner}
                                                                                    className="control-icon-ai magic-icon spin-animation"
                                                                                />
                                                                                : <FontAwesomeIcon
                                                                                    icon={faMagicWandSparkles}
                                                                                    className="control-icon-ai magic-icon"
                                                                                    title="AI Rewrite"
                                                                                    onClick={() => handleAiRewrite(rowIndex, bodyIdx, sIdx)}
                                                                                />
                                                                            }

                                                                            <div className="icons-add-delete-jra">

                                                                                <FontAwesomeIcon
                                                                                    icon={faCirclePlus}
                                                                                    className="control-icon plus-icon"
                                                                                    title="Add sub & control here"
                                                                                    onClick={() => insertSubControl(row.id, body.idBody)}
                                                                                />
                                                                                <FontAwesomeIcon
                                                                                    icon={faTrash}
                                                                                    className="control-icon trash-icon"
                                                                                    title="Remove this control & sub-step"
                                                                                    onClick={() => removeSubControl(row.id, body.idBody, sIdx)}
                                                                                />

                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "taskExecution") {
                                                        const TE = body.taskExecution[0];
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                {body.taskExecution.map((teObj, teIdx) => (
                                                                    <div className="test-jra"
                                                                        ref={el => {
                                                                            const key = `${rowIndex}-${bodyIdx}-${teIdx}`;
                                                                            const arr = (syncGroups.current[key] ||= []);
                                                                            if (el) arr.push(el);
                                                                            else syncGroups.current[key] = arr.filter(x => x !== el);
                                                                        }}
                                                                    >
                                                                        <div className="ibra-popup-page-select-container">
                                                                            <div className="select-wrapper" style={{ marginBottom: "5px" }}>
                                                                                <label className={`select-label-proc`}>R:</label>

                                                                                <textarea
                                                                                    ref={el => {
                                                                                        const key = `${rowIndex}-${bodyIdx}-${teIdx}`;
                                                                                        if (el) {
                                                                                            responsibleInputRefs.current[key] = el;
                                                                                        } else {
                                                                                            delete responsibleInputRefs.current[key];
                                                                                        }
                                                                                    }}
                                                                                    className="aim-textarea-sub-jra-tx"
                                                                                    rows={1}
                                                                                    value={teObj.R}
                                                                                    style={{
                                                                                        display: "block",
                                                                                        width: "100%",
                                                                                    }}
                                                                                    onChange={e => handleResponsibleInput(rowIndex, bodyIdx, teIdx, e.target.value)}
                                                                                    onFocus={() => handleResponsibleFocus(rowIndex, bodyIdx, teIdx)}
                                                                                    placeholder="Select Responsible"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "controls") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                {body.controls.map((cObj, cIdx) => (
                                                                    <div className="test-jra"
                                                                        ref={el => {
                                                                            const key = `${rowIndex}-${bodyIdx}-${cIdx}`;
                                                                            const arr = (syncGroups.current[key] ||= []);
                                                                            if (el) arr.push(el);
                                                                            else syncGroups.current[key] = arr.filter(x => x !== el);
                                                                        }}
                                                                    >
                                                                        <div className="control-with-icons" key={cIdx}>
                                                                            <textarea
                                                                                key={cIdx}
                                                                                className="aim-textarea-WED-jra"
                                                                                rows={1}
                                                                                value={cObj.control}
                                                                                style={{
                                                                                    display: "block",
                                                                                    marginBottom: "5px",
                                                                                    paddingRight: "35px",
                                                                                }}
                                                                                onChange={e => {
                                                                                    const upd = [...formData.jra];
                                                                                    upd[rowIndex].jraBody[bodyIdx].controls[cIdx].control = e.target.value;
                                                                                    updateRows(upd);
                                                                                    syncHeight(`${rowIndex}-${bodyIdx}-${cIdx}`)
                                                                                }}
                                                                            />

                                                                            {loadingWEDKey === `${rowIndex}-${bodyIdx}-${cIdx}`
                                                                                ? <FontAwesomeIcon
                                                                                    icon={faSpinner}
                                                                                    className="control-icon-ai magic-icon spin-animation"
                                                                                />
                                                                                : <FontAwesomeIcon
                                                                                    icon={faMagicWandSparkles}
                                                                                    className="control-icon-ai magic-icon"
                                                                                    title="AI Rewrite"
                                                                                    onClick={() => handleAiWEDCreate(rowIndex, bodyIdx, cIdx)}
                                                                                />
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }

                                                    if (colId === "go") {
                                                        return (
                                                            <td key={colIdx} className={`${cls}`} >
                                                                {body.go_noGo.map((goObj, goIdx) => (
                                                                    <div className="test-jra"
                                                                        ref={el => {
                                                                            const key = `${rowIndex}-${bodyIdx}-${goIdx}`;
                                                                            const arr = (syncGroups.current[key] ||= []);
                                                                            if (el) arr.push(el);
                                                                            else syncGroups.current[key] = arr.filter(x => x !== el);
                                                                        }}
                                                                    >
                                                                        <div className="ibra-popup-page-select-container">
                                                                            <select
                                                                                key={goIdx}
                                                                                className="ibra-popup-page-select"
                                                                                value={goObj.go}
                                                                                style={{
                                                                                    display: "block",
                                                                                    marginBottom: "5px",
                                                                                    paddingRight: "35px",
                                                                                }}
                                                                                onChange={e => {
                                                                                    const upd = [...formData.jra];
                                                                                    upd[rowIndex].jraBody[bodyIdx].go_noGo[goIdx].go = e.target.value;
                                                                                    updateRows(upd);
                                                                                }}
                                                                            >
                                                                                <option value=""> </option>
                                                                                <option value="X">X</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        );
                                                    }
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
                    {filteredUnwantedEvents.map((term, i) => (
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
                    {filteredHazards.map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectHazardsSuggestion(term)}
                        >
                            {term}
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
                    {filteredExe.filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectResponsibleSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {showMainStepDropdown && filteredMainStep.length > 0 && (
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
                    {filteredMainStep.filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectMainStepSuggestion(term)}
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
                >
                    {filteredControls.filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectSubStepSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {helpHazards && (<HazardJRA setClose={closeHazardsHelp} />)}
            {helpResponsible && (<ControlExecution setClose={closeResponsibleHelp} />)}
            {helpSub && (<CurrentControls setClose={closeSubHelp} />)}
            {helpTaskExecution && (<TaskExecution setClose={closeTaskExecutionHelp} />)}
            {helpUnwantedEvents && (<UnwantedEvent setClose={closeUnwantedEventsHelp} />)}
            {go_noGO && (<Go_Nogo setClose={closeGo_noGo} />)}
        </div>
    );
};

export default JRATable;