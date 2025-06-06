import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./RiskManagementPage.css";
import TermTableRisk from "../RiskRelated/RiskComponents/TermTableRisk";
import AbbreviationTableRisk from "../RiskRelated/RiskComponents/AbbreviationTableRisk"
import ReferenceTable from "../CreatePage/ReferenceTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faQuestionCircle, faShareNodes, faUpload, faRotateRight, faChevronLeft, faChevronRight, faInfoCircle, faTeeth, faTriangleCircleSquare, faTriangleExclamation, faUserTie, faHardHat } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "../Notifications/TopBarDD";
import AttendanceTable from "../RiskRelated/AttendanceTable";
import DocumentSignaturesRiskTable from "../RiskRelated/DocumentSignaturesRiskTable";
import IBRATable from "../RiskRelated/IBRATable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import ControlAnalysisTable from "../RiskRelated/ControlAnalysisTable";
import LoadRiskDraftPopup from "../RiskRelated/LoadRiskDraftPopup";
import SharePageRisk from "../RiskRelated/SharePageRisk";
import RiskAim from "../RiskRelated/RiskInfo/RiskAim";
import RiskScope from "../RiskRelated/RiskInfo/RiskScope";
import ExecutiveSummary from "../RiskRelated/ExecutiveSummary";

const RiskManagementPageBTA = () => {
    const navigate = useNavigate();
    const riskType = useParams().type;
    const [share, setShare] = useState(false);
    const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
    const [usedTermCodes, setUsedTermCodes] = useState([]);
    const [role, setRole] = useState("");
    const [loadedID, setLoadedID] = useState('');
    const [isLoadPopupOpen, setLoadPopupOpen] = useState(false);
    const [titleSet, setTitleSet] = useState(false);
    const [userID, setUserID] = useState('');
    const [userIDs, setUserIDs] = useState([]);
    const autoSaveInterval = useRef(null);
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const loadedIDRef = useRef('');
    const [offlineDraft, setOfflineDraft] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [helpRA, setHelpRA] = useState(false);
    const [helpScope, setHelpScope] = useState(false);

    const openHelpRA = () => {
        setHelpRA(true);
    };

    const closeHelpRA = () => {
        setHelpRA(false);
    };

    const openHelpScope = () => {
        setHelpScope(true);
    };

    const closeHelpScope = () => {
        setHelpScope(false);
    };

    const openShare = () => {
        if (loadedID) {
            setShare(true);
        } else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please save a draft before sharing.", {
                closeButton: false,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        }
    };
    const closeShare = () => { setShare(false); };
    const openLoadPopup = () => setLoadPopupOpen(true);
    const closeLoadPopup = () => setLoadPopupOpen(false);

    const handleSave = () => {
        if (formData.title !== "") {
            if (loadedIDRef.current === '') {
                if (riskType === "IBRA") {
                    saveData();
                }

                toast.dismiss();
                toast.clearWaitingQueue();
                toast.success("Draft has been successfully saved", {
                    closeButton: false,
                    autoClose: 1500, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });
            }
            else if (loadedIDRef.current !== '') {
                if (riskType === "IBRA") {
                    updateData(userIDsRef.current);
                }

                toast.dismiss();
                toast.clearWaitingQueue();
                toast.success("Draft has been successfully updated", {
                    closeButton: false,
                    autoClose: 800, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });
            }
        }
        else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please fill in at least the title field before saving.", {
                closeButton: false,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const saveData = async () => {
        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
            usedTermCodes: usedTermCodesRef.current,
            formData: formDataRef.current,
            userIDs: userIDsRef.current,
            creator: userIDRef.current,
            updater: null,
            dateUpdated: null
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/safe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(dataToStore),
            });
            const result = await response.json();

            if (result.id) {
                setLoadedID(result.id);
                loadedIDRef.current = result.id;
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const updateData = async (selectedUserIDs) => {
        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,
            usedTermCodes: usedTermCodesRef.current,
            formData: formDataRef.current,
            userIDs: selectedUserIDs,
            updater: userIDRef.current,
            dateUpdated: new Date().toISOString(),
            userID
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/modifySafe/${loadedIDRef.current}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(dataToStore),
            });
            const result = await response.json();

            console.log(result.message);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleClick = () => {
        if (formData.title === "") {
            toast.error("Please fill in the title field", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            handleGenerateARegister();
        }
    };

    const handleClick2 = () => {
        if (formData.title === "") {
            toast.error("Please fill in the title field", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            handleGenerateIBRA();  // Call your function when the form is valid
        }
    };

    const handleClick3 = () => {
        if (formData.title === "") {
            toast.error("Please fill in the title field", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            handleGenerateIBRADocument();  // Call your function when the form is valid
        }
    };

    const handlePubClick = () => {
        const newErrors = validateForm();
        setErrors(newErrors);

        if (loadedIDRef.current === '') {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please load a draft before publishing.", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            return;
        }

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            if (riskType === "IBRA") {
                handleIBRAPublish();  // Call your function when the form is valid
            }
        }
    };

    const loadData = async (loadID) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/getDraft/${loadID}`);
            const storedData = await response.json();
            // Update your states as needed:
            setUsedAbbrCodes(storedData.usedAbbrCodes || []);
            setUsedTermCodes(storedData.usedTermCodes || []);
            setUserIDs(storedData.userIDs || []);
            setFormData(storedData.formData || {});
            setFormData(prev => ({ ...prev }));
            setTitleSet(true);
            loadedIDRef.current = loadID;
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const capitalizeWords = (text) =>
        text
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    const updateRefRow = (index, field, value) => {
        const updatedRefRows = [...formData.references];
        updatedRefRows[index][field] = value;  // Update the specific field in the row

        setFormData({
            ...formData,
            references: updatedRefRows,  // Update the procedure rows in state
        });
    };

    const updateIbraRows = (nrToUpdate, newValues) => {
        setFormData(prev => ({
            ...prev,
            ibra: prev.ibra.map(item =>
                item.nr === nrToUpdate
                    ? { ...item, ...newValues }
                    : item
            )
        }));
    };

    const updateCEARows = (nrToUpdate, newValues) => {
        setFormData(prev => ({
            ...prev,
            cea: prev.cea.map(item =>
                item.nr === nrToUpdate
                    ? { ...item, ...newValues }
                    : item
            )
        }));
    };

    const addIBRARow = () => {
        setFormData(prevFormData => ({
            ...prevFormData,
            ibra: [
                ...prevFormData.ibra,
                {
                    id: uuidv4(), nr: prevFormData.ibra.length + 1, main: "", sub: "", owner: "", odds: "", riskRank: "",
                    hazards: [], controls: [], S: "-", H: '-', E: "-", C: "-", LR: "-", M: "-",
                    R: "-", source: "", material: "", priority: "", possible: [{ possibleI: "", actions: [{ action: "" }], dueDate: [{ date: "" }] }], UE: "", additional: "", maxConsequence: ""
                }
            ]
        }));
    };

    const addCEARow = () => {
        setFormData(prevFormData => ({
            ...prevFormData,
            cea: [
                ...prevFormData.cea,
                {
                    id: uuidv4(), nr: prevFormData.cea.length + 1, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: ""
                }
            ]
        }));
    };

    const [formData, setFormData] = useState({
        title: "",
        documentType: useParams().type,
        aim: "The aim of this risk assessment is ",
        scopeExclusions: "",
        execSummaryGen: "",
        execSummary: "",
        scopeInclusions: "",
        scope: "",
        date: new Date().toLocaleDateString(),
        version: "1",
        site: "",
        dateConducted: "",
        rows: [
            { auth: "Facilitator", name: "", pos: "", num: 1 },
            { auth: "Owner", name: "", pos: "", num: 2 },
            { auth: "Reviewer", name: "", pos: "", num: 3 },
            { auth: "Approver", name: "", pos: "", num: 4 }
        ],
        ibra: [
            {
                id: uuidv4(), nr: 1, main: "", sub: "", owner: "", odds: "", riskRank: "",
                hazards: [], controls: [], S: "-", H: '-', E: "-", C: "-",
                LR: "-", M: "-", R: "-", source: "", material: "", priority: "",
                possible: [{ possibleI: "", actions: [{ action: "" }], dueDate: [{ date: "" }] }], UE: "", additional: "", maxConsequence: ""
            }
        ],
        cea: [
            {
                id: uuidv4(), nr: 1, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: ""
            }
        ],
        abbrRows: [],
        termRows: [],
        attendance: [
            {
                name: "", site: "", designation: "Facilitator", num: ""
            }
        ],
        PPEItems: [],
        HandTools: [],
        Equipment: [],
        MobileMachine: [],
        Materials: [],
        supportingDocuments: [],
        references: [],
        pictures: [],
        reviewDate: 0,
        changeTable: [
            { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
        ],
    });

    const formDataRef = useRef(formData);
    const usedAbbrCodesRef = useRef(usedAbbrCodes);
    const usedTermCodesRef = useRef(usedTermCodes);
    const userIDsRef = useRef(userIDs);
    const userIDRef = useRef(userID);

    useEffect(() => {
        userIDRef.current = userID;
    }, [userID]);

    useEffect(() => {
        userIDsRef.current = userIDs;
    }, [userIDs]);

    useEffect(() => {
        usedAbbrCodesRef.current = usedAbbrCodes;
    }, [usedAbbrCodes]);

    useEffect(() => {
        usedTermCodesRef.current = usedTermCodes;
    }, [usedTermCodes]);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        if (offlineDraft) return;

        if (!autoSaveInterval.current && formData.title.trim() !== "") {
            console.log("✅ Auto-save interval set");

            autoSaveInterval.current = setInterval(() => {
                console.log("⏳ Auto-saving...");
                autoSaveDraft();
            }, 120000); // Auto-save every 30 seconds
        }

        return () => {
            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
                autoSaveInterval.current = null;
                console.log("🧹 Auto-save interval cleared");
            }
        };
    }, [formData.title]);

    const autoSaveDraft = () => {
        if (formData.title.trim() === "") return; // Don't save without a valid title

        if (loadedIDRef.current === '') {
            if (riskType === "IBRA") {
                saveData();
            }
            console.log("📝 autoSaveDraft() triggered 1");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Draft has been auto-saved", {
                closeButton: true,
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            if (riskType === "IBRA") {
                updateData(userIDsRef.current);
            }
            console.log("📝 autoSaveDraft() triggered 2");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Draft has been auto-saved", {
                closeButton: true,
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const [history, setHistory] = useState([]);
    const timeoutRef = useRef(null);
    const previousFormData = useRef(formData);
    const [redoHistory, setRedoHistory] = useState([]);

    // Function to save to history with a limit
    const saveToHistory = useCallback(() => {
        const currentState = {
            formData,
            usedAbbrCodes,
            usedTermCodes,
        };

        setHistory((prev) => {
            if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(currentState)) {
                return prev; // Prevent duplicate saves
            }
            return [...prev, currentState]; // Save the new state
        });
    }, [formData, usedAbbrCodes, usedTermCodes]);

    // Detects form changes across all components with debounce
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(saveToHistory, 1000); // Only save after 1s of inactivity
    }, [formData, usedAbbrCodes, usedTermCodes]);

    const undoLastChange = () => {
        if (history.length > 1) {
            const lastState = history[history.length - 2]; // Get the last valid state
            const currentState = history[history.length - 1];

            // Restore the previous state
            setFormData(lastState.formData);
            setUsedAbbrCodes(lastState.usedAbbrCodes);
            setUsedTermCodes(lastState.usedTermCodes);

            setHistory((prev) => prev.slice(0, -1)); // Remove last history entry
            setRedoHistory((prev) => [...prev, currentState]);

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Undo successful!", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("No changes to undo.", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const redoChange = () => {
        if (redoHistory.length > 0) {
            const nextState = redoHistory[redoHistory.length - 1];

            // Apply redo state
            setFormData(nextState.formData);
            setUsedAbbrCodes(nextState.usedAbbrCodes);
            setUsedTermCodes(nextState.usedTermCodes);

            // Push back into history
            setHistory((prev) => [...prev, nextState]);
            setRedoHistory((prev) => prev.slice(0, -1));

            toast.success("Redo successful!", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
        } else {
            toast.warn("Nothing to redo.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title) newErrors.title = true;
        if (!formData.documentType) newErrors.documentType = true;
        if (!formData.aim) newErrors.aim = true;
        if (formData.abbrRows.length === 0) newErrors.abbrs = true;
        if (formData.termRows.length === 0) newErrors.terms = true;

        if (formData.rows.length === 0) {
            newErrors.signs = true;
        } else {
            formData.rows.forEach((row, index) => {
                if (!row.name) newErrors.signs = true;
            });
        }

        console.log(newErrors);

        return newErrors;
    };

    // Authentication check
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/FrontendDMS/403");
            }

            setUserID(decodedToken.userId);
            setUserIDs([decodedToken.userId]);
            setRole(decodedToken.role);
        }
    }, [navigate]);

    // Handle input changes for normal fields
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        console.log(formData)

        if (e.target.name === "title" && e.target.value.trim() !== "") {
            setTitleSet(true); // Enable auto-save only after title is entered
        }
    };

    // Handle input changes for the table rows
    const handleRowChange = (e, index, field) => {
        const newRows = [...formData.rows];
        const rowToChange = newRows[index];

        // Save the previous value of 'auth' before change for validation
        const previousAuth = rowToChange.auth;

        // Update the field value
        rowToChange[field] = e.target.value;

        // Automatically set num based on the auth type
        if (rowToChange.auth === "Facilitator") {
            rowToChange.num = 1;
        } else if (rowToChange.auth === "Owner") {
            rowToChange.num = 2;
        } else if (rowToChange.auth === "Reviewer") {
            rowToChange.num = 3;
        } else if (rowToChange.auth === "Approver") {
            rowToChange.num = 4;
        }

        // Only perform validation if the 'auth' field was modified
        if (field === "auth") {
            // Check if the current 'Author', 'Reviewer', or 'Approved By' is being removed or modified
            const requiredRoles = ["Owner", "Reviewer", "Approver", "Facilitator"];

            // Check if there is at least one row with each required auth type
            const isValid = requiredRoles.every(role => {
                return formData.rows.filter((row) => row.auth === role).length > 0 || rowToChange.auth === role;
            });

            if (!isValid) {
                toast.error(`You must have at least one ${requiredRoles.find(role => formData.rows.filter((row) => row.auth === role).length === 0)}.`, {
                    closeButton: true,
                    autoClose: 800, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });

                // Revert the change if invalid
                rowToChange.auth = previousAuth;  // Revert to previous auth
                rowToChange[field] = previousAuth; // Revert the field to its previous value

                setFormData((prevFormData) => ({
                    ...prevFormData,
                    rows: newRows,
                }));
                return; // Prevent the update if invalid
            }
        }

        // Update formData with the new rows
        setFormData((prevFormData) => ({
            ...prevFormData,
            rows: newRows,
        }));
    };

    // Add a new row to the table
    const addRow = () => {
        setFormData({
            ...formData,
            rows: [
                ...formData.rows,
                { auth: "Owner", name: "", pos: "", num: 1 }
            ]
        });
    };

    const addAttendanceRow = () => {
        setFormData({
            ...formData,
            attendance: [
                ...formData.attendance,
                { name: "", site: "", designation: "", num: "" }
            ]
        });
    };

    const updateSignatureRows = (newSignatureRows) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            rows: newSignatureRows, // Update procedureRows with new data
        }));
    };

    const updateAttendanceRows = (newAttendanceRows) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            attendance: newAttendanceRows, // Update procedureRows with new data
        }));
    };

    const updateIBRARows = (newIbra) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            ibra: newIbra, // Update procedureRows with new data
        }));
    };

    const updateRefRows = (newRef) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            references: newRef, // Update procedureRows with new data
        }));
    };

    const updateCeaRows = (newCEA) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            cea: newCEA, // Update procedureRows with new data
        }));
    };

    const addRefRow = () => {
        const lastNr = formData.references.length > 0 && typeof formData.references[formData.references.length - 1].nr === 'number'
            ? formData.references[formData.references.length - 1].nr
            : 0; // Safely get the last nr value or 0 if no rows exist or nr is not a number

        setFormData({
            ...formData,
            references: [
                ...formData.references,
                {
                    nr: lastNr + 1,
                    ref: '',
                    refDesc: ''
                }
            ]
        });
    };

    const removeRefRow = (indexToRemove) => {
        setFormData({
            ...formData,
            references: formData.references.filter((_, index) => index !== indexToRemove),
        });
    };

    const removeRow = (indexToRemove) => {
        const rowToRemove = formData.rows[indexToRemove];

        // Prevent removal of the initial required rows
        const initialRequiredRows = ["Owner", "Reviewer", "Approver", "Facilitator"];
        if (
            initialRequiredRows.includes(rowToRemove.auth) &&
            formData.rows.filter((row) => row.auth === rowToRemove.auth).length === 1
        ) {
            toast.error(`You must keep at least one ${rowToRemove.auth}.`, {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        // Proceed with removal if conditions are met
        setFormData({
            ...formData,
            rows: formData.rows.filter((_, index) => index !== indexToRemove),
        });
    };

    const removeIBRARow = (idToRemove) => {
        if (formData.ibra.length === 1) {
            toast.error("You must keep at least one row.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
            return;
        }

        const updatedRows = formData.ibra.filter(row => row.id !== idToRemove);

        if (updatedRows.length === formData.ibra.length) {
            toast.error("Row not found.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
            return;
        }

        // Re-number the rows in ascending order starting from 1
        const reNumberedRows = updatedRows.map((ibra, index) => ({
            ...ibra,
            nr: index + 1
        }));

        console.log('After re-numbering:', reNumberedRows);

        setFormData({
            ...formData,
            ibra: reNumberedRows,
        });
    };

    const removeCEARow = (idToRemove) => {
        // Prevent deleting the very last CEA row
        if (formData.cea.length === 1) {
            toast.error("You must keep at least one row.", {
                position: "top-center",
                autoClose: 3000,
            });
            return;
        }

        // Grab the control text we're about to delete
        const removedRow = formData.cea.find(row => row.id === idToRemove);
        const removedControl = removedRow?.control;

        // Remove that row from CEA
        const updatedRows = formData.cea.filter(row => row.id !== idToRemove);

        if (updatedRows.length === formData.cea.length) {
            toast.error("Row not found.", {
                position: "top-center",
                autoClose: 3000,
            });
            return;
        }

        // Re-number the remaining CEA rows
        const reNumberedCEA = updatedRows.map((cea, index) => ({
            ...cea,
            nr: index + 1
        }));

        // Also purge this control from every IBRA row
        const updatedIBRA = formData.ibra.map(ibraRow => ({
            ...ibraRow,
            controls: ibraRow.controls.filter(ctrl => ctrl !== removedControl)
        }));

        // Push both new arrays into state at once
        setFormData(prev => ({
            ...prev,
            cea: reNumberedCEA,
            ibra: updatedIBRA
        }));
    };

    const removeAttendanceRow = (indexToRemove) => {
        // Prevent removal if there's only one row left
        if (formData.attendance.length === 1) {
            toast.error(`You must have at least one attendance row.`, {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        // Proceed with removal if conditions are met
        setFormData({
            ...formData,
            attendance: formData.attendance.filter((_, index) => index !== indexToRemove),
        });
    };

    // Send data to backend to generate a Word document
    const handleGenerateIBRADocument = async () => {
        const dataToStore = {
            formData,
        };

        const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType;
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-ibra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.docx`);
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleGenerateARegister = async () => {
        const dataToStore = {
            formData
        };

        if (formData.attendance.some(row => !row.name.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees names must have a value.", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (formData.attendance.some(row => !row.site.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees company/site must have a value.", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (formData.attendance.some(row => !row.designation.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees designation must have a value.", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType + " Attendance Register";
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-risk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.docx`);
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleGenerateIBRA = async () => {
        const dataToStore = {
            formData
        };

        const requiredIBRAFields = [
            "main", "sub", "owner", "odds", "riskRank",
            "hazards", "controls", "S", "H", "E", "C",
            "LR", "M", "R", "source", "majorRisk", "priority",
            "possible", "UE", "additional", "maxConsequence"
        ];

        if (formData.ibra.some(row =>
            requiredIBRAFields.some(key => !row[key]?.toString().trim())
        )) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All IBRA fields must have a value.", {
                closeButton: true,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType + " Output Register";
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-xlsx`, {
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
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleIBRAPublish = async () => {
        const dataToStore = {
            usedAbbrCodes,       // your current state values
            usedTermCodes,
            formData,
            userID,
            azureFN: ""
        };

        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/publish-ibra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            toast.success(`Document published`, {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            setLoading(false);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const prevControlsRef = useRef([]);  // hold last‐seen list so we only fetch on real changes

    useEffect(() => {
        // 1. Gather all controls from ibra and dedupe
        const allControls = formData.ibra.flatMap(item => item.controls);
        const distinctControls = Array.from(new Set(allControls)).sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
        );

        // 2. Bail out if nothing really changed
        const prev = prevControlsRef.current;
        if (
            distinctControls.length === prev.length &&
            distinctControls.every((c, i) => c === prev[i])
        ) {
            return;
        }
        prevControlsRef.current = distinctControls;

        // 3. If no controls, clear the CEA
        if (distinctControls.length === 0) {
            updateCeaRows([]);
            return;
        }

        // 4. Fetch details for the new/removed set
        const fetchCEAData = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_URL}/api/riskInfo/getControls`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ controls: distinctControls }),
                    }
                );
                const { controls: data } = await res.json(); // e.g. [{ control: 'ctrl1', critical: 'Yes', act: '...', activation: 'Pre', … }, …]

                // 5. Build the new cea array by merging
                const mergedCEA = distinctControls.map((ctrl, idx) => {
                    // find the old row (if any) and the returned data (if any)
                    const oldRow = formData.cea.find(r => r.control === ctrl);
                    const returned = data.find(d => d.control === ctrl) || {};

                    return {
                        id: oldRow?.id || uuidv4(),
                        nr: idx + 1,
                        control: ctrl,
                        critical: oldRow?.critical ?? returned.critical ?? '',
                        act: oldRow?.act ?? returned.act ?? '',
                        activation: oldRow?.activation ?? returned.activation ?? '',
                        hierarchy: oldRow?.hierarchy ?? returned.hierarchy ?? '',
                        cons: oldRow?.cons ?? returned.cons ?? '',
                        quality: oldRow?.quality ?? returned.quality ?? '',
                        cer: oldRow?.cer ?? returned.cer ?? '',
                        notes: oldRow?.notes ?? returned.notes ?? ''
                    };
                });

                // 6. Push it back into your formData
                updateCeaRows(mergedCEA);
            } catch (err) {
                console.error('Failed to fetch CEA data', err);
            }
        };

        fetchCEAData();
    }, [formData.ibra]);

    return (
        <div className="risk-create-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>

                    <div className="button-container-create">
                        <button className="but-um" onClick={() => setLoadPopupOpen(true)}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-icon" />
                                <span className="button-text">Saved Drafts</span>
                            </div>
                        </button>
                        <button className="but-um" onClick={() => navigate('/FrontendDMS/generatedIBRADocs')}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-icon" />
                                <span className="button-text">Published Risk Assessments</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/bta2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{riskType}</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-floating-toggle" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                    <FontAwesomeIcon icon={faChevronRight} />
                </div>
            )}

            {share && <SharePageRisk closePopup={closeShare} userID={userID} userIDs={userIDs} popupVisible={share} saveData={updateData} setUserIDs={setUserIDs} />}
            {isLoadPopupOpen && <LoadRiskDraftPopup riskType={riskType} isOpen={isLoadPopupOpen} onClose={closeLoadPopup} setLoadedID={setLoadedID} loadData={loadData} userID={userID} />}
            <div className="main-box-risk-create">
                <div className="top-section-risk-create-page">
                    <div className="icons-container-risk-create-page">
                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faFloppyDisk} title="Save" onClick={handleSave} />
                        </div>

                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faRotateLeft} onClick={undoLastChange} title="Undo" />
                        </div>

                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faRotateRight} onClick={redoChange} title="Redo" />
                        </div>

                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faShareNodes} onClick={openShare} className={`${!loadedID ? "disabled-share" : ""}`} title="Share" />
                        </div>

                        <div className="burger-menu-icon-create-page-1">
                            <FontAwesomeIcon icon={faUpload} onClick={handlePubClick} className={`${!loadedID ? "disabled-share" : ""}`} title="Publish" />
                        </div>
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBarDD role={role} menu={"1"} create={true} />
                </div>

                <div className={`scrollable-box-risk-create`}>
                    <div className="input-row-risk-create">
                        <div className={`input-box-title-risk-create ${errors.title ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Risk Assessment Title <span className="required-field">*</span></h3>
                            <div className="input-group-risk-create">
                                <input
                                    spellcheck="true"
                                    type="text"
                                    name="title"
                                    className="font-fam title-input"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Insert Risk Assessment Title (e.g., Working at Heights)"
                                />
                                <span className="type-risk-create">{formData.documentType}</span>
                            </div>
                        </div>
                    </div>

                    <div className="input-row-risk-create">
                        <div className="input-box-type-risk-create">
                            <h3 className="font-fam-labels">Operation / Site <span className="required-field">*</span></h3>
                            <select
                                className="table-control font-fam"
                                name="site"
                                value={formData.site}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Operation/ Site Name</option>
                                <option value="Policy">Site 1</option>
                                <option value="Procedure">Site 2</option>
                                <option value="Standard">Site 3</option>
                            </select>
                        </div>
                        <div className="input-box-type-risk-create-date">
                            <h3 className="font-fam-labels">Date Conducted <span className="required-field">*</span></h3>
                            <input
                                value={formData.dateConducted}
                                className="table-control font-fam date-input-risk-create"
                                type="date"
                                name="dateConducted"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <DocumentSignaturesRiskTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} />

                    <div className="input-row-risk-create">
                        <div className={`input-box-aim-risk-create ${errors.aim ? "error-create" : ""}`}>
                            <button
                                className="top-left-button-refs"
                                title="Information"
                            >
                                <FontAwesomeIcon icon={faInfoCircle} onClick={openHelpRA} style={{ cursor: 'pointer' }} className="icon-um-search" />
                            </button>
                            <h3 className="font-fam-labels">Aim <span className="required-field">*</span></h3>
                            <textarea
                                spellcheck="true"
                                name="aim"
                                className="aim-textarea-risk-create font-fam"
                                onChange={handleInputChange}
                                value={formData.aim}
                                rows="5"   // Adjust the number of rows for initial height
                                placeholder="Clearly state the goal of the risk assessment, focusing on what the assessment intends to achieve or address. Keep it specific, relevant, and outcome-driven"// Optional placeholder text
                            />
                        </div>
                    </div>

                    <div className="input-row-risk-create">
                        <div className={`input-box-aim-risk-scope ${errors.aim ? "error-create" : ""}`}>
                            <button
                                className="top-left-button-refs"
                                title="Information"
                            >
                                <FontAwesomeIcon icon={faInfoCircle} onClick={openHelpScope} style={{ cursor: 'pointer' }} className="icon-um-search" />
                            </button>
                            <h3 className="font-fam-labels">Scope <span className="required-field">*</span></h3>
                            <div className="risk-scope-group" style={{ marginBottom: "-10px" }}>
                                <div className="risk-execSummary-popup-page-additional-row ">
                                    <div className="risk-popup-page-column-half-scope">
                                        <label className="scope-risk-label">Introduction</label>
                                        <textarea
                                            spellcheck="true"
                                            name="scope"
                                            className="aim-textarea-risk-scope-2 font-fam"
                                            onChange={handleInputChange}
                                            value={formData.scope}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="Enter a brief scope introduction (General scope notes and comments)." // Optional placeholder text
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="risk-scope-group">
                                <div className="risk-scope-popup-page-additional-row ">
                                    <div className="risk-popup-page-column-half-scope">
                                        <label className="scope-risk-label">Scope Inclusions</label>
                                        <textarea
                                            spellcheck="true"
                                            name="scopeInclusions"
                                            className="aim-textarea-risk-scope font-fam"
                                            value={formData.scopeInclusions}
                                            onChange={handleInputChange}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="Insert scope inclusions (List the specific items, activities, or areas covered in this risk assessment)."
                                        />
                                    </div>

                                    <div className="risk-popup-page-column-half-scope">
                                        <label className="scope-risk-label">Scope Exclusions</label>
                                        <textarea
                                            spellcheck="true"
                                            name="scopeExclusions"
                                            className="aim-textarea-risk-scope font-fam"
                                            value={formData.scopeExclusions}
                                            onChange={handleInputChange}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="Insert scope exclusions (List the specific items, activities, or areas not covered in this risk assessment)."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AbbreviationTableRisk risk={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} role={role} error={errors.abbrs} userID={userID} />
                    <TermTableRisk risk={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} role={role} error={errors.terms} userID={userID} />
                    <AttendanceTable rows={formData.attendance} addRow={addAttendanceRow} error={errors.attendance} removeRow={removeAttendanceRow} updateRows={updateAttendanceRows} role={role} userID={userID} generateAR={handleClick} />
                    {formData.documentType === "IBRA" && (<IBRATable rows={formData.ibra} updateRows={updateIbraRows} updateRow={updateIBRARows} addRow={addIBRARow} removeRow={removeIBRARow} generate={handleClick2} isSidebarVisible={isSidebarVisible} />)}
                    {(["IBRA"].includes(formData.documentType)) && (<ControlAnalysisTable rows={formData.cea} ibra={formData.ibra} updateRows={updateCEARows} addRow={addCEARow} updateRow={updateCeaRows} removeRow={removeCEARow} />)}

                    <ExecutiveSummary formData={formData} setFormData={setFormData} errors={errors} handleInputChange={handleInputChange} />

                    <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} />
                    <SupportingDocumentTable formData={formData} setFormData={setFormData} />

                    <div className="input-row-buttons-risk-create">
                        {/* Generate File Button */}
                        <button
                            className="generate-button font-fam"
                            disabled={useParams().type !== "IBRA"}
                            onClick={handleClick3}
                        >
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Generate Document'}
                        </button>
                        <button
                            className="pdf-button font-fam"
                            disabled
                        >
                            Generate PDF
                        </button>
                    </div>
                </div>
            </div>
            {helpRA && (<RiskAim setClose={closeHelpRA} />)}
            {helpScope && (<RiskScope setClose={closeHelpScope} />)}
            <ToastContainer />
        </div>
    );
};

export default RiskManagementPageBTA;