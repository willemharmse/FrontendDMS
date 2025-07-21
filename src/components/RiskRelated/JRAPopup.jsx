import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import './JRAPopup.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus, faMagicWandSparkles, faChevronRight, faChevronDown, faPlusCircle, faUndo } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { aiRewrite, aiRewriteWED } from "../../utils/jraAI";
import { v4 as uuidv4 } from 'uuid';

const JRAPopup = ({ onClose, data, onSubmit, nr, formData }) => {
    const [activeHazardCell, setActiveHazardCell] = useState(null);
    const [activeSubCell, setActiveSubCell] = useState(null);
    const ownersInputRef = useRef(null);
    const [jraInfo, setJraInfo] = useState([]);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [filteredMainStep, setFilteredMainStep] = useState([]);
    const [showMainStepDropdown, setShowMainStepDropdown] = useState(false);
    const mainStepInputRef = useRef();
    const [filteredUnwantedEvents, setFilteredUnwantedEvents] = useState([]);
    const [showUnwantedEventsDropdown, setShowUnwantedEventsDropdown] = useState(false);
    const [filteredControls, setFilteredControls] = useState([]);
    const [showControlsDropdown, setShowControlsDropdown] = useState(false);
    const [filteredExe, setFilteredExe] = useState([]);
    const [showExeDropdown, setShowExeDropdown] = useState(false);
    const [posLists, setPosLists] = useState([]);
    const hazardsInputRefs = useRef({});
    const [sourceData, setSourceData] = useState([]);
    const [jraData, setJraData] = useState(data);
    const unwantedEventRefs = useRef({});
    const responsibleInputRefs = useRef({});
    const controlsInputRefs = useRef({});
    const [loadingWEDKey, setLoadingWEDKey] = useState(false);
    const [loadingControlKey, setLoadingControlKey] = useState(false);
    const [collapsedControls, setCollapsedControls] = useState({});
    const controlsScrollRefs = useRef([]);
    const [wedHistory, setWedHistory] = useState({});
    const [controlHistory, setControlHistory] = useState({});

    useEffect(() => {
        // cleanups for each slider
        const cleanups = controlsScrollRefs.current.map(slider => {
            if (!slider) return null;
            let isDown = false;
            let startX;
            let scrollLeft;

            const onMouseDown = e => {
                if (e.target.closest('input, textarea, select, [contenteditable]')) return;
                isDown = true;
                slider.classList.add('active');
                document.body.style.userSelect = 'none';
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            };
            const onMouseUp = () => {
                if (!isDown) return;
                isDown = false;
                slider.classList.remove('active');
                document.body.style.userSelect = '';
            };
            const onMouseLeave = onMouseUp;
            const onMouseMove = e => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = x - startX;
                slider.scrollLeft = scrollLeft - walk;
            };

            slider.addEventListener('mousedown', onMouseDown);
            slider.addEventListener('mouseup', onMouseUp);
            slider.addEventListener('mouseleave', onMouseLeave);
            slider.addEventListener('mousemove', onMouseMove);

            return () => {
                slider.removeEventListener('mousedown', onMouseDown);
                slider.removeEventListener('mouseup', onMouseUp);
                slider.removeEventListener('mouseleave', onMouseLeave);
                slider.removeEventListener('mousemove', onMouseMove);
            };
        });

        return () => {
            cleanups.forEach(fn => fn && fn());
        };
    }, [jraData.jraBody.length]);

    const handleAiWEDCreate = async (stepIndex, subIndex) => {
        const control = jraData.jraBody[stepIndex].sub[subIndex].task;
        const curVal = jraData.jraBody[stepIndex].controls[subIndex].control;
        const key = `${stepIndex}-${subIndex}`;
        setWedHistory(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), curVal]
        }));
        const responsible = jraData.jraBody[stepIndex].taskExecution[subIndex].R;
        setLoadingWEDKey(true);

        try {
            const newText = await aiRewriteWED(control, responsible, "chatWED/jra");
            setJraData(prev => ({
                ...prev,
                jraBody: prev.jraBody.map((body, bIdx) => {
                    if (bIdx !== stepIndex) return body;
                    return {
                        ...body,
                        controls: body.controls.map((controlObj, cIdx) =>
                            cIdx === subIndex
                                ? { ...controlObj, control: newText }
                                : controlObj
                        )
                    };
                })
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingWEDKey(false);
        }
    };

    const handleAiRewrite = async (stepIndex, subIndex) => {
        const control = jraData.jraBody[stepIndex].sub[subIndex].task;
        const key = `${stepIndex}-${subIndex}`;
        setControlHistory(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), control]
        }));
        setLoadingControlKey(key);

        try {
            const newText = await aiRewrite(control, "chatControl/jra");
            setJraData(prev => ({
                ...prev,
                jraBody: prev.jraBody.map((body, bIdx) => {
                    if (bIdx !== stepIndex) return body;
                    return {
                        ...body,
                        sub: body.sub.map((subObj, sIdx) =>
                            sIdx === subIndex
                                ? { ...subObj, task: newText }
                                : subObj
                        )
                    };
                })
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingControlKey(null);
        }
    };

    const handleUndoWED = (stepIndex, subIndex) => {
        const key = `${stepIndex}-${subIndex}`;
        const history = wedHistory[key] || [];
        if (history.length === 0) return;

        const previous = history[history.length - 1];

        // restore the last version
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    controls: body.controls.map((ctl, cIdx) =>
                        cIdx === subIndex
                            ? { ...ctl, control: previous }
                            : ctl
                    )
                };
            })
        }));

        // pop from history
        setWedHistory(prev => {
            const next = [...history.slice(0, -1)];
            const out = { ...prev };
            if (next.length) out[key] = next;
            else delete out[key];
            return out;
        });
    };

    const handleUndoControl = (stepIndex, subIndex) => {
        const key = `${stepIndex}-${subIndex}`;
        const history = controlHistory[key] || [];
        if (history.length === 0) return;

        const previous = history[history.length - 1];

        // restore the last version
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    sub: body.sub.map((subObj, sIdx) =>
                        sIdx === subIndex
                            ? { ...subObj, task: previous }
                            : subObj
                    )
                };
            })
        }));

        // pop from history
        setControlHistory(prev => {
            const next = [...history.slice(0, -1)];
            const out = { ...prev };
            if (next.length) out[key] = next;
            else delete out[key];
            return out;
        });
    };

    const handleDeleteGroup = (stepIndex) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.filter((_, idx) => idx !== stepIndex)
        }));
    };

    const handleDeleteSubRow = (stepIndex, subIndex) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                // helper that drops index `subIndex`
                const removeAt = (arr) => arr.filter((_, i) => i !== subIndex);
                return {
                    ...body,
                    sub: removeAt(body.sub),
                    controls: removeAt(body.controls),
                    taskExecution: removeAt(body.taskExecution),
                    go_noGo: removeAt(body.go_noGo),
                };
            })
        }));
    };

    const handleAddGroup = (stepIndex) => {
        setJraData(prev => {
            // define one “empty” group
            const newGroup = {
                idBody: uuidv4(),
                hazards: [{ hazard: "" }],
                UE: [{ ue: "" }],
                sub: [{ task: "" }],
                taskExecution: [{ R: "" }],
                controls: [{ control: "" }],
                go_noGo: [{ go: "" }]
            };

            // splice it in right after stepIndex
            const nextBodies = [
                ...prev.jraBody.slice(0, stepIndex + 1),
                newGroup,
                ...prev.jraBody.slice(stepIndex + 1)
            ];

            return { ...prev, jraBody: nextBodies };
        });
    };

    const handleAddSubRow = (stepIndex, subIndex) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;

                // helper to insert a blank item into an array at pos
                const insertAt = (arr, pos, blank) => [
                    ...arr.slice(0, pos + 1),
                    blank,
                    ...arr.slice(pos + 1)
                ];

                return {
                    ...body,
                    sub: insertAt(body.sub, subIndex, { task: "" }),
                    controls: insertAt(body.controls, subIndex, { control: "" }),
                    go_noGo: insertAt(body.go_noGo, subIndex, { go: "" }),
                    taskExecution: insertAt(body.taskExecution, subIndex, { R: "" }),
                };
            })
        }));
    };

    const closeAllDropdowns = () => {
        setShowMainStepDropdown(null);
        setShowControlsDropdown(null);
        setShowUnwantedEventsDropdown(null);
        setShowExeDropdown(null);
    };

    useEffect(() => {
        const popupSelector = '.floating-dropdown';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('input');
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
            setShowMainStepDropdown(null);
            setShowUnwantedEventsDropdown(null);
            setShowControlsDropdown(null);
            setShowExeDropdown(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showMainStepDropdown, showUnwantedEventsDropdown, showControlsDropdown, showExeDropdown]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/desgntions`);
                const data = res.data.designations;

                const backendPositions = Array.from(
                    new Set(data.map(d => d.person))
                );

                const existingRs = formData.jra
                    .flatMap(jraItem =>
                        jraItem.jraBody.flatMap(body =>
                            body.taskExecution.map(te => te.R)
                        )
                    )
                    .filter(r => r && !backendPositions.includes(r));

                const combined = Array.from(
                    new Set([...backendPositions, ...existingRs])
                ).sort();

                setPosLists(combined);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        async function fetchValues() {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/jraInfo`);
                if (!res.ok) throw new Error('Failed to fetch lookup data');
                const { jraInfo: raw } = await res.json();
                const jraList = Array.isArray(raw[0]) ? raw[0] : raw;
                console.log("Fetched JRA Info:", jraList);
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

    const allHazardOptions = sourceData;

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
        if (!hazard) return allUnwantedOptions.slice().sort(); // sort alphabetically

        // collect every unwantedEvent where h.hazard matches
        const matches = jraInfo.flatMap(node =>
            node.hazards
                .filter(h => h.hazard === hazard)
                .flatMap(h => h.unwantedEvents.map(e => e.unwantedEvent))
        );

        // dedupe and sort
        return Array.from(new Set(matches)).sort();
    }

    useEffect(() => {
        console.log("JRAPopup data:", data);
    }, [data]);

    const handleMainStepInput = (value) => {
        closeAllDropdowns();
        handleMainTaskStepChange(value);

        const matches = mainTaskOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredMainStep(matches);
        setShowMainStepDropdown(true);

        const el = mainStepInputRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleMainStepFocus = (value) => {
        closeAllDropdowns();
        const matches = mainTaskOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredMainStep(matches);
        setShowMainStepDropdown(true);

        const el = mainStepInputRef.current;
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
        handleMainTaskStepChange(suggestion);
        setShowMainStepDropdown(false);
    };

    // 1) Main Task Step
    const handleMainTaskStepChange = (value) => {
        setJraData(prev => ({
            ...prev,
            main: value,
        }));
    };

    // 2) Hazard name
    const handleHazardChange = (stepIndex, hazardIndex, value) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    hazards: body.hazards.map((h, hIdx) =>
                        hIdx === hazardIndex
                            ? { ...h, hazard: value }
                            : h
                    )
                };
            })
        }));
    };

    const handleUnwantedEventInput = (stepIndex, ueIndex, value) => {
        if (stepIndex === 0) return;
        closeAllDropdowns();
        handleUnwantedEventChange(stepIndex, ueIndex, value);
        const base = getUnwantedOptions(jraData.jraBody[stepIndex].hazards[0].hazard);
        const matches = base
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredUnwantedEvents(matches);
        setShowUnwantedEventsDropdown(true);
        setActiveHazardCell({ stepIndex: stepIndex, hazardIndex: ueIndex });

        const key = `${stepIndex}-${ueIndex}`;
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

    const handleUnwantedEventFocus = (stepIndex, ueIndex, value) => {
        if (stepIndex === 0) return;
        closeAllDropdowns();
        setActiveHazardCell({ stepIndex: stepIndex, hazardIndex: ueIndex });
        const base = getUnwantedOptions(jraData.jraBody[stepIndex].hazards[0].hazard);
        const matches = base
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredUnwantedEvents(matches);
        setShowUnwantedEventsDropdown(true);

        const key = `${stepIndex}-${ueIndex}`;
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
        const { stepIndex, hazardIndex } = activeHazardCell;
        handleUnwantedEventChange(stepIndex, hazardIndex, suggestion);
        setShowUnwantedEventsDropdown(false);
    };

    // 3) Unwanted Event text
    const handleUnwantedEventChange = (stepIndex, ueIndex, value) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    UE: body.UE.map((ueObj, uIdx) =>
                        uIdx === ueIndex
                            ? { ...ueObj, ue: value }
                            : ueObj
                    )
                };
            })
        }));
    };

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
            const validUE = jraInfo.some(node =>
                node.hazards.some(hazard =>
                    hazard.unwantedEvents.some(event =>
                        event.unwantedEvent.toLowerCase() === ue.toLowerCase()
                    )
                )
            );

            if (!exists && validUE) {
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

            if (!validUE) {
                // Pull every subTaskSteps array, flatten it, and dedupe
                const allSubSteps = Array.from(
                    new Set(
                        jraInfo.flatMap(node =>
                            node.hazards
                                .filter(h => h.hazard === hazard)
                                .flatMap(h =>
                                    h.unwantedEvents.flatMap(e =>
                                        e.subTaskSteps
                                    )
                                )
                        )
                    )
                );

                return allSubSteps;
            }

            const node = jraInfo.find(n => n.mainTaskStep === main);
            const haz = node?.hazards.find(h => h.hazard === hazard);
            const ev = haz?.unwantedEvents.find(e => e.unwantedEvent === ue);
            return ev ? ev.subTaskSteps : [];
        }

        // UE only (across all mains)
        if (!main && !hazard && ue) {
            const validUE = jraInfo.some(node =>
                node.hazards.some(hazard =>
                    hazard.unwantedEvents.some(event =>
                        event.unwantedEvent.toLowerCase() === ue.toLowerCase()
                    )
                )
            );

            if (!validUE) {
                return allSubStepOptions; // or throw, or return empty, whatever makes sense
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

        // hazard + UE (across all mains)
        if (!main && hazard && ue) {
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

        return [];
    }

    const handleSubStepInput = (stepIndex, subIndex, value) => {
        closeAllDropdowns();

        handleSubTaskStepChange(stepIndex, subIndex, value);

        const main = jraData.main;
        const haz = jraData.jraBody[stepIndex].hazards[0].hazard;
        const ue = jraData.jraBody[stepIndex].UE[0].ue;
        const base = getSubStepOptions(main, haz, ue);
        const matches = base.filter(opt =>
            opt.toLowerCase().includes(value.toLowerCase())
        );

        setFilteredControls(matches);
        setShowControlsDropdown(true);
        setActiveSubCell({ stepIndex: stepIndex, subIndex: subIndex });

        const key = `${stepIndex}-${subIndex}`;

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

    const handleSubStepFocus = (stepIndex, subIndex, value) => {
        setActiveSubCell({ stepIndex: stepIndex, subIndex: subIndex });

        const main = jraData.main;
        const haz = jraData.jraBody[stepIndex].hazards[0].hazard;
        const ue = jraData.jraBody[stepIndex].UE[0].ue;
        const base = getSubStepOptions(main, haz, ue);
        const matches = base.filter(opt =>
            opt.toLowerCase().includes(value.toLowerCase())
        );

        setFilteredControls(matches);
        setShowControlsDropdown(true);

        const key = `${stepIndex}-${subIndex}`;
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
        const { stepIndex, subIndex } = activeSubCell;
        handleSubTaskStepChange(stepIndex, subIndex, suggestion);
        setShowControlsDropdown(false);
    };

    // 4) Sub-task step
    const handleSubTaskStepChange = (
        stepIndex,
        subIndex,
        value
    ) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    sub: body.sub.map((subObj, sIdx) =>
                        sIdx === subIndex
                            ? { ...subObj, task: value }
                            : subObj
                    )
                };
            })
        }));
    };

    const handleControlChange = (
        stepIndex,
        ctlIdx,
        value
    ) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    controls: body.controls.map((controlObj, cIdx) =>
                        cIdx === ctlIdx
                            ? { ...controlObj, control: value }
                            : controlObj
                    )
                };
            })
        }));
    };

    const handleGoNoGoChange = (
        stepIndex,
        gIdx,
        value
    ) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    go_noGo: body.go_noGo.map((gngObj, gngIdx) =>
                        gngIdx === gIdx
                            ? { ...gngObj, go: value }
                            : gngObj
                    )
                };
            })
        }));
    };

    const handleResponsibleInput = (stepIndex, subIndex, value) => {
        closeAllDropdowns();
        handleTEChange(stepIndex, subIndex, value);
        const matches = posLists
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredExe(matches);
        setShowExeDropdown(true);
        setActiveSubCell({ stepIndex: stepIndex, subIndex: subIndex });

        const key = `${stepIndex}-${subIndex}`;

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

    const handleResponsibleFocus = (stepIndex, subIndex, value) => {
        setActiveSubCell({ stepIndex: stepIndex, subIndex: subIndex });

        const matches = posLists
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredExe(matches);
        setShowExeDropdown(true);

        const key = `${stepIndex}-${subIndex}`;

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
        const { stepIndex, subIndex } = activeSubCell;
        handleTEChange(stepIndex, subIndex, suggestion);
        setShowExeDropdown(false);
    };

    const handleTEChange = (
        stepIndex,
        tIdx,
        value
    ) => {
        setJraData(prev => ({
            ...prev,
            jraBody: prev.jraBody.map((body, bIdx) => {
                if (bIdx !== stepIndex) return body;
                return {
                    ...body,
                    taskExecution: body.taskExecution.map((teObj, teIdx) =>
                        teIdx === tIdx
                            ? { ...teObj, R: value }
                            : teObj
                    )
                };
            })
        }));
    };

    return (
        <div className="jra-popup-page-container">
            <div className="jra-popup-page-overlay">
                <div className="jra-popup-page-popup-right">
                    <div className="jra-popup-page-popup-header-right">
                        <h2>Main Step Evaluation</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="jra-popup-page-form-group-main-container">

                        <div className="jra-popup-page-component-wrapper-main">
                            <div className={`ibra-popup-page-form-group inline-field`}>
                                <label>Main Step</label>
                                <div className="jra-popup-page-select-container">
                                    <input
                                        type="text"
                                        style={{ color: "black", cursor: "text" }}
                                        className="jra-popup-page-input-table jra-popup-page-row-input"
                                        placeholder="Insert Main Step"
                                        value={jraData.main}
                                        onChange={(e) => handleMainStepInput(e.target.value)}
                                        onFocus={(e) => handleMainStepFocus(e.target.value)}
                                        ref={mainStepInputRef}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="jra-popup-page-scroll-box">
                            {jraData.jraBody.map((step, si) => (
                                <div>
                                    <div className="jra-popup-page-form-group-main-container-2">
                                        {si > 0 && (
                                            <button
                                                type="button"
                                                className="jra-popup-page-delete-group-button"
                                                onClick={() => handleDeleteGroup(si)}
                                                title="Delete this Unwanted Event & Hazard group"
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        )}

                                        <div
                                            className="jra-popup-page-additional-group"
                                            style={{ marginTop: si !== 0 ? "18px" : undefined, paddingBottom: "0px" }}
                                        >
                                            <div className="text-unwanted" style={{ marginBottom: "10px" }}>
                                                Unwanted Event Evaluation
                                            </div>
                                            <div className="jra-popup-page-additional-row" style={{ marginTop: si !== 0 ? "18px" : undefined }}>
                                                <div className="jra-popup-page-column-half">
                                                    <div className="jra-popup-page-component-wrapper">
                                                        <div className={`ibra-popup-page-form-group `}>
                                                            <label>Hazard Classification / Energy Release</label>
                                                            <div className={si !== 0 ? `ibra-popup-page-select-container` : ""}>
                                                                <div className={si !== 0 ? `ibra-popup-page-select-container` : ""}>
                                                                    <select
                                                                        type="text"
                                                                        style={{ color: step.hazards[0].hazard === "" ? "grey" : "black", cursor: "text" }}
                                                                        disabled={si === 0}
                                                                        className="jra-popup-page-select ibra-popup-page-row-input"
                                                                        placeholder="Select Hazard / Energy Release"
                                                                        value={step.hazards[0]?.hazard}
                                                                        onChange={(e) => handleHazardChange(si, 0, e.target.value)}
                                                                    >
                                                                        <option value={""} hidden>Select Hazard</option>
                                                                        <option value={"Work Execution"} hidden>Work Execution</option>
                                                                        {sourceData.map((hazard, index) => (
                                                                            <option key={index} value={hazard.term} style={{ color: "black" }}>
                                                                                {hazard.term}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="jra-popup-page-column-half">
                                                    <div className="jra-popup-page-component-wrapper">
                                                        <div className={`ibra-popup-page-form-group `}>
                                                            <label>Unwanted Event</label>
                                                            <div className={si !== 0 ? `ibra-popup-page-select-container` : ""}>
                                                                <div className={si !== 0 ? `ibra-popup-page-select-container` : ""}>
                                                                    <input
                                                                        type="text"
                                                                        style={{ color: "black", cursor: "text" }}
                                                                        ref={el => {
                                                                            const key = `${si}-${0}`;
                                                                            if (el) {
                                                                                unwantedEventRefs.current[key] = el;
                                                                            } else {
                                                                                delete unwantedEventRefs.current[key];
                                                                            }
                                                                        }}
                                                                        readOnly={si === 0}
                                                                        className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                        placeholder="Insert Unwanted Event"
                                                                        value={step.UE[0]?.ue}
                                                                        onChange={(e) => handleUnwantedEventInput(si, 0, e.target.value)}
                                                                        onFocus={(e) => handleUnwantedEventFocus(si, 0, e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="jra-popup-page-additional-group"
                                            style={{ marginTop: si !== 0 ? "18px" : undefined }}
                                        >
                                            <div className="text-unwanted" style={{ marginBottom: "10px" }}>
                                                Control Evaluation
                                            </div>
                                            <div className="jra-popup-page-form-group-main-container-sub-controls" ref={el => controlsScrollRefs.current[si] = el}>
                                                {step.sub.map((subItem, idx) => {
                                                    const key = `${si}-${idx}`;
                                                    const isCollapsed = !!collapsedControls[key];
                                                    const controlItem = step.controls[idx] || {};
                                                    const execItem = step.taskExecution[idx] || {};
                                                    const goNoGoItem = step.go_noGo[idx] || {};

                                                    return (
                                                        <div className={`jra-popup-page-form-group`} style={{ position: "relative", marginTop: idx !== 0 ? "5px" : "0px" }}>
                                                            <div className="jra-popup-page-additional-row">
                                                                <div className="jra-popup-page-column-half">
                                                                    <div className="jra-popup-page-additional-row">
                                                                        <div className="jra-popup-page-column-2-1-1">
                                                                            {idx === 0 && (<label style={{ marginTop: "10px" }}>Control / Sub Task Step</label>)}

                                                                            <div className="jra-popup-page-main-container">
                                                                                <div className={"jra-popup-page-control-container"}>
                                                                                    <textarea
                                                                                        type="text"
                                                                                        style={{ color: "black", cursor: "text", fieldsizing: "content", minHeight: "19px", paddingRight: controlHistory[`${si}-${idx}`]?.length > 0 ? "60px" : "" }}
                                                                                        ref={el => {
                                                                                            const key = `${si}-${idx}`;
                                                                                            if (el) {
                                                                                                controlsInputRefs.current[key] = el;
                                                                                            } else {
                                                                                                delete controlsInputRefs.current[key];
                                                                                            }
                                                                                        }}
                                                                                        className={`${!allSubStepOptions.includes(subItem.task) ? `jra-popup-page-control-table` : `jra-popup-page-control-table-2`} jra-popup-page-row-input`}
                                                                                        placeholder="Insert Sub Task Step"
                                                                                        value={subItem.task}
                                                                                        onChange={(e) => handleSubStepInput(si, idx, e.target.value)}
                                                                                        onFocus={(e) => handleSubStepFocus(si, idx, e.target.value)}
                                                                                    />

                                                                                    {loadingControlKey && (<FontAwesomeIcon icon={faSpinner} spin className="jra-popup-page-control-icon-spin spin-animation" />)}

                                                                                    {controlHistory[`${si}-${idx}`]?.length > 0 && (<FontAwesomeIcon icon={faUndo} title={"AI Rewrite WED Question"} className="jra-popup-page-control-icon-2" onClick={() => handleUndoControl(si, idx)} />)}
                                                                                    {!loadingControlKey && !allSubStepOptions.includes(subItem.task) && (<FontAwesomeIcon icon={faMagicWandSparkles} title={"AI Rewrite WED Question"} className="jra-popup-page-control-icon" onClick={() => handleAiRewrite(si, idx)} />)}

                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    className="jra-popup-page-add-subrow-button"
                                                                                    onClick={() => handleAddSubRow(si, idx)}
                                                                                    title="Add Control"
                                                                                >
                                                                                    <FontAwesomeIcon icon={faPlusCircle} />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="jra-popup-page-delete-subrow-button"
                                                                                    onClick={() => handleDeleteSubRow(si, idx)}
                                                                                    disabled={step.sub.length <= 1}
                                                                                    title={
                                                                                        step.sub.length <= 1
                                                                                            ? "At least one control must remain"
                                                                                            : "Delete row"
                                                                                    }
                                                                                >
                                                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="jra-popup-page-column-2-2-2">
                                                                            {idx === 0 && (<label style={{ marginTop: "10px" }}>Task Execution (R)</label>)}

                                                                            <div className={`ibra-popup-page-select-container`}>
                                                                                <input
                                                                                    type="text"
                                                                                    style={{ color: "black", cursor: "text" }}
                                                                                    ref={el => {
                                                                                        const key = `${si}-${idx}`;
                                                                                        if (el) {
                                                                                            responsibleInputRefs.current[key] = el;
                                                                                        } else {
                                                                                            delete responsibleInputRefs.current[key];
                                                                                        }
                                                                                    }}
                                                                                    className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                                    placeholder="Insert Responsible Person"
                                                                                    value={execItem.R || ''}
                                                                                    onChange={(e) => handleResponsibleInput(si, idx, e.target.value)}
                                                                                    onFocus={(e) => handleResponsibleFocus(si, idx, e.target.value)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="jra-popup-page-column-half">
                                                                    <div className="jra-popup-page-additional-row">
                                                                        <div className="jra-popup-page-column-2-1">
                                                                            {idx === 0 && (<label style={{ marginTop: "10px" }}>Control Execution Specification</label>)}
                                                                            <div className="jra-popup-page-control-container">
                                                                                <textarea
                                                                                    type="text"
                                                                                    style={{ color: "black", cursor: "text", paddingRight: wedHistory[`${si}-${idx}`]?.length > 0 ? "60px" : "40px" }}
                                                                                    ref={ownersInputRef}
                                                                                    className="jra-popup-page-control-table jra-popup-page-row-input"
                                                                                    placeholder="Insert WED Question"
                                                                                    value={controlItem.control || ''}
                                                                                    onChange={(e) => handleControlChange(si, idx, e.target.value)}
                                                                                />
                                                                                {loadingWEDKey && (<FontAwesomeIcon icon={faSpinner} spin className="jra-popup-page-control-icon-spin spin-animation" />)}

                                                                                {wedHistory[`${si}-${idx}`]?.length > 0 && (<FontAwesomeIcon icon={faUndo} title={"AI Rewrite WED Question"} className="jra-popup-page-control-icon-2" onClick={() => handleUndoWED(si, idx)} />)}
                                                                                {!loadingWEDKey && (<FontAwesomeIcon icon={faMagicWandSparkles} title={"AI Rewrite WED Question"} className="jra-popup-page-control-icon" onClick={() => handleAiWEDCreate(si, idx)} />)}
                                                                            </div>
                                                                        </div>
                                                                        <div className="jra-popup-page-column-2-2">
                                                                            {idx === 0 && (<label style={{ marginTop: "10px" }}>Go / No-Go</label>)}

                                                                            <div className={`ibra-popup-page-select-container`}>
                                                                                <select
                                                                                    type="text"
                                                                                    style={{ color: "black", cursor: "text", textAlign: "center" }}
                                                                                    ref={ownersInputRef}
                                                                                    className="jra-popup-page-select ibra-popup-page-row-input"
                                                                                    placeholder="Enter Go / No-Go"
                                                                                    value={goNoGoItem.go || ''}
                                                                                    onChange={(e) => handleGoNoGoChange(si, idx, e.target.value)}
                                                                                >
                                                                                    <option value=""> </option>
                                                                                    <option value="X">X</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    )
                                                }
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="jra-popup-page-add-group-2">
                                        <button
                                            type="button"
                                            className="jra-popup-page-add-button-2"
                                            onClick={() => handleAddGroup(si)}
                                            title="Add another Hazard / Unwanted Event group"
                                        >
                                            + Add Hazard / Unwanted Event
                                        </button>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>


                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={() => onSubmit(jraData)}
                            >
                                {'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {
                showMainStepDropdown && filteredMainStep.length > 0 && (
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
                        {filteredMainStep.sort().filter(term => term && term.trim() !== "").map((term, i) => (
                            <li
                                key={i}
                                onMouseDown={() => selectMainStepSuggestion(term)}
                            >
                                {term}
                            </li>
                        ))}
                    </ul>
                )
            }

            {
                showUnwantedEventsDropdown && filteredUnwantedEvents.length > 0 && (
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
                )
            }

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
                            onMouseDown={() => selectSubStepSuggestion(term)}
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
                    {filteredExe.sort().filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectResponsibleSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}
        </div >
    );
};

export default JRAPopup;