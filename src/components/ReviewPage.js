import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./ReviewPage.css";
import DocumentSignaturesTable from "./CreatePage/DocumentSignaturesTable";
import TermTable from "./CreatePage/TermTable";
import AbbreviationTable from "./CreatePage/AbbreviationTable";
import ChapterTable from "./CreatePage/ChapterTable";
import ProcedureTable from "./CreatePage/ProcedureTable";
import ReferenceTable from "./CreatePage/ReferenceTable";
import PPETable from "./CreatePage/PPETable";
import HandToolTable from "./CreatePage/HandToolsTable";
import EquipmentTable from "./CreatePage/EquipmentTable";
import MaterialsTable from "./CreatePage/MaterialsTable";
import MobileMachineTable from "./CreatePage/MobileMachineTable";
import PicturesTable from "./CreatePage/PicturesTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import LoadDraftPopup from "./CreatePage/LoadDraftPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faArrowLeft, faBell, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";

const ReviewPage = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpenMenu, setIsOpenMenu] = useState(false);
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
    const autoSaveInterval = useRef(null);
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [change, setChange] = useState("");
    const [azureFN, setAzureFN] = useState("");
    const fileID = useParams().fileId;

    useEffect(() => {
        if (fileID) {
            loadData(fileID);
        }
    }, []);

    const getNewAzureFileName = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api//fileGenDocs/getFile/${fileID}`);
            const storedData = await response.json();
            setAzureFN(storedData.files.azureFileName || "");
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    const updateRow = (index, field, value) => {
        const updatedProcedureRows = [...formData.procedureRows];
        updatedProcedureRows[index][field] = value;  // Update the specific field in the row

        setFormData({
            ...formData,
            procedureRows: updatedProcedureRows,  // Update the procedure rows in state
        });
    };

    useEffect(() => {
        const scrollableBox = document.querySelector(".scrollable-box");

        const handleScroll = () => {
            if (scrollableBox.scrollTop > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        if (scrollableBox) {
            scrollableBox.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (scrollableBox) {
                scrollableBox.removeEventListener("scroll", handleScroll);
            }
        };
    }, []);

    const openLoadPopup = () => setLoadPopupOpen(true);
    const closeLoadPopup = () => setLoadPopupOpen(false);

    const handleSave = () => {
        if (formData.title !== "") {
            if (loadedID === '') {
                saveData();

                toast.dismiss();
                toast.clearWaitingQueue();
                toast.success("Draft has been successfully saved", {
                    closeButton: false,
                    style: {
                        textAlign: 'center'
                    }
                })
            }
            else if (loadedID !== '') {
                updateData();

                toast.dismiss();
                toast.clearWaitingQueue();
                toast.success("Draft has been successfully updated", {
                    closeButton: false,
                    style: {
                        textAlign: 'center'
                    }
                })
            }
        }
        else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please fill in at least the title field before saving.", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
        }
    };

    const addPicRow = () => {
        setFormData({
            ...formData,
            pictures: [
                ...formData.pictures,
                {
                    pic1: '',
                    pic2: ''
                }
            ]
        });
    };

    const updatePicRow = (index, field, value) => {
        const updatedPicRows = [...formData.pictures];
        updatedPicRows[index][field] = value;  // Update the specific field in the row

        setFormData({
            ...formData,
            pictures: updatedPicRows,  // Update the procedure rows in state
        });
    };

    const removePicRow = (indexToRemove) => {
        setFormData({
            ...formData,
            pictures: formData.pictures.filter((_, index) => index !== indexToRemove),
        });
    };

    const saveData = async () => {
        const dataToStore = {
            usedAbbrCodes,       // your current state values
            usedTermCodes,
            usedPPEOptions,
            usedHandTools,
            usedEquipment,
            usedMobileMachine,
            usedMaterials,
            formData,
            userID
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/safe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToStore),
            });
            const result = await response.json();

            if (result.id) {  // Ensure we receive an ID from the backend
                setLoadedID(result.id);  // Update loadedID to track the saved document
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const updateData = async () => {
        const dataToStore = {
            usedAbbrCodes,       // your current state values
            usedTermCodes,
            usedPPEOptions,
            usedHandTools,
            usedEquipment,
            usedMobileMachine,
            usedMaterials,
            formData,
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/modifySafe/${loadedID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToStore),
            });
            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleClick = () => {
        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
        } else {
            handleGeneratePDF();  // Call your function when the form is valid
        }
    };

    const loadData = async (fileId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api//fileGenDocs/getFile/${fileId}`);
            const storedData = await response.json();
            // Update your states as needed:
            setUsedAbbrCodes(storedData.files.usedAbbrCodes || []);
            setUsedTermCodes(storedData.files.usedTermCodes || []);
            setUsedPPEOptions(storedData.files.usedPPEOptions || []);
            setUsedHandTools(storedData.files.usedHandTools || []);
            setUsedEquipment(storedData.files.usedEquipment || []);
            setUsedMobileMachines(storedData.files.usedMobileMachine || []);
            setUsedMaterials(storedData.files.usedMaterials || []);
            setFormData(storedData.files.formData || {});
            setFormData(prev => ({ ...prev }));
            setAzureFN(storedData.files.azureFileName || "");
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

    const [formData, setFormData] = useState({
        title: "",
        documentType: "Procedure",
        aim: "The aim of the document is ",
        scope: "",
        date: new Date().toLocaleDateString(),
        version: "1",
        rows: [
            { auth: "Author", name: "", pos: "", num: 1 },
            { auth: "Reviewer", name: "", pos: "", num: 2 },
            { auth: "Approver", name: "", pos: "", num: 3 },
        ],
        procedureRows: [],
        abbrRows: [],
        termRows: [],
        chapters: [],
        references: [],
        PPEItems: [],
        HandTools: [],
        Equipment: [],
        MobileMachine: [],
        Materials: [],
        pictures: [],
        reviewDate: 0,
        changeTable: [
            { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
        ],
    });


    const [history, setHistory] = useState([]);
    const timeoutRef = useRef(null);
    const previousFormData = useRef(formData);

    // Function to save to history with a limit
    const saveToHistory = useCallback(() => {
        const currentState = {
            formData,
            usedAbbrCodes,
            usedTermCodes,
            usedPPEOptions,
            usedHandTools,
            usedEquipment,
            usedMobileMachine,
            usedMaterials,
        };

        setHistory((prev) => {
            console.log(JSON.stringify(prev[prev.length - 1]) + "\n\n\n\n\n\n\n\n\n" + JSON.stringify(currentState))
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
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Undo successful!", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
        } else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("No changes to undo.", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title) newErrors.title = true;
        if (!formData.documentType) newErrors.documentType = true;
        if (!formData.aim) newErrors.aim = true;
        if (!formData.reviewDate) newErrors.reviewDate = true;
        if (formData.abbrRows.length === 0) newErrors.abbrs = true;
        if (formData.termRows.length === 0) newErrors.terms = true;

        if (formData.procedureRows.length === 0) {
            newErrors.procedureRows = true;
        } else {
            formData.procedureRows.forEach((row, index) => {
                if (!row.mainStep) newErrors.procedureRows = true;
                if (!row.SubStep) newErrors.procedureRows = true;
                if (!row.accountable) newErrors.procedureRows = true;
                if (!row.responsible) newErrors.procedureRows = true;
            });
        }

        if (formData.rows.length === 0) {
            newErrors.signs = true;
        } else {
            formData.rows.forEach((row, index) => {
                if (!row.name) newErrors.signs = true;
            });
        }

        if (change === "") {
            newErrors.change = true;
        }

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

    useEffect(() => {
        if (userID) {
            console.log("User ID is set:", userID);
            // Perform actions that depend on userID here
        }
    }, [userID]);

    // Handle input changes for the table rows
    const handleRowChange = (e, index, field) => {
        const newRows = [...formData.rows];
        const rowToChange = newRows[index];

        // Save the previous value of 'auth' before change for validation
        const previousAuth = rowToChange.auth;

        // Update the field value
        rowToChange[field] = e.target.value;

        // Automatically set num based on the auth type
        if (rowToChange.auth === "Author") {
            rowToChange.num = 1;
        } else if (rowToChange.auth === "Reviewer") {
            rowToChange.num = 2;
        } else if (rowToChange.auth === "Approver") {
            rowToChange.num = 3;
        }

        // Only perform validation if the 'auth' field was modified
        if (field === "auth") {
            // Check if the current 'Author', 'Reviewer', or 'Approved By' is being removed or modified
            const requiredRoles = ["Author", "Reviewer", "Approver"];

            // Check if there is at least one row with each required auth type
            const isValid = requiredRoles.every(role => {
                return formData.rows.filter((row) => row.auth === role).length > 0 || rowToChange.auth === role;
            });

            if (!isValid) {
                toast.error(`You must have at least one ${requiredRoles.find(role => formData.rows.filter((row) => row.auth === role).length === 0)}.`, {
                    closeButton: false,
                    style: {
                        textAlign: 'center'
                    }
                })

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
                { auth: "Author", name: "", pos: "", num: 1 }
            ]
        });
    };

    const addProRow = () => {
        const lastNr = formData.procedureRows.length > 0 && typeof formData.procedureRows[formData.procedureRows.length - 1].nr === 'number'
            ? formData.procedureRows[formData.procedureRows.length - 1].nr
            : 0; // Safely get the last nr value or 0 if no rows exist or nr is not a number

        setFormData({
            ...formData,
            procedureRows: [
                ...formData.procedureRows,
                {
                    nr: lastNr + 1,
                    mainStep: "",
                    SubStep: "",
                    discipline: "Engineering",       // Default value for discipline
                    accountable: "",      // Default value for accountable
                    responsible: ""
                }
            ]
        });
    };

    const removeProRow = (indexToRemove) => {
        setFormData({
            ...formData,
            procedureRows: formData.procedureRows.filter((_, index) => index !== indexToRemove),
        });
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
        const initialRequiredRows = ["Author", "Reviewer", "Approver"];
        if (
            initialRequiredRows.includes(rowToRemove.auth) &&
            formData.rows.filter((row) => row.auth === rowToRemove.auth).length === 1
        ) {
            toast.error(`You must keep at least one ${rowToRemove.auth}.`, {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
            return;
        }

        // Proceed with removal if conditions are met
        setFormData({
            ...formData,
            rows: formData.rows.filter((_, index) => index !== indexToRemove),
        });
    };

    // Send data to backend to generate a Word document
    const handleGeneratePDF = async () => {
        const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType;

        const updatedChangeTable = [...formData.changeTable];

        const newChange = {
            changeVersion: parseInt(formData.changeTable[formData.changeTable.length - 1].changeVersion) + 1,
            change: change,
            changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };

        updatedChangeTable.push(newChange);

        setFormData((prevFormData) => {
            const updatedFormData = {
                ...prevFormData,
                changeTable: updatedChangeTable,
                version: parseInt(prevFormData.version) + 1
            };

            const dataToStore = {
                usedAbbrCodes,
                usedTermCodes,
                usedPPEOptions,
                usedHandTools,
                usedEquipment,
                usedMobileMachine,
                usedMaterials,
                formData: updatedFormData, // Use the updated formData here
                userID,
                azureFN
            };

            sendUpdatedFormData(dataToStore, documentName);

            return updatedFormData; // Ensure state is updated correctly
        });
    };

    const sendUpdatedFormData = async (dataToStore, documentName) => {
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/publish-document`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore), // Now sending the correct dataToStore
            });
            if (response.status === 404) throw new Error("Failed to generate document")
            {
                toast.success("File has been reviewed.", {
                    closeButton: false,
                    style: {
                        textAlign: 'center'
                    }
                })
            }
            if (!response.ok) throw new Error("Failed to generate document");

            setLoading(false);
            getNewAzureFileName();

            toast.success("File has been reviewed.", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleGenerateTex = async () => {
        const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType;
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/doc/generate-latex`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `output.pdf`);
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const updateProcedureRows = (newProcedureRows) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            procedureRows: newProcedureRows, // Update procedureRows with new data
        }));
    };

    const handleGeneratePPTX = async () => {
        const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType;
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/ppt/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `output.png`);
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    return (
        <div className="file-create-container">
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} />
                    <p className="logo-text-um">Review Document</p>
                </div>
            </div>

            {/* Main content */}
            <div className="main-box-create">
                <div className="top-section-create-page">
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container-create-page">
                        <div className="burger-menu-icon-create-page-2">
                            <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} />
                        </div>
                        <div className="burger-menu-icon-create-page-2">
                            <FontAwesomeIcon icon={faBell} />
                        </div>
                        <div className="burger-menu-icon-create-page-3" onClick={() => setIsOpenMenu(!isOpenMenu)}>
                            <FontAwesomeIcon icon={faCircleUser} />
                        </div>
                    </div>
                    {isOpenMenu && (<BurgerMenuFI role={role} isOpen={isOpenMenu} setIsOpen={setIsOpenMenu} />)}
                </div>

                <div className={`scrollable-box`}>
                    <div className="input-row">
                        <div className={`review-page-input-box-title ${errors.title ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Document Title <span className="required-field">*</span></h3>
                            <div className="input-group-review-page">
                                <input
                                    name="title"
                                    className="font-fam title-input-review-page"
                                    value={formData.title + " " + formData.documentType}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    <DocumentSignaturesTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} />

                    <div className="input-row">
                        <div className={`input-box-aim-cp ${errors.aim ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Aim <span className="required-field">*</span></h3>
                            <textarea
                                spellcheck="true"
                                name="aim"
                                className="aim-textarea font-fam"
                                value={formData.aim}
                                onChange={handleInputChange}
                                rows="5"   // Adjust the number of rows for initial height
                                placeholder="Enter the aim of the document here..." // Optional placeholder text
                            />
                        </div>
                    </div>

                    <PPETable formData={formData} setFormData={setFormData} usedPPEOptions={usedPPEOptions} setUsedPPEOptions={setUsedPPEOptions} role={role} userID={userID} />
                    <HandToolTable formData={formData} setFormData={setFormData} usedHandTools={usedHandTools} setUsedHandTools={setUsedHandTools} role={role} userID={userID} />
                    <EquipmentTable formData={formData} setFormData={setFormData} usedEquipment={usedEquipment} setUsedEquipment={setUsedEquipment} role={role} userID={userID} />
                    <MobileMachineTable formData={formData} setFormData={setFormData} usedMobileMachine={usedMobileMachine} setUsedMobileMachine={setUsedMobileMachines} role={role} userID={userID} />
                    <MaterialsTable formData={formData} setFormData={setFormData} usedMaterials={usedMaterials} setUsedMaterials={setUsedMaterials} role={role} userID={userID} />
                    <AbbreviationTable formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} role={role} error={errors.abbrs} userID={userID} />
                    <TermTable formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} role={role} error={errors.terms} userID={userID} />
                    <ProcedureTable procedureRows={formData.procedureRows} addRow={addProRow} removeRow={removeProRow} updateRow={updateRow} error={errors.procedureRows} title={formData.title} documentType={formData.documentType} updateProcRows={updateProcedureRows} />
                    <ChapterTable formData={formData} setFormData={setFormData} />
                    <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} />

                    <div className="input-row">
                        <div className={`input-box-aim-cp ${errors.change ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Document Change Reason <span className="required-field">*</span></h3>
                            <textarea
                                spellcheck="true"
                                name="aim"
                                className="aim-textarea font-fam"
                                value={change}
                                onChange={(e) => setChange(e.target.value)}
                                rows="4"   // Adjust the number of rows for initial height
                                placeholder="Enter the reason for the document update..." // Optional placeholder text
                            />
                        </div>
                    </div>

                    <div className={`input-row`}>
                        <div className={`input-box-3-review ${errors.reviewDate ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Review Period (Months) <span className="required-field">*</span></h3>
                            <input
                                type="number"
                                name="reviewDate"
                                className="aim-textarea cent-create font-fam"
                                value={formData.reviewDate}
                                onChange={handleInputChange}
                                placeholder="Enter the review period in months" // Optional placeholder text
                            />
                        </div>
                    </div>

                    <div className="input-row">
                        <div className={`input-box-annexures`}>
                            <h3 className="font-fam-labels">Appendices</h3>
                        </div>
                    </div>

                    <PicturesTable picturesRows={formData.pictures} addPicRow={addPicRow} updatePicRow={updatePicRow} removePicRow={removePicRow} />

                    <div className="input-row-buttons">
                        {/* Generate File Button */}
                        <button
                            className="generate-button font-fam"
                            onClick={handleClick}
                            title={validateForm() ? "" : "Fill in all fields marked by a * before generating the file"}
                        >
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Review Document'}
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
            <ToastContainer />
        </div>
    );
};

export default ReviewPage;