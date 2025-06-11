import React, { useRef, useState, useEffect, version } from "react";
import "./IntroTaskInfo.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "react-toastify";

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
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);
    const [activeStaffMemberId, setActiveStaffMemberId] = useState(null);

    const [functionalOwners] = useState(['Owner1', 'Owner2', 'Owner3', 'Owner4', 'Owner5']);
    const [leaders] = useState(['Leader1', 'Leader2', 'Leader3', 'Leader4', 'Leader5']);
    const [staffMembers] = useState(['Staff1', 'Staff2', 'Staff3', 'Staff4', 'Staff5']);

    const handleMemberChange = (id, value) => {
        setFormData(prev => ({
            ...prev,
            introInfo: {
                ...prev.introInfo,
                members: prev.introInfo.members.map(m =>
                    m._id === id ? { ...m, member: value } : m
                )
            }
        }));
    };

    const addMember = (index) => {
        setFormData(prev => {
            const newArr = [...prev.introInfo.members];
            newArr.splice(index + 1, 0, { _id: uuidv4(), member: "" });
            return {
                ...prev,
                introInfo: { ...prev.introInfo, members: newArr }
            };
        });
    };

    const removeMember = (id) => {
        setFormData(prev => {
            const curr = prev.introInfo.members;
            // if there's only one member left, bail out
            if (curr.length <= 1) {
                toast.warn("You must have at least one staff value", {
                    closeButton: false,
                    autoClose: 800,
                });
                return prev;
            }
            return {
                ...prev,
                introInfo: {
                    ...prev.introInfo,
                    members: curr.filter(m => m._id !== id)
                }
            };
        });
    };

    const closeAllDropdowns = () => {
        setShowMainAreasDropdown(false);
        setShowSubAreasDropdown(false);
        setShowLeaderDropdown(false);
        setShowOwnerDropdown(false);
        setShowStaffDropdown(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest('.floating-dropdown') &&
                !e.target.closest('input');
            if (outside) {
                setShowMainAreasDropdown(false);
                setShowSubAreasDropdown(false);
                setShowLeaderDropdown(false);
                setShowOwnerDropdown(false);
                setShowStaffDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMainAreasDropdown, showSubAreasDropdown, showLeaderDropdown, showOwnerDropdown, showStaffDropdown]);

    useEffect(() => {
        async function fetchValues() {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/getValues`);
                if (!res.ok) throw new Error('Failed to fetch lookup data');
                // parse once, pull out both
                const { areas, risks, controls } = await res.json();
                // build a lookup
                const lookup = {};
                areas.forEach(({ mainArea, subAreas }) => {
                    lookup[mainArea] = subAreas;
                });

                setGroupedAreas(lookup);
                setMainAreas(Object.keys(lookup));
                setRiskSources(risks);
                setControls(controls);
            } catch (err) {
                console.error("Error fetching areas:", err);
            }
        }
        fetchValues();
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
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);

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

        matches = matches.slice(0, 15);
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
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);
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
        const matches = mainAreas.slice(0, 15);
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
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);
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
        const matches = functionalOwners.slice(0, 15);
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

        const matches = leaders
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);
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
        const matches = leaders.slice(0, 15);
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

    const handleStaffInput = (id, value, e) => {
        closeAllDropdowns();
        // update the typed name
        handleMemberChange(id, value);
        // filter your staff list
        const matches = staffMembers
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 15);
        setFilteredStaff(matches);
        setShowStaffDropdown(true);
        setActiveStaffMemberId(id);
        // position it under the current input
        const rect = e.target.getBoundingClientRect();
        setDropdownPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
            width: rect.width
        });
    };

    const handleStaffFocus = (id, e) => {
        closeAllDropdowns();
        // show all staff on focus
        setFilteredStaff(staffMembers.slice(0, 15));
        setShowStaffDropdown(true);
        setActiveStaffMemberId(id);
        const rect = e.target.getBoundingClientRect();
        setDropdownPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
            width: rect.width
        });
    };

    const selectStaffSuggestion = (id, value) => {
        handleMemberChange(id, value);
        setShowStaffDropdown(false);
        setActiveStaffMemberId(null);
    };

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">Introductory Task Information <span className="required-field">*</span></h3>
                <table className="table-borders-jra-info">
                    <tbody>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Task Description</th>
                            <td>
                                <textarea
                                    className="jra-info-popup-page-textarea"
                                    value={formData.introInfo.description}
                                    placeholder="Enter task description."
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
                                    placeholder="Enter how the task will be started."
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
                                    placeholder="Enter how the task will be ended."
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
                                        placeholder="Choose Main Area"
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
                                        placeholder="Choose Sub Area"
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
                                        placeholder="Choose Functional Owner"
                                        onChange={e => handleOwnerInput(e.target.value)}
                                        onFocus={handleOwnerFocus}
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Person in Charge of this Task</th>
                            <td>
                                <div className="jra-info-popup-page-select-container">
                                    <input
                                        type="text"
                                        value={formData.introInfo.inCharge}
                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                        ref={leaderInputRef}
                                        placeholder="Choose Person in Charge"
                                        onChange={e => handleLeaderInput(e.target.value)}
                                        onFocus={handleLeaderFocus}
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="jra-info-table-header">Other Team Members Involved in this Task</th>
                            <td>
                                <div className="members-container-jra-info">
                                    {formData.introInfo.members.map((m, idx) => (
                                        <div key={m._id} className="member-input-row-jra-info">
                                            <div className="jra-info-popup-page-select-container">
                                                <input
                                                    type="text"
                                                    value={m.member}
                                                    placeholder="Choose Team Member"
                                                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                    onChange={e => handleStaffInput(m._id, e.target.value, e)}
                                                    onFocus={e => handleStaffFocus(m._id, e)}
                                                />
                                            </div>
                                            <FontAwesomeIcon
                                                icon={faPlusCircle}
                                                className="icon-jra-info add-icon-jra-info"
                                                onClick={() => addMember(idx)}
                                            />
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="icon-jra-info delete-icon-jra-info"
                                                onClick={() => removeMember(m._id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="jra-info-scope-group" style={{ marginTop: "15px" }}>
                    <div className="risk-scope-popup-page-additional-row ">
                        <div className="risk-popup-page-column-half-scope">
                            <div className="other-activities-group">
                                <label className="jra-info-risk-label">Are there other activities affected by this task? <span className="required-field">*</span></label>
                                <div className="yes-no-checkboxes">
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
                                    placeholder="Please describe the activity and how it affects this task." // Optional placeholder text
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
                                <label className="jra-info-risk-label">Is there an existing procedure available for this task? <span className="required-field">*</span></label>
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
                                        {formData.introInfo.procedures.map((row, index) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <div className="jra-info-popup-page-select-container">
                                                        <input
                                                            type="text"
                                                            name="procedure"
                                                            value={row.procedure}
                                                            className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                            placeholder="Choose Procedure"
                                                            onChange={e =>
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    introInfo: {
                                                                        ...prev.introInfo,
                                                                        procedures: prev.introInfo.procedures.map((p, i) =>
                                                                            i === index ? { ...p, procedure: e.target.value } : p
                                                                        )
                                                                    }
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        name="reference"
                                                        value={row.ref}
                                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                        placeholder="Enter Reference Number"
                                                        onChange={e =>
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                introInfo: {
                                                                    ...prev.introInfo,
                                                                    procedures: prev.introInfo.procedures.map((p, i) =>
                                                                        i === index ? { ...p, ref: e.target.value } : p
                                                                    )
                                                                }
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        name="version"
                                                        value={row.version}
                                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                        placeholder="Enter Version"
                                                        onChange={e =>
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                introInfo: {
                                                                    ...prev.introInfo,
                                                                    procedures: prev.introInfo.procedures.map((p, i) =>
                                                                        i === index ? { ...p, version: e.target.value } : p
                                                                    )
                                                                }
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        name="issueDate"
                                                        style={{ fontFamily: "Arial" }}
                                                        value={row.issueDate}
                                                        className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                                        placeholder="Enter Issue Date"
                                                        onChange={e =>
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                introInfo: {
                                                                    ...prev.introInfo,
                                                                    procedures: prev.introInfo.procedures.map((p, i) =>
                                                                        i === index ? { ...p, issueDate: e.target.value } : p
                                                                    )
                                                                }
                                                            }))
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {showStaffDropdown && filteredStaff.length > 0 && (
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
                    {filteredStaff.sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectStaffSuggestion(activeStaffMemberId, term)}
                        >
                            {term}
                        </li>
                    ))
                    }
                </ul >
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
                    {filteredSubAreas.sort().map((term, i) => (
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
                    {filteredLeader.sort().map((term, i) => (
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
                            onMouseDown={() => selectOwnerSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default IntroTaskInfo;
