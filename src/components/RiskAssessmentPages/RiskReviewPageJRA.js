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
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faQuestionCircle, faShareNodes, faUpload, faRotateRight, faChevronLeft, faChevronRight, faInfoCircle, faTeeth, faTriangleCircleSquare, faTriangleExclamation, faUserTie, faHardHat, faMagicWandSparkles, faCircle, faPen, faSave, faArrowLeft, faArrowUp, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import TopBarDD from "../Notifications/TopBarDD";
import AttendanceTable from "../RiskRelated/AttendanceTable";
import DocumentSignaturesRiskTable from "../RiskRelated/DocumentSignaturesRiskTable";
import PPETableRisk from "../RiskRelated/RiskComponents/PPETableRisk";
import EquipmentTableRisk from "../RiskRelated/RiskComponents/EquipmentTableRisk";
import HandToolsTableRisk from "../RiskRelated/RiskComponents/HandToolsTableRisk";
import MaterialsTableRisk from "../RiskRelated/RiskComponents/MaterialsTableRisk";
import MobileMachineTableRisk from "../RiskRelated/RiskComponents/MobileMachineTableRisk";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import JRATable from "../RiskRelated/JRATable";
import LoadRiskDraftPopup from "../RiskRelated/LoadRiskDraftPopup";
import SharePageRisk from "../RiskRelated/SharePageRisk";
import RiskAim from "../RiskRelated/RiskInfo/RiskAim";
import RiskScope from "../RiskRelated/RiskInfo/RiskScope";
import IntroTaskInfo from "../RiskRelated/IntroTaskInfo";
import PicturesTable from "../CreatePage/PicturesTable";
import OtherTeam from "../RiskRelated/OtherTeam";
import SavePopup from "../Popups/SavePopup";
import SaveAsPopup from "../Popups/SaveAsPopup";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";

const RiskReviewPageJRA = () => {
    const navigate = useNavigate();
    const riskType = useParams().type;
    const [share, setShare] = useState(false);
    const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
    const [usedTermCodes, setUsedTermCodes] = useState([]);
    const [usedPPEOptions, setUsedPPEOptions] = useState([]);
    const [role, setRole] = useState("");
    const [usedHandTools, setUsedHandTools] = useState([]);
    const [usedEquipment, setUsedEquipment] = useState([]);
    const [usedMobileMachine, setUsedMobileMachines] = useState([]);
    const [usedMaterials, setUsedMaterials] = useState([]);
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
    const [companies, setCompanies] = useState([]);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [generatePopup, setGeneratePopup] = useState(false);
    const [azureFN, setAzureFN] = useState("");
    const fileID = useParams().fileId;
    const [change, setChange] = useState("");

    const closeHelpRA = () => {
        setHelpRA(false);
    };

    const closeHelpScope = () => {
        setHelpScope(false);
    };

    const handleSave = (fileID) => {
        if (formData.title !== "") {
            saveData(fileID);

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
            usedPPEOptions: usedPPEOptionsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedMaterials: usedMaterialsRef.current,
            usedMobileMachine: usedMobileMachineRef.current,
            formData: formDataRef.current
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/jra/save/${fileID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(dataToStore),
            });
            const result = await response.json();
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
            handleGenerateARegister();  // Call your function when the form is valid
        }
    };

    const handleClick3 = async () => {
        try {
            await handleGeneratePublish();
        } catch (err) {
            toast.error("Could not save draft, generation aborted." + err);
        }
    };

    useEffect(() => {
        if (fileID) {
            loadData(fileID);
        }
    }, [fileID]);

    const getNewAzureFileName = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/jra/getFile/${fileID}`);
            const storedData = await response.json();
            setAzureFN(storedData.files.azureFileName || "");
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const loadData = async (fileID) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/jra/getFile/${fileID}`);
            const data = await response.json();
            const storedData = data.files;
            setUsedAbbrCodes(storedData.usedAbbrCodes || []);
            setUsedTermCodes(storedData.usedTermCodes || []);
            setUsedPPEOptions(storedData.usedPPEOptions || []);
            setUsedHandTools(storedData.usedHandTools || []);
            setUsedEquipment(storedData.usedEquipment || []);
            setUsedMobileMachines(storedData.usedMobileMachine || []);
            setUsedMaterials(storedData.usedMaterials || []);
            setFormData(storedData.formData || {});
            setFormData(prev => ({ ...prev }));
            setTitleSet(true);
            setAzureFN(storedData.azureFileName || "");
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const updateRefRow = (index, field, value) => {
        const updatedRefRows = [...formData.references];
        updatedRefRows[index][field] = value;  // Update the specific field in the row

        setFormData({
            ...formData,
            references: updatedRefRows,  // Update the procedure rows in state
        });
    };

    const [formData, setFormData] = useState({
        title: "",
        documentType: useParams().type,
        introInfo: {
            description: "", start: "", end: "", mainArea: "", subArea: "", owner: "", inCharge: "", members: [{ id: uuidv4(), member: "" }],
            otherAffected: "", howAffected: "", isProcedure: "", procedures: { id: uuidv4(), procedure: "", ref: "", version: "", issueDate: "" }
        },
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
        jra: [
            {
                id: uuidv4(),
                nr: 1,
                main: "",
                jraBody: [
                    {
                        idBody: uuidv4(),
                        hazards: [{ hazard: "Work Execution" }],            // now an array, one hazard per sub-step
                        UE: [{ ue: "Non-adherence to task step requirements / specifications" }],                 // array of unwanted-events
                        sub: [{ task: "" }],    // array of sub-step objects
                        taskExecution: [{          // keep as object, A and R dropdowns
                            R: ""
                        }],
                        controls: [{ control: "" }],
                        go_noGo: [{ go: "" }]
                    }     // single textarea for notes
                ]
            }
        ],
        abbrRows: [],
        termRows: [],
        attendance: [
            {
                name: "", site: "", designation: "Facilitator", num: "", presence: "Absent"
            }
        ],
        PPEItems: [],
        HandTools: [],
        Equipment: [],
        MobileMachine: [],
        Materials: [],
        supportingDocuments: [],
        references: [],
        changeTable: [
            { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
        ],
    });


    const fetchSites = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/sites`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();
            setCompanies(data.sites.map(s => s.site));
        } catch (error) {
            console.error("Error fetching designations:", error);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const closeAllDropdowns = () => {
        setShowSiteDropdown(null);
    };

    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [filteredSites, setFilteredSites] = useState([]);
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const sitesInputRef = useRef(null);

    const handleSiteInput = (value) => {
        closeAllDropdowns();
        setFormData(prev => ({
            ...prev,
            site: value
        }));

        const matches = companies
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredSites(matches);
        setShowSiteDropdown(true);

        const el = sitesInputRef.current;
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
    const handleSiteFocus = () => {
        closeAllDropdowns();

        const matches = companies;
        setFilteredSites(matches);
        setShowSiteDropdown(true);

        const el = sitesInputRef.current;
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
    const selectSiteSuggestion = (value) => {
        setFormData(prev => ({
            ...prev,
            site: value
        }));
        setShowSiteDropdown(false);
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
            setShowSiteDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showSiteDropdown]);

    const formDataRef = useRef(formData);
    const usedAbbrCodesRef = useRef(usedAbbrCodes);
    const usedTermCodesRef = useRef(usedTermCodes);
    const usedPPEOptionsRef = useRef(usedPPEOptions);
    const usedHandToolsRef = useRef(usedHandTools);
    const usedEquipmentRef = useRef(usedEquipment);
    const usedMobileMachineRef = useRef(usedMobileMachine);
    const usedMaterialsRef = useRef(usedMaterials);

    useEffect(() => {
        usedAbbrCodesRef.current = usedAbbrCodes;
    }, [usedAbbrCodes]);

    useEffect(() => {
        usedTermCodesRef.current = usedTermCodes;
    }, [usedTermCodes]);

    useEffect(() => {
        usedPPEOptionsRef.current = usedPPEOptions;
    }, [usedPPEOptions]);

    useEffect(() => {
        usedHandToolsRef.current = usedHandTools;
    }, [usedHandTools]);

    useEffect(() => {
        usedMobileMachineRef.current = usedMobileMachine;
    }, [usedMobileMachine]);

    useEffect(() => {
        usedMaterialsRef.current = usedMaterials;
    }, [usedMaterials]);

    useEffect(() => {
        usedEquipmentRef.current = usedEquipment;
    }, [usedEquipment]);

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
        saveData(fileID);
    };

    const [history, setHistory] = useState([]);
    const timeoutRef = useRef(null);
    const previousFormData = useRef(formData);
    const [redoHistory, setRedoHistory] = useState([]);

    // Function to save to history with a limit
    const saveToHistory = useCallback(() => {
        const currentState = {
            formData: JSON.parse(JSON.stringify(formData)),
            usedAbbrCodes,
            usedTermCodes,
            usedPPEOptions,
            usedHandTools,
            usedEquipment,
            usedMobileMachine,
            usedMaterials,
        };

        setHistory((prev) => {
            if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(currentState)) {
                return prev; // Prevent duplicate saves
            }
            return [...prev, currentState]; // Save the new state
        });
    }, [formData, usedAbbrCodes, usedTermCodes, usedPPEOptions, usedHandTools, usedEquipment, usedMobileMachine, usedMaterials]);

    // Detects form changes across all components with debounce
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(saveToHistory, 1000); // Only save after 1s of inactivity
    }, [formData, usedAbbrCodes, usedTermCodes, usedPPEOptions, usedHandTools, usedEquipment, usedMobileMachine, usedMaterials]);

    const undoLastChange = () => {
        if (history.length > 1) {
            const lastState = history[history.length - 2]; // Get the last valid state
            const currentState = history[history.length - 1];

            // Restore the previous state
            setFormData(lastState.formData);
            setUsedAbbrCodes(lastState.usedAbbrCodes);
            setUsedTermCodes(lastState.usedTermCodes);
            setUsedPPEOptions(lastState.usedPPEOptions);
            setUsedHandTools(lastState.usedHandTools);
            setUsedEquipment(lastState.usedEquipment);
            setUsedMobileMachines(lastState.usedMobileMachine);
            setUsedMaterials(lastState.usedMaterials);

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
            setUsedPPEOptions(nextState.usedPPEOptions);
            setUsedHandTools(nextState.usedHandTools);
            setUsedEquipment(nextState.usedEquipment);
            setUsedMobileMachines(nextState.usedMobileMachine);
            setUsedMaterials(nextState.usedMaterials);

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
        if (!formData.site) newErrors.site = true;
        if (!formData.dateConducted) newErrors.dateConducted = true;

        return newErrors;
    };

    // Authentication check
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/403");
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

    const updateRefRows = (newRef) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            references: newRef, // Update procedureRows with new data
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

    const handleGeneratePublish = async () => {
        const documentName = `${formData.title} ${formData.documentType}`;

        // 1) Build the updated changeTable and version from the latest state
        const lastCT = formData.changeTable;
        const lastVersion = parseInt(formData.version, 10);
        const lastChangeVer = parseInt(lastCT[lastCT.length - 1].changeVersion, 10);

        const newChange = {
            changeVersion: (lastChangeVer + 1).toString(),
            change,
            changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };

        const updatedFormData = {
            ...formData,
            version: (lastVersion + 1).toString(),
            changeTable: [...lastCT, newChange]
        };

        setFormData(updatedFormData);

        await sendUpdatedFormData(updatedFormData, documentName);
    };

    const sendUpdatedFormData = async (formDataToStore, documentName) => {
        setLoading(true);

        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
            usedTermCodes: usedTermCodesRef.current,
            usedPPEOptions: usedPPEOptionsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedMaterials: usedMaterialsRef.current,
            usedMobileMachine: usedMobileMachineRef.current,
            formData: formDataToStore,
            userID,
            azureFN: azureFN,
            draftID: ""
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/t/publish-jra-sheet1`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });
            if (response.status === 404) throw new Error("Failed to generate document")

            if (!response.ok) throw new Error("Failed to generate document");

            setLoading(false);
            getNewAzureFileName();

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

    const handleGenerateARegister = async () => {
        const dataToStore = {
            attendance: formData.attendance
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

        const documentName = (formData.title) + ' ' + formData.documentType + " Attendance Register";
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-attend-xlsx`, {
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

    return (
        <div className="risk-create-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/jra2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{riskType.toUpperCase()}</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-risk-create">
                <div className="top-section-risk-create-page">
                    <div className="icons-container-risk-create-page">
                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
                        </div>

                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faFloppyDisk} title="Save" onClick={handleSave} />
                        </div>

                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faRotateLeft} onClick={undoLastChange} title="Undo" />
                        </div>

                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faRotateRight} onClick={redoChange} title="Redo" />
                        </div>
                    </div>

                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBarDD role={role} menu={"1"} create={true} risk={true} />
                </div>

                <div className={`scrollable-box-risk-create`}>
                    <div className="input-row-risk-create" onClick={() => console.log(formData)}>
                        <div className={`input-box-title-risk-create ${errors.title ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Risk Assessment Title <span className="required-field">*</span></h3>
                            <div className="input-group-risk-create">
                                <input
                                    spellCheck="true"
                                    type="text"
                                    name="title"
                                    className="font-fam title-input"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Insert the Risk Assessment Title (E.g. Perform Earth Leakage Test on Electrical Circuits)"
                                />
                                <span className="type-risk-create-JRA">{formData.documentType + " and PTO"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="input-row-risk-create">
                        <div className="input-box-type-risk-create">
                            <h3 className="font-fam-labels">Operation / Site <span className="required-field">*</span></h3>
                            <div className="jra-info-popup-page-select-container">
                                <input
                                    type="text"
                                    value={formData.site}
                                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                    ref={sitesInputRef}
                                    placeholder="Select Site"
                                    onChange={e => handleSiteInput(e.target.value)}
                                    onFocus={handleSiteFocus}
                                />
                            </div>
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
                    <AbbreviationTableRisk risk={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} role={role} error={errors.abbrs} userID={userID} />
                    <TermTableRisk risk={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} role={role} error={errors.terms} userID={userID} />
                    <IntroTaskInfo formData={formData} setFormData={setFormData} />
                    <PPETableRisk formData={formData} setFormData={setFormData} usedPPEOptions={usedPPEOptions} setUsedPPEOptions={setUsedPPEOptions} role={role} userID={userID} />
                    <HandToolsTableRisk formData={formData} setFormData={setFormData} usedHandTools={usedHandTools} setUsedHandTools={setUsedHandTools} role={role} userID={userID} />
                    <MaterialsTableRisk formData={formData} setFormData={setFormData} usedMaterials={usedMaterials} setUsedMaterials={setUsedMaterials} role={role} userID={userID} />
                    <EquipmentTableRisk formData={formData} setFormData={setFormData} usedEquipment={usedEquipment} setUsedEquipment={setUsedEquipment} role={role} userID={userID} />
                    <MobileMachineTableRisk formData={formData} setFormData={setFormData} usedMobileMachine={usedMobileMachine} setUsedMobileMachine={setUsedMobileMachines} role={role} userID={userID} />
                    <AttendanceTable rows={formData.attendance} addRow={addAttendanceRow} error={errors.attendance} removeRow={removeAttendanceRow} updateRows={updateAttendanceRows} role={role} userID={userID} generateAR={handleClick} />
                    <JRATable formData={formData} setFormData={setFormData} isSidebarVisible={isSidebarVisible} />
                    <OtherTeam formData={formData} />
                    <SupportingDocumentTable formData={formData} setFormData={setFormData} />
                    <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} />
                    <div className="input-row">
                        <div className={`input-box-aim-cp`}>
                            <h3 className="font-fam-labels">Document Change Reason <span className="required-field">*</span></h3>
                            <textarea
                                spellcheck="true"
                                name="aim"
                                className="aim-textarea font-fam"
                                value={change}
                                onChange={(e) => setChange(e.target.value)}
                                rows="4"   // Adjust the number of rows for initial height
                                placeholder="Insert the reason for the document update..." // Optional placeholder text
                            />
                        </div>
                    </div>
                    <div className="input-row-buttons-risk-create">
                        {/* Generate File Button */}
                        <button
                            className="generate-button font-fam"
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

            {showSiteDropdown && filteredSites.length > 0 && (
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
                    {filteredSites.sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectSiteSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RiskReviewPageJRA;