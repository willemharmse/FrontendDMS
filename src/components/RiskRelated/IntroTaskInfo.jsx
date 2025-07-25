import React, { useRef, useState, useEffect, version } from "react";
import "./IntroTaskInfo.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faInfoCircle, faL } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "react-toastify";
import axios from "axios";

const IntroTaskInfo = ({ formData, setFormData }) => {
    const [groupedAreas, setGroupedAreas] = useState({});
    const [mainAreas, setMainAreas] = useState([]);
    const [riskSources, setRiskSources] = useState([]);
    const [controls, setControls] = useState([]);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [availableSubAreas, setAvailableSubAreas] = useState([]);
    const [filteredMainAreas, setFilteredMainAreas] = useState([]);
    const [showMainAreasDropdown, setShowMainAreasDropdown] = useState(false);
    const mainAreasInputRef = useRef(null);
    const [filteredSubAreas, setFilteredSubAreas] = useState([]);
    const [showSubAreasDropdown, setShowSubAreasDropdown] = useState(false);
    const subAreasInputRef = useRef(null);
    const [filteredOwner, setFilteredOwner] = useState([]);
    const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
    const ownerInputRef = useRef(null);
    const [filteredLeader, setFilteredLeader] = useState([]);
    const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);
    const leaderInputRef = useRef(null);
    const [functionalOwners, setFunctionalOwners] = useState([]);
    const [posLists, setPosLists] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [showFilesDropdown, setShowFilesDropdown] = useState(false);
    const filesInputRef = useRef(null);
    const [files, setFiles] = useState([]);

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
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

    useEffect(() => {
        // collect all non-blank R values
        const forbidden = new Set([
            "person in charge of work",
            "all team members"
        ]);

        const seen = new Set();
        formData.jra.forEach(block =>
            block.jraBody.forEach(entry =>
                entry.taskExecution.forEach(te => {
                    const val = te.R.trim();
                    if (!val) return;                       // skip blanks
                    if (forbidden.has(val.toLowerCase()))   // skip these two
                        return;
                    seen.add(val);
                })
            )
        );


        // build new members array
        const newMembers = Array.from(seen).map(rVal => ({
            _id: uuidv4(),
            member: rVal
        }));

        // write them into formData.introInfo.members
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                members: newMembers
            }
        }));
    }, [formData.jra]);

    const closeAllDropdowns = () => {
        setShowMainAreasDropdown(false);
        setShowSubAreasDropdown(false);
        setShowLeaderDropdown(false);
        setShowOwnerDropdown(false);
        setShowFilesDropdown(false);
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
            setShowMainAreasDropdown(false);
            setShowSubAreasDropdown(false);
            setShowLeaderDropdown(false);
            setShowOwnerDropdown(false);
            setShowFilesDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showMainAreasDropdown, showSubAreasDropdown, showLeaderDropdown, showOwnerDropdown, showFilesDropdown]);

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
        async function fetchFiles() {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/file/getProcedures`);
                if (!res.ok) throw new Error('Failed to fetch lookup data');
                // parse once, pull out both
                const { files } = await res.json();

                setFiles(files)
            } catch (err) {
                console.error("Error fetching areas:", err);
            }
        }
        fetchFiles();
    }, []);

    useEffect(() => {
        if (!formData.introInfo.mainArea) {
            // Show all sub-areas if no main area is selected
            const allSubs = Object.values(groupedAreas).flat();
            setAvailableSubAreas(allSubs);
            return;
        }

        const subs = groupedAreas[formData.introInfo.mainArea];
        if (!subs) return;

        setAvailableSubAreas(subs);

        // ❌ Don't clear sub area selection — just leave it as-is
    }, [formData.introInfo.mainArea, groupedAreas]);

    const handleSubAreaInput = (value) => {
        closeAllDropdowns();
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                subArea: value
            }
        }));

        let options = [];

        if (formData.introInfo.mainArea && groupedAreas[formData.introInfo.mainArea]) {
            options = groupedAreas[formData.introInfo.mainArea];
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

        if (formData.introInfo.mainArea && groupedAreas[formData.introInfo.mainArea]) {
            matches = groupedAreas[formData.introInfo.mainArea];
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
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                subArea: value
            }
        }));
        setShowSubAreasDropdown(false);
    };

    const handleProcedureInput = (value) => {
        closeAllDropdowns();
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                procedures: {
                    ...prev.introInfo.procedures,
                    procedure: removeFileExtension(value)
                }
            }
        }));

        const matches = files
            .filter(opt => opt.fileName.toLowerCase().includes(value.toLowerCase()));
        setFilteredFiles(matches);
        setShowFilesDropdown(true);

        const el = filesInputRef.current;
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
    const handleProcedureFocus = () => {
        closeAllDropdowns();

        const matches = files;
        setFilteredFiles(matches);
        setShowFilesDropdown(true);

        const el = filesInputRef.current;
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
    const selectProcedureSuggestion = (value) => {
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                procedures: {
                    id: uuidv4(),
                    procedure: removeFileExtension(value.fileName),
                    ref: value.docID,
                    version: "",
                    issueDate: ""
                }
            }
        }));
        setShowFilesDropdown(false);
    };

    const handleMainAreaInput = (value) => {
        closeAllDropdowns();
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                mainArea: value
            }
        }));

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
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                mainArea: value
            }
        }));
        setShowMainAreasDropdown(false);
    };

    const handleOwnerInput = (value) => {
        closeAllDropdowns();
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                owner: value
            }
        }));

        const matches = functionalOwners
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredOwner(matches);
        setShowOwnerDropdown(true);

        const el = ownerInputRef.current;
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
        setFilteredOwner(matches);
        setShowOwnerDropdown(true);

        const el = ownerInputRef.current;
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
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                owner: value
            }
        }));
        setShowOwnerDropdown(false);
    };

    const handleLeaderInput = (value) => {
        closeAllDropdowns();
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                inCharge: value
            }
        }));

        const matches = posLists
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredLeader(matches);
        setShowLeaderDropdown(true);

        const el = leaderInputRef.current;
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
    const handleLeaderFocus = () => {
        closeAllDropdowns();
        const matches = posLists;
        setFilteredLeader(matches);
        setShowLeaderDropdown(true);

        const el = leaderInputRef.current;
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
    const selectLeaderSuggestion = (value) => {
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                inCharge: value
            }
        }));
        setShowLeaderDropdown(false);
    };

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">JRA Task Information</h3>
                <table className="table-borders-jra-info">
                    <tbody>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Task Description</th>
                            <td>
                                <textarea
                                    className="jra-info-popup-page-textarea"
                                    value={formData.introInfo.description}
                                    placeholder="Insert a brief description of the task that is addressed in this JRA."
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            introInfo: {
                                                ...prev.introInfo,
                                                description: e.target.value
                                            }
                                        }))
                                    }
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Task Start</th>
                            <td>
                                <textarea
                                    className="jra-info-popup-page-textarea"
                                    value={formData.introInfo.start}
                                    placeholder="Insert how the task will be started."
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            introInfo: {
                                                ...prev.introInfo,
                                                start: e.target.value
                                            }
                                        }))
                                    }
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Task End</th>
                            <td>
                                <textarea
                                    className="jra-info-popup-page-textarea"
                                    value={formData.introInfo.end}
                                    placeholder="Insert how the task will be ended."
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            introInfo: {
                                                ...prev.introInfo,
                                                end: e.target.value
                                            }
                                        }))
                                    }
                                />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Main Operational Area Where Task is Conducted</th>
                            <td>
                                <div className="jra-info-popup-page-select-container">
                                    <input
                                        type="text"
                                        value={formData.introInfo.mainArea}
                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                        ref={mainAreasInputRef}
                                        placeholder="Select Main Area"
                                        onChange={e => handleMainAreaInput(e.target.value)}
                                        onFocus={handleMainAreasFocus}
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Sub Operational Area Where Task is Conducted</th>
                            <td>
                                <div className="jra-info-popup-page-select-container">
                                    <input
                                        type="text"
                                        value={formData.introInfo.subArea}
                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                        ref={subAreasInputRef}
                                        placeholder="Select Sub Area"
                                        onChange={e => handleSubAreaInput(e.target.value)}
                                        onFocus={handleSubAreasFocus}
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Functional Ownership</th>
                            <td>
                                <div className="jra-info-popup-page-select-container">
                                    <input
                                        type="text"
                                        value={formData.introInfo.owner}
                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                        ref={ownerInputRef}
                                        placeholder="Select Functional Owner"
                                        onChange={e => handleOwnerInput(e.target.value)}
                                        onFocus={handleOwnerFocus}
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Person in Charge of Work</th>
                            <td>
                                <div className="jra-info-popup-page-select-container">
                                    <input
                                        type="text"
                                        value={formData.introInfo.inCharge}
                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                        ref={leaderInputRef}
                                        placeholder="Select Person in Charge"
                                        onChange={e => handleLeaderInput(e.target.value)}
                                        onFocus={handleLeaderFocus}
                                    />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="jra-info-scope-group" style={{ marginTop: "15px" }}>
                    <div className="risk-scope-popup-page-additional-row ">
                        <div className="risk-popup-page-column-half-scope">
                            <div className="other-activities-group">
                                <label style={{ marginRight: "78px" }} className="jra-info-risk-label">Are there any activities affected by this JRA task? <span className="required-field">*</span></label>
                                <div className="yes-no-checkboxes-2">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.introInfo.otherAffected === 'yes'}
                                            onChange={() =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    introInfo: {
                                                        ...prev.introInfo,
                                                        otherAffected:
                                                            prev.introInfo.otherAffected === 'yes'
                                                                ? ''
                                                                : 'yes'
                                                    }
                                                }))
                                            }
                                        />
                                        Yes
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.introInfo.otherAffected === 'no'}
                                            onChange={() =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    introInfo: {
                                                        ...prev.introInfo,
                                                        otherAffected:
                                                            prev.introInfo.otherAffected === 'no'
                                                                ? ''
                                                                : 'no',
                                                        howAffected: '' // Reset howAffected when switching to 'no'
                                                    }
                                                }))
                                            }
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            {formData.introInfo.otherAffected === 'yes' && (
                                <textarea
                                    spellcheck="true"
                                    name="scope"
                                    className="jra-info-popup-page-textarea font-fam"
                                    rows="5"   // Adjust the number of rows for initial height
                                    placeholder="If yes, which activity is affected and how?" // Optional placeholder text
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            introInfo: {
                                                ...prev.introInfo,
                                                howAffected: e.target.value
                                            }
                                        }))
                                    }
                                    value={formData.introInfo.howAffected}
                                    readOnly={formData.introInfo.otherAffected !== 'yes'}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="jra-info-scope-group" style={{ marginTop: "15px" }}>
                    <div className="risk-scope-popup-page-additional-row ">
                        <div className="risk-popup-page-column-half-scope">
                            <div className="other-activities-group">
                                <label className="jra-info-risk-label">Is there an existing procedure/ SOP available for this JRA? <span className="required-field">*</span></label>
                                <div className="yes-no-checkboxes">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.introInfo.isProcedure === 'yes'}
                                            onChange={() =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    introInfo: {
                                                        ...prev.introInfo,
                                                        isProcedure:
                                                            prev.introInfo.isProcedure === 'yes'
                                                                ? ''
                                                                : 'yes'
                                                    }
                                                }))
                                            }
                                        />
                                        Yes
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.introInfo.isProcedure === 'no'}
                                            onChange={() =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    introInfo: {
                                                        ...prev.introInfo,
                                                        isProcedure:
                                                            prev.introInfo.isProcedure === 'no'
                                                                ? ''
                                                                : 'no',
                                                    }
                                                }))
                                            }
                                        />
                                        No
                                    </label>
                                </div>
                            </div>
                            {formData.introInfo.isProcedure === 'yes' && (
                                <table>

                                    <thead className="cp-table-header">
                                        <tr>
                                            <th style={{ textAlign: "center", width: "40%" }}>Name of Procedure</th>
                                            <th style={{ textAlign: "center", width: "20%" }}>Reference Number</th>
                                            <th style={{ textAlign: "center", width: "10%" }}>Version</th>
                                            <th style={{ textAlign: "center", width: "10%" }}>Issue Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr key={formData.introInfo.procedures.id}>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="procedure"
                                                    autoComplete="off"
                                                    value={formData.introInfo.procedures.procedure}
                                                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                    placeholder="Insert the name of the procedure/ SOP that must accompany this JRA."
                                                    ref={filesInputRef}
                                                    onChange={e => handleProcedureInput(e.target.value)}
                                                    onFocus={handleProcedureFocus}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="reference"
                                                    autoComplete="off"
                                                    value={formData.introInfo.procedures.ref}
                                                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                    placeholder="Insert Reference Number"
                                                    onChange={e =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            introInfo: {
                                                                ...prev.introInfo,
                                                                procedures: {
                                                                    ...prev.introInfo.procedures,
                                                                    ref: e.target.value
                                                                }
                                                            }
                                                        }))
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="version"
                                                    autoComplete="off"
                                                    value={formData.introInfo.procedures.version}
                                                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                    placeholder="Insert Version"
                                                    onChange={e =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            introInfo: {
                                                                ...prev.introInfo,
                                                                procedures: {
                                                                    ...prev.introInfo.procedures,
                                                                    version: e.target.value
                                                                }
                                                            }
                                                        }))
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    name="issueDate"
                                                    autoComplete="off"
                                                    style={{ fontFamily: "Arial" }}
                                                    value={formData.introInfo.procedures.issueDate}
                                                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                    placeholder="Insert Issue Date"
                                                    onChange={e =>
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            introInfo: {
                                                                ...prev.introInfo,
                                                                procedures: {
                                                                    ...prev.introInfo.procedures,
                                                                    issueDate: e.target.value
                                                                }
                                                            }
                                                        }))
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    </tbody>

                                </table>
                            )}
                        </div>
                    </div>
                </div>
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

            {showLeaderDropdown && filteredLeader.length > 0 && (
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
                    {filteredLeader.filter(term => term && term.trim() !== "").sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectLeaderSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {showOwnerDropdown && filteredOwner.length > 0 && (
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
                    {filteredOwner.sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectOwnerSuggestion(term.owner)}
                        >
                            {term.owner}
                        </li>
                    ))}
                </ul>
            )}

            {(false && showFilesDropdown) && files.length > 0 && (
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
                    {filteredFiles.sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectProcedureSuggestion(term)}
                        >
                            {removeFileExtension(term.fileName)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default IntroTaskInfo;
