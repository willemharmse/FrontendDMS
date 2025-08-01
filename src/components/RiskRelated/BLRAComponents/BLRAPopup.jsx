import React, { useState, useEffect, useRef } from 'react';
import '../IBRAPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FunctionalOwnership from '../RiskInfo/FunctionalOwnership';
import RiskSource from '../RiskInfo/RiskSource';
import Hazard from '../RiskInfo/Hazard';
import CurrentControls from '../RiskInfo/CurrentControls';
import LikelihoodHelp from '../RiskInfo/LikelihoodHelp';
import MaxConsequence from '../RiskInfo/MaxConsequence';
import MaxRiskRank from '../RiskInfo/MaxRiskRank';
import PriorityUE from '../RiskInfo/PriorityUE';
import RiskTreatment from '../RiskInfo/RiskTreatment';
import ConsequenceRating from '../RiskInfo/ConsequenceRating';
import UnwantedEvent from '../RiskInfo/UnwantedEvent';
import ControlDesc from '../RiskInfo/ControlDesc';
import { v4 as uuidv4 } from 'uuid';
import MaterialUE from '../RiskInfo/MaterialUE';

const BLRAPopup = ({ onClose, onSave, data, rowsData }) => {
    const [groupedAreas, setGroupedAreas] = useState({});     // { MA1: [...], MA2: [...] }
    const [mainAreas, setMainAreas] = useState([]);     // [ 'MA1', 'MA2', … ]
    const [availableSubAreas, setAvailableSubAreas] = useState([]);
    const [riskSources, setRiskSources] = useState([]);
    const inputRefs = useRef({});
    const [filteredControls, setFilteredControls] = useState({});
    const [showDropdown, setShowDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [controls, setControls] = useState([]);
    const [helpControl, setHelpControl] = useState(false);
    const [helpOdds, setHelpOdds] = useState(false);
    const [helpMaxCons, setHelpMaxCons] = useState(false);
    const [helpRR, setHelpRR] = useState(false);
    const [helpPUE, setHelpPUE] = useState(false);
    const [filteredUE, setFilteredUE] = useState([]);
    const [showUEDropdown, setShowUEDropdown] = useState(false);
    const ueInputRef = useRef(null);
    const [filteredMainAreas, setFilteredMainAreas] = useState([]);
    const [showMainAreasDropdown, setShowMainAreasDropdown] = useState(false);
    const mainAreasInputRef = useRef(null);
    const [filteredSubAreas, setFilteredSubAreas] = useState([]);
    const [showSubAreasDropdown, setShowSubAreasDropdown] = useState(false);
    const subAreasInputRef = useRef(null);
    const [filteredOwners, setFilteredOwners] = useState([]);
    const [showOwnersDropdown, setShowOwnersDropdown] = useState(false);
    const ownersInputRef = useRef(null);

    const [functionalOwners, setFunctionalOwners] = useState([]);
    const [likelihoodOptions] = useState(['1: Rare', '2. Unlikely', '3. Possible', '4. Likely', '5. Almost Certain']);
    const [helpFO, setHelpFO] = useState(false);
    const [helpRS, setHelpRS] = useState(false);
    const [helpHaz, setHelpHaz] = useState(false);
    const [helpRating, setHelpRating] = useState(false);
    const [helpUE, setHelpUE] = useState(false);
    const [helpMUE, setHelpMUE] = useState(false);
    const [classNameRiskRank, setClassNameRiskRank] = useState('');
    const [classNamePUE, setClassNamePUE] = useState('');
    const [classNameMUE, setClassNameMUE] = useState('');
    const [selectedDescription, setSelectedDescription] = useState("");
    const [selectedPerformance, setSelectedPerformance] = useState("");
    const [showDescription, setShowDescription] = useState(false);

    const riskSourceUEMap = {
        'Biological': ['Exposure to Pathogen', 'Allergic Reaction', 'Contamination', 'Infestation'],
        'Chemical': ['Chemical Spill', 'Toxic Fume Release', 'Corrosion Damage', 'Chemical Reaction'],
        'Climatic/ Natural Events': ['Flooding', 'High Wind Damage', 'Lightning Strike', 'Heatwave'],
        'Confined Spaces': ['Asphyxiation', 'Entrapment', 'Explosion in Space', 'Equipment Failure'],
        'Dust / Inhalable particulates': ['Airborne Dust Cloud', 'Silica Exposure', 'Respiratory Irritation', 'Dust Explosion'],
        'Electrical': ['Electric Shock', 'Short Circuit', 'Fire Due to Wiring', 'Equipment Overload'],
        'Ergonomics': ['Repetitive Strain Injury', 'Musculoskeletal Disorder', 'Poor Posture Injury', 'Fatigue'],
        'Explosives': ['Uncontrolled Detonation', 'Shrapnel Release', 'Blast Overpressure', 'Fire from Explosion'],
        'External Threats': ['Protest Disruption', 'Legislative Change', 'Cyber Attack', 'Market Volatility'],
        'Fire': ['Building Fire', 'Wildfire Spread', 'Equipment Fire', 'Flash Over'],
        'Gravitational (Objects)': ['Falling Object Impact', 'Structural Collapse', 'Equipment Drop', 'Material Spill'],
        'Gravitational (People)': ['Slip and Fall', 'Trip Hazard', 'Fall from Height', 'Uneven Surface'],
        'Land': ['Soil Erosion', 'Contamination Spread', 'Habitat Destruction', 'Land Subsidence'],
        'Lighting': ['Glare', 'Insufficient Lighting', 'Flicker Effect', 'Burns from Heat'],
        'Mechanical (Fixed)': ['Machine Entanglement', 'Crush Injury', 'Mechanical Failure', 'Tool Breakage'],
        'Mechanical (Mobile)': ['Vehicle Collision', 'Equipment Rollaway', 'Forklift Tip-Over', 'Mobile Crane Collapse'],
        'Magnetic': ['Magnetized Object Attraction', 'Equipment Malfunction', 'Personnel Injury', 'Field Leakage'],
        'Noise': ['Hearing Damage', 'Noise Complaint', 'Equipment Malfunction', 'Acoustic Resonance'],
        'Personal / Behaviour': ['Human Error', 'Intentional Sabotage', 'Fatigue-Related Error', 'Violence'],
        'Pressure / Explosions': ['Pressure Vessel Burst', 'Blast Wave Injury', 'Air Blast Damage', 'Loud Noise Damage'],
        'Psychological': ['Stress Reaction', 'Anxiety Episode', 'Depression', 'Insomnia'],
        'Radiation': ['Radiation Leak', 'Skin Burn', 'Contamination Spread', 'Equipment Damage'],
        'Social/ Cultural': ['Community Protest', 'Cultural Insensitivity', 'Reputation Damage', 'Boycott'],
        'Thermal': ['Heat Stress', 'Cold Exposure', 'Thermal Shock', 'Burn Injury'],
        'Vibration': ['Hand-Arm Vibration Syndrome', 'Whole Body Vibration', 'Structural Fatigue', 'Vibration-Induced Failure'],
        'Waste': ['Hazardous Waste Leak', 'Landfill Overflow', 'Illegal Dumping', 'Greenhouse Gas Emission'],
        'Water': ['Flood Contamination', 'Drowning', 'Water Scarcity', 'Water Pollution'],
        'Other': ['Unanticipated Hazard', 'Unexpected Reaction', 'Unknown Failure'],
    };

    const closeAllDropdowns = () => {
        setShowDropdown(null);
        setShowUEDropdown(false);
        setShowMainAreasDropdown(false);
        setShowSubAreasDropdown(false);
        setShowOwnersDropdown(false);
    };

    const [ueOptions, setUEOptions] = useState([]);

    const openHelpControl = () => {
        setHelpControl(true);
    }

    const closeHelpControl = () => {
        setHelpControl(false);
    }

    const openHelpRating = () => {
        setHelpRating(true);
    }

    const closeHelpRating = () => {
        setHelpRating(false);
    }

    const openHelpPUE = () => {
        setHelpPUE(true);
    }

    const closeHelpPUE = () => {
        setHelpPUE(false);
    }

    const openHelpMUE = () => {
        setHelpMUE(true);
    }

    const closeHelpMUE = () => {
        setHelpMUE(false);
    }

    const openHelpRR = () => {
        setHelpRR(true);
    }

    const closeHelpRR = () => {
        setHelpRR(false);
    }

    const openHelpMaxCons = () => {
        setHelpMaxCons(true);
    }

    const closeHelpMaxCons = () => {
        setHelpMaxCons(false);
    }

    const openHelpOdds = () => {
        setHelpOdds(true);
    }

    const closeHelpOdds = () => {
        setHelpOdds(false);
    }

    const openHelpFO = () => {
        setHelpFO(true);
    };

    const closeHelpFO = () => {
        setHelpFO(false);
    };

    const openHelpRS = () => {
        setHelpRS(true);
    }

    const closeHelpRS = () => {
        setHelpRS(false);
    }

    const openHelpHaz = () => {
        setHelpHaz(true);
    }

    const closeHelpHaz = () => {
        setHelpHaz(false);
    }

    const openHelpUE = () => {
        setHelpUE(true);
    }

    const closeHelpUE = () => {
        setHelpUE(false);
    }

    const openDescription = () => {
        setShowDescription(true);
    }

    const closeDescription = () => {
        setShowDescription(false);
    }

    // State for selected values
    const [materialEvent, setMaterialEvent] = useState('');
    const [priorityEvent, setPriorityEvent] = useState('');
    const [maxConsequence, setMaxConsequence] = useState('');
    const [additionalComments, setAdditionalComments] = useState('');
    const [selectedMainArea, setSelectedMainArea] = useState('');
    const [selectedSubArea, setSelectedSubArea] = useState('');
    const [selectedOwner, setSelectedOwner] = useState('');
    const [selectedLikelihood, setSelectedLikelihood] = useState('');
    const [selectedUE, setSelectedUE] = useState('');
    const [selectedMaxRiskRank, setSelectedMaxRiskRank] = useState('');
    const [riskSource, setRiskSource] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        author: false,
        departmentHead: false,
        reviewer: false,
        hazards: false,
        controls: false,
        riskSource: false
    });

    useEffect(() => {
        const options = riskSourceUEMap[riskSource] || [];
        setUEOptions(options);
        // if current UE isn’t in the new list, clear it
    }, [riskSource]);

    // Modified state for hazard types (replacing functional ownership)
    const [hazardRows, setHazardRows] = useState([
        { id: 1, value: '' }
    ]);

    // Modified state for current controls (replacing likelihood rows)
    const [controlRows, setControlRows] = useState([
        { id: 1, value: '' }
    ]);

    const [riskRankRows, setRiskRankRows] = useState([
        { id: 1, label: 'S', value: '-' },
        { id: 2, label: 'H', value: '-' },
        { id: 3, label: 'E', value: '-' },
        { id: 4, label: 'C', value: '-' },
        { id: 5, label: 'L&R', value: '-' },
        { id: 6, label: 'M', value: '-' },
        { id: 7, label: 'R', value: '-' },
    ]);

    const showFullWord = (type) => {
        switch (type) {
            case "S": return "(S) Safety:";
            case "H": return "(H) Occupational Health: ";
            case "E": return "(E) Environmental Impact: ";
            case "C": return "(C) Community / Social: ";
            case "L&R": return "(L&R) Legal & Regulatory: ";
            case "M": return "(M) Material / Financial Losses: ";
            case "R": return "(R) Impact on Reputation: "
        }
    };

    const riskRankOptions = ['-', '1: Ins', '2: Min', '3: Mod', '4: High', '5: Maj'];

    const valid = () => {

        return true;
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
            setShowDropdown(null);
            setShowUEDropdown(false);
            setShowMainAreasDropdown(false);
            setShowSubAreasDropdown(false);
            setShowOwnersDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showDropdown, showUEDropdown, showMainAreasDropdown, showOwnersDropdown, showSubAreasDropdown]);


    useEffect(() => {
        async function fetchValues() {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/getValues`);
                if (!res.ok) throw new Error('Failed to fetch lookup data');
                // parse once, pull out both
                const { areas, risks, controls, owners } = await res.json();
                // build a lookup
                const lookup = {};
                areas.forEach(({ mainArea, subAreas }) => {
                    lookup[mainArea] = subAreas;
                });

                setGroupedAreas(lookup);
                setMainAreas(Object.keys(lookup));
                setRiskSources(risks);
                setControls(controls);
                setFunctionalOwners(owners);
            } catch (err) {
                console.error("Error fetching areas:", err);
            }
        }
        fetchValues();
    }, []);

    useEffect(() => {
        // 1️⃣ don’t run until both the API list and the rowsData are in place
        if (!controls.length || !rowsData?.length) return;

        // 2️⃣ gather every user-typed control from every row
        const allCustomControls = Array.from(
            new Set(rowsData.flatMap(r => r.controls || []))
        );

        // 3️⃣ figure out which of those aren’t already in the API list
        const existing = new Set(controls.map(c => c.control));
        const toAdd = allCustomControls.filter(name => !existing.has(name));

        // 4️⃣ if there are any new ones, append them and then sort
        if (toAdd.length) {
            setControls(prev => {
                const merged = [
                    ...prev,
                    ...toAdd.map(name => ({ _id: uuidv4(), control: name }))
                ];
                // sort by the `control` property
                return merged.slice().sort((a, b) =>
                    a.control.localeCompare(b.control)
                );
            });
        }
    }, [rowsData, controls]);


    useEffect(() => {
        if (data) {
            // Set static fields
            setSelectedMainArea(data.main || '');
            setSelectedSubArea(data.sub || '');
            setSelectedOwner(data.owner || '');
            setSelectedLikelihood(data.odds || '');
            setSelectedMaxRiskRank(data.riskRank || '');
            setMaterialEvent(data.material || '');
            setPriorityEvent(data.priority || '');
            setAdditionalComments(data.additional || '');
            setMaxConsequence(data.maxConsequence || '');
            setRiskSource(data.source || '');
            setSelectedUE(data.UE || '');
            // Set hazard rows
            if (data.hazards && Array.isArray(data.hazards) && data.hazards.length) {
                setHazardRows(
                    data.hazards.map((hazard, index) => ({
                        id: index + 1,
                        value: hazard,
                    }))
                );
            }

            // Set control rows
            if (data.controls && Array.isArray(data.controls) && data.controls.length) {
                setControlRows(
                    data.controls.map((control, index) => ({
                        id: index + 1,
                        value: control,
                    }))
                );
            }

            // Set risk rank rows
            setRiskRankRows([
                { id: 1, label: 'S', value: data['S'] || '-' },
                { id: 2, label: 'H', value: data['H'] || '-' },
                { id: 3, label: 'E', value: data['E'] || '-' },
                { id: 4, label: 'C', value: data['C'] || '-' },
                { id: 5, label: 'L&R', value: data['LR'] || '-' }, // This is the fix!
                { id: 6, label: 'M', value: data['M'] || '-' },
                { id: 7, label: 'R', value: data['R'] || '-' },
            ]);

            // Update available sub areas immediately if mainArea exists
            if (data.main) {
                setAvailableSubAreas(groupedAreas[selectedMainArea] || []);
            }
        }
    }, [data]);

    useEffect(() => {
        const maxRiskRank = riskRankRows.reduce((max, row) => {
            const value = parseInt(row.value.split(':')[0]);
            return isNaN(value) ? max : Math.max(max, value);
        }, 0);

        console.log("Max Risk Rank:", maxRiskRank);

        if (maxRiskRank === 0) {
            setMaterialEvent("No");
            setPriorityEvent("No");
        }

        const maxLikelihood = parseInt(selectedLikelihood.split(':')[0]);

        const riskMatrix = [
            ['1 (L)', '3 (L)', '6 (M)', '10 (M)', '15 (S)'],
            ['2 (L)', '5 (L)', '9 (M)', '14 (S)', '19 (S)'],
            ['4 (L)', '8 (M)', '13 (S)', '18 (S)', '22 (H)'],
            ['7 (M)', '12 (M)', '17 (S)', '21 (H)', '24 (H)'],
            ['11 (M)', '16 (S)', '20 (S)', '23 (H)', '25 (H)'],
        ];

        // Adjust indices because matrix is 0-indexed
        const rowIdx = maxLikelihood - 1;
        const colIdx = maxRiskRank - 1;

        let matrixValue = null;
        if (
            rowIdx >= 0 && rowIdx < riskMatrix.length &&
            colIdx >= 0 && colIdx < riskMatrix[0].length
        ) {
            matrixValue = riskMatrix[rowIdx][colIdx];
        }

        setSelectedMaxRiskRank(matrixValue);

        const numericPart = matrixValue ? parseInt(matrixValue.split(' ')[0]) : null;

        if (numericPart >= 1 && numericPart <= 5) {
            setClassNameRiskRank('ibra-popup-page-input-green');
        }
        else if (numericPart >= 6 && numericPart <= 12) {
            setClassNameRiskRank('ibra-popup-page-input-yellow');
        }
        else if (numericPart >= 13 && numericPart <= 20) {
            setClassNameRiskRank('ibra-popup-page-input-orange');
        }
        else if (numericPart >= 21) {
            setClassNameRiskRank('ibra-popup-page-input-red');
        }

        if (maxRiskRank >= 4) {
            setPriorityEvent('Yes');
            setClassNamePUE("ibra-popup-page-input-orange");
        }
        else if (maxRiskRank < 4 && maxRiskRank > 0) {
            setPriorityEvent('No');
            setClassNamePUE("");
        }

        if (maxRiskRank >= 5) {
            setMaterialEvent('Yes');
            setClassNameMUE("ibra-popup-page-input-red");
        }
        else if (maxRiskRank < 5 && maxRiskRank > 0) {
            setMaterialEvent('No');
            setClassNameMUE("");
        }
    }, [selectedLikelihood, riskRankRows]);

    useEffect(() => {
        if (!selectedMainArea) {
            // Show all sub-areas if no main area is selected
            const allSubs = Object.values(groupedAreas).flat();
            setAvailableSubAreas(allSubs);
            return;
        }

        const subs = groupedAreas[selectedMainArea];
        if (!subs) return;

        setAvailableSubAreas(subs);

        // ❌ Don't clear sub area selection — just leave it as-is
    }, [selectedMainArea, groupedAreas]);

    // Functions to handle hazard rows
    const handleHazardChange = (id, value) => {
        const updatedRows = hazardRows.map(row =>
            row.id === id ? { ...row, value } : row
        );
        setHazardRows(updatedRows);
    };

    const addHazardRow = () => {
        const newId = hazardRows.length > 0 ? Math.max(...hazardRows.map(row => row.id)) + 1 : 1;
        setHazardRows([...hazardRows, { id: newId, value: '' }]);
    };

    const removeHazardRow = (id) => {
        if (hazardRows.length > 1) {
            setHazardRows(hazardRows.filter(row => row.id !== id));
        } else {
            toast.warn("You must have at least one hazard", {
                closeButton: false,
                autoClose: 800,
            });
        }
    };

    const handleControlChange = (id, value) => {
        const updatedRows = controlRows.map(row =>
            row.id === id ? { ...row, value } : row
        );
        setControlRows(updatedRows);
    };

    const addControlRow = () => {
        const newId = controlRows.length > 0 ? Math.max(...controlRows.map(row => row.id)) + 1 : 1;
        setControlRows([...controlRows, { id: newId, value: '' }]);
    };

    const removeControlRow = (id) => {
        if (controlRows.length > 1) {
            setControlRows(controlRows.filter(row => row.id !== id));
        } else {
            toast.warn("You must have at least one control", {
                closeButton: false,
                autoClose: 800,
            });
        }
    };

    const handleControlInfo = (controlText) => {
        const matchedControl = controls.find(c => c.control === controlText);
        const description = matchedControl?.description || '';
        const performance = matchedControl?.performance || '';

        setSelectedDescription(description);
        setSelectedPerformance(performance);
        openDescription();
    };

    const handleRiskRankChange = (id, value) => {
        const updatedRows = riskRankRows.map(row =>
            row.id === id ? { ...row, value } : row
        );
        setRiskRankRows(updatedRows);
    };

    const handleSubmit = async (e) => {
        const updatedData = {
            main: selectedMainArea,
            sub: selectedSubArea,
            owner: selectedOwner,
            odds: selectedLikelihood,
            riskRank: selectedMaxRiskRank,
            material: materialEvent,
            UE: selectedUE,
            priority: priorityEvent,
            maxConsequence: maxConsequence,
            additional: additionalComments,
            source: riskSource,
            hazards: hazardRows.map(row => row.value),  // Collecting all hazard row values
            controls: controlRows.map(row => row.value), // Collecting all control row values
            ...riskRankRows.reduce((acc, row) => {
                acc[row.label.replace('&', '')] = row.value;  // Adding risk rank values dynamically
                return acc;
            }, {}),
        };

        // Call the onSave function with updated data
        onSave(data.id, updatedData);
        onClose();
    };

    const handleUEInput = (value) => {
        closeAllDropdowns();
        setSelectedUE(value);
        const matches = ueOptions
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredUE(matches);
        setShowUEDropdown(true);

        const el = ueInputRef.current;
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
    const handleUEFocus = () => {
        closeAllDropdowns();
        const matches = ueOptions;
        setFilteredUE(matches);
        setShowUEDropdown(true);

        const el = ueInputRef.current;
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
    const selectUESuggestion = (value) => {
        setSelectedUE(value);
        setShowUEDropdown(false);
    };

    const handleSubAreaInput = (value) => {
        closeAllDropdowns();
        setSelectedSubArea(value);

        let options = [];

        if (selectedMainArea && groupedAreas[selectedMainArea]) {
            options = groupedAreas[selectedMainArea];
        } else {
            options = Object.values(groupedAreas).flat();
        }

        const matches = options
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

        setFilteredSubAreas(matches);
        setShowSubAreasDropdown(true);

        const el = subAreasInputRef.current;
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
    const handleSubAreasFocus = () => {
        closeAllDropdowns();

        let matches = [];

        if (selectedMainArea && groupedAreas[selectedMainArea]) {
            matches = groupedAreas[selectedMainArea];
        } else {
            // Flatten all sub-areas from all main areas
            matches = Object.values(groupedAreas).flat();
        }

        matches = matches;
        setFilteredSubAreas(matches);
        setShowSubAreasDropdown(true);

        const el = subAreasInputRef.current;
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
    const selectSubAreaSuggestion = (value) => {
        setSelectedSubArea(value);
        setShowSubAreasDropdown(false);
    };

    const handleMainAreaInput = (value) => {
        closeAllDropdowns();
        setSelectedMainArea(value);
        const matches = mainAreas
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredMainAreas(matches);
        setShowMainAreasDropdown(true);

        const el = mainAreasInputRef.current;
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
    const handleMainAreasFocus = () => {
        closeAllDropdowns();
        const matches = mainAreas;
        setFilteredMainAreas(matches);
        setShowMainAreasDropdown(true);

        const el = mainAreasInputRef.current;
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
    const selectMainAreaSuggestion = (value) => {
        setSelectedMainArea(value);
        setShowMainAreasDropdown(false);
    };

    const handleOwnerInput = (value) => {
        closeAllDropdowns();
        setSelectedOwner(value);
        const matches = functionalOwners
            .filter(opt => opt.owner.toLowerCase().includes(value.toLowerCase()));
        setFilteredOwners(matches);
        setShowOwnersDropdown(true);

        const el = ownersInputRef.current;
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
    const handleOwnerFocus = () => {
        closeAllDropdowns();
        const matches = functionalOwners;
        setFilteredOwners(matches);
        setShowOwnersDropdown(true);

        const el = ownersInputRef.current;
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
    const selectOwnerSuggestion = (value) => {
        setSelectedOwner(value);
        setShowOwnersDropdown(false);
    };

    const handleControlInput = (id, value) => {
        closeAllDropdowns();
        handleControlChange(id, value);

        const matches = controls
            .filter(c => c.control.toLowerCase().includes(value.toLowerCase()));
        setFilteredControls(prev => ({ ...prev, [id]: matches }));


        setShowDropdown(id);
        const el = inputRefs.current[`control-${id}`];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleControlFocus = (id) => {
        closeAllDropdowns();
        const current = controlRows.find(r => r.id === id)?.value || '';
        const matches = controls
            .filter(c => c.control.toLowerCase().includes(current.toLowerCase()));
        setFilteredControls(prev => ({ ...prev, [id]: matches }));
        setShowDropdown(id);

        const el = inputRefs.current[`control-${id}`];
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const selectControlSuggestion = (id, controlText) => {
        handleControlChange(id, controlText);
        setShowDropdown(null);
    };

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Unwanted Event Evaluation</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-scroll-box">
                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-additional-row">
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group inline-field ${errors.author ? "error-upload-required-up" : ""}`}>
                                                <label>Main Area</label>
                                                <div className="ibra-popup-page-select-container">
                                                    <input
                                                        type="text"
                                                        style={{ color: "black", cursor: "text" }}
                                                        ref={mainAreasInputRef}
                                                        className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                        placeholder="Select Main Area"
                                                        value={selectedMainArea}
                                                        onChange={e => handleMainAreaInput(e.target.value)}
                                                        onFocus={handleMainAreasFocus}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group inline-field ${errors.author ? "error-upload-required-up" : ""}`}>
                                                <label>Sub Area</label>
                                                <div className="ibra-popup-page-select-container">
                                                    <input
                                                        type="text"
                                                        style={{ color: "black", cursor: "text" }}
                                                        ref={subAreasInputRef}
                                                        className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                        placeholder="Select Sub Area"
                                                        value={selectedSubArea}
                                                        onChange={e => handleSubAreaInput(e.target.value)}
                                                        onFocus={handleSubAreasFocus}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-additional-row">
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group ${errors.departmentHead ? "error-upload-required-up" : ""}`}>
                                                <label><FontAwesomeIcon icon={faInfoCircle} onClick={openHelpFO} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" />Functional Ownership</label>
                                                <div className="ibra-popup-page-select-container">
                                                    <div className="ibra-popup-page-select-container">
                                                        <input
                                                            type="text"
                                                            style={{ color: "black", cursor: "text" }}
                                                            ref={ownersInputRef}
                                                            className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                            placeholder="Select Functional Owner"
                                                            value={selectedOwner}
                                                            onChange={e => handleOwnerInput(e.target.value)}
                                                            onFocus={handleOwnerFocus}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group ${errors.riskSource ? "error-upload-required-up" : ""}`}>
                                                <label><FontAwesomeIcon icon={faInfoCircle} onClick={openHelpRS} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" />Hazard Classification / Energy Release </label>
                                                <div className="ibra-popup-page-select-container">
                                                    <select
                                                        className="ibra-popup-page-select"
                                                        value={riskSource}
                                                        onChange={(e) => setRiskSource(e.target.value)}
                                                    >
                                                        <option value="">Select Hazard Classification / Energy Release</option>
                                                        {riskSources.map((term, index) => (
                                                            <option key={index} value={term.term}>
                                                                {term.term}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-form-row-2">
                                    <div className="ibra-popup-page-additional-row">
                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-component-wrapper">
                                                <div className={`ibra-popup-page-form-group ${errors.hazards ? "error-upload-required-up" : ""}`}>
                                                    <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" onClick={openHelpHaz} style={{ cursor: 'pointer' }} />Hazard</label>
                                                    <div className="ibra-popup-hazard-table-container">
                                                        <table className="ibra-popup-page-table">
                                                            <tbody>
                                                                {hazardRows.map(row => (
                                                                    <tr key={row.id}>
                                                                        <td>
                                                                            <div className="ibra-popup-page-row-actions">
                                                                                <input
                                                                                    type="text"
                                                                                    value={row.value}
                                                                                    className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                                    onChange={(e) => handleHazardChange(row.id, e.target.value)}
                                                                                    placeholder="Insert Hazard"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className="ibra-popup-page-action-button"
                                                                                    onClick={() => removeHazardRow(row.id)}
                                                                                >
                                                                                    <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faTrashAlt} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="ibra-popup-page-add-row-button"
                                                        onClick={addHazardRow}
                                                    >
                                                        <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faCirclePlus} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-component-wrapper-circle">
                                                <div className="ibra-popup-hazard-circle-container">
                                                    <div className="ibra-popup-hazard-circle">
                                                        {/* 1) The heading */}
                                                        <FontAwesomeIcon
                                                            icon={faInfoCircle}
                                                            className="ibra-popup-hazard-info-icon"
                                                            onClick={openHelpUE}
                                                            style={{ cursor: 'pointer' }}
                                                            title="What is an Unwanted Event?"
                                                        />

                                                        <h3 className="ibra-popup-hazard-title">Unwanted Event</h3>

                                                        {/* 2) The dropdown immediately after */}
                                                        <textarea
                                                            type="text"
                                                            style={{ color: "black", cursor: "text", fontFamily: "Arial" }}
                                                            ref={ueInputRef}

                                                            className="ibra-popup-dropdown ibra-popup-page-input-table-2"
                                                            placeholder="Select Unwanted Event"
                                                            value={selectedUE}
                                                            onChange={e => handleUEInput(e.target.value)}
                                                            onFocus={handleUEFocus}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-component-wrapper-special">
                                        <div className="ibra-popup-page-form-group">
                                            <label style={{ fontSize: "16px" }}><FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faInfoCircle} className="ibra-popup-label-icon" onClick={openHelpMaxCons} />Max Reasonable Consequence Description</label>
                                            <textarea
                                                className="ibra-popup-page-textarea-2"
                                                value={maxConsequence}
                                                onChange={(e) => setMaxConsequence(e.target.value)}
                                                placeholder="Insert max reasonable consequence details"
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.controls ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" onClick={openHelpControl} />Current Controls</label>
                                            <table className="ibra-popup-page-table">
                                                <tbody>
                                                    {controlRows.map(row => (
                                                        <tr key={row.id}>
                                                            <td>
                                                                <div className="ibra-popup-page-row-actions">
                                                                    <div className="ibra-popup-page-select-container">
                                                                        <input
                                                                            type="text"
                                                                            value={row.value}
                                                                            className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                            onFocus={() => handleControlFocus(row.id)}
                                                                            onChange={e => handleControlInput(row.id, e.target.value)}
                                                                            ref={el => inputRefs.current[`control-${row.id}`] = el}
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="ibra-popup-page-info-button"
                                                                        onClick={() => handleControlInfo(row.value)}
                                                                    >
                                                                        <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faInfoCircle} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="ibra-popup-page-action-button"
                                                                        onClick={() => removeControlRow(row.id)}
                                                                    >
                                                                        <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faTrashAlt} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button
                                                type="button"
                                                className="ibra-popup-page-add-row-button"
                                                onClick={addControlRow}
                                            >
                                                <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faCirclePlus} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-component-wrapper">
                                    <div className={`ibra-popup-page-form-group inline-field ${errors.author ? "error-upload-required-up" : ""}`}>
                                        <label style={{ marginRight: "120px" }}><FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: "18px", cursor: "pointer" }} onClick={openHelpOdds} />Likelihood of the Event</label>
                                        <div className="ibra-popup-page-select-container">
                                            <select
                                                className="ibra-popup-page-select"
                                                value={selectedLikelihood}
                                                onChange={(e) => setSelectedLikelihood(e.target.value)}
                                            >
                                                <option value="">Select Likelihood</option>
                                                {likelihoodOptions.map((option, index) => (
                                                    <option key={index} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="ibra-popup-page-form-row-2">
                                    <div className="ibra-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.reviewer ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" onClick={openHelpRating} />Consequence Rating</label>
                                            <table className="ibra-popup-page-consequence-table">
                                                <tbody>
                                                    {riskRankRows.map(row => (
                                                        <tr key={row.id}>
                                                            <td className="ibra-popup-page-label-cell">
                                                                <div className="ibra-popup-page-label-box">
                                                                    {showFullWord(row.label)}
                                                                </div>
                                                            </td>
                                                            <td className="ibra-popup-page-select-cell">
                                                                <div className="ibra-popup-page-select-container">
                                                                    <select
                                                                        value={row.value}
                                                                        className="ibra-popup-page-select-c"
                                                                        onChange={(e) => handleRiskRankChange(row.id, e.target.value)}
                                                                    >
                                                                        {riskRankOptions.map((option, index) => (
                                                                            <option key={index} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-additional-row-3">
                                    <div className="ibra-popup-page-column-third">
                                        <div className={`ibra-popup-page-component-wrapper ${classNameRiskRank}`}>
                                            <div className={`ibra-popup-page-form-group ${errors.reviewer ? "error-upload-required-up" : ""}`}>
                                                <label className={`${classNameRiskRank}`}><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" onClick={openHelpRR} />Max Risk Rank</label>
                                                <label
                                                    className={`ibra-popup-page-label-output ${classNameRiskRank}`}
                                                >
                                                    {selectedMaxRiskRank || '-'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ibra-popup-page-column-third">
                                        <div className={`ibra-popup-page-component-wrapper ${classNamePUE}`}>
                                            <div className="ibra-popup-page-form-group">
                                                <label className={`${classNamePUE}`}><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" onClick={openHelpPUE} />Priority Unwanted Event (PUE)</label>
                                                <label
                                                    className={`ibra-popup-page-label-output ${classNamePUE}`}
                                                >
                                                    {priorityEvent || '-'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ibra-popup-page-column-third">
                                        <div className={`ibra-popup-page-component-wrapper ${classNameMUE}`}>
                                            <div className={`ibra-popup-page-form-group`}>
                                                <label className={`${classNameMUE}`}><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpMUE} className="ibra-popup-label-icon" />Material Unwanted Event (MUE)</label>
                                                <label
                                                    className={`ibra-popup-page-label-output ${classNameMUE}`}
                                                >
                                                    {materialEvent || '-'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-component-wrapper">
                                    <div className="ibra-popup-page-form-group">
                                        <label>Additional Notes Regarding this Unwanted Event</label>
                                        <textarea
                                            className="ibra-popup-page-textarea-full"
                                            value={additionalComments}
                                            onChange={(e) => setAdditionalComments(e.target.value)}
                                            placeholder="Insert additional notes for this specific unwanted event (Do not include future controls or improvements here, these should be listed at the end of the IBRA table)."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={handleSubmit}
                                disabled={!valid()}
                            >
                                {loading ? <FontAwesomeIcon style={{ cursor: 'pointer' }} icon={faSpinner} spin /> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showDropdown !== null && filteredControls[showDropdown]?.length > 0 && (
                filteredControls[showDropdown]?.filter(
                    c => c.control?.trim()
                ).length > 0 && (
                    <ul
                        className="floating-dropdown"
                        style={{
                            position: "fixed",
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                            zIndex: 1000
                        }}
                    >
                        {filteredControls[showDropdown].map(ctrl => (
                            <li key={ctrl.id}
                                onMouseDown={() => selectControlSuggestion(showDropdown, ctrl.control)}>
                                {ctrl.control}
                            </li>
                        ))}
                    </ul>
                )
            )}

            {showUEDropdown && filteredUE.length > 0 && (
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
                    {filteredUE.map((opt, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectUESuggestion(opt)}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}

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
                    {filteredMainAreas.sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectMainAreaSuggestion(term)}
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
                    {filteredSubAreas.filter(Boolean).sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectSubAreaSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {showOwnersDropdown && filteredOwners.length > 0 && (
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
                    {filteredOwners.map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectOwnerSuggestion(term.owner)}
                        >
                            {term.owner}
                        </li>
                    ))}
                </ul>
            )}

            {helpFO && (<FunctionalOwnership setClose={closeHelpFO} />)}
            {helpRS && (<RiskSource setClose={closeHelpRS} />)}
            {helpHaz && (<Hazard setClose={closeHelpHaz} />)}
            {helpControl && (<CurrentControls setClose={closeHelpControl} />)}
            {helpOdds && (<LikelihoodHelp setClose={closeHelpOdds} />)}
            {helpMaxCons && (<MaxConsequence setClose={closeHelpMaxCons} />)}
            {helpRR && (<MaxRiskRank setClose={closeHelpRR} />)}
            {helpPUE && (<PriorityUE setClose={closeHelpPUE} />)}
            {helpRating && (<ConsequenceRating setClose={closeHelpRating} />)}
            {helpUE && (<UnwantedEvent setClose={closeHelpUE} />)}
            {helpMUE && (<MaterialUE setClose={closeHelpMUE} />)}
            {showDescription && (<ControlDesc setClose={closeDescription} description={selectedDescription} performance={selectedPerformance} />)}
        </div>
    );
};

export default BLRAPopup;