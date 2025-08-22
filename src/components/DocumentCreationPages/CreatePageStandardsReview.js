import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./CreatePage.css";
import DocumentSignaturesTable from "../CreatePage/DocumentSignaturesTable";
import TermTable from "../CreatePage/TermTable";
import AbbreviationTable from "../CreatePage/AbbreviationTable";
import ReferenceTable from "../CreatePage/ReferenceTable";
import PicturesTable from "../CreatePage/PicturesTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import LoadDraftPopup from "../CreatePage/LoadDraftPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faChevronLeft, faChevronRight, faFileCirclePlus, faArrowLeft, faSort, faCircleUser, faBell, faShareNodes, faUpload, faRotateRight, faCircleExclamation, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import BurgerMenu from "../CreatePage/BurgerMenu";
import SharePage from "../CreatePage/SharePage";
import TopBarDD from "../Notifications/TopBarDD";
import ChapterTable from "../CreatePage/ChapterTable";
import StandardsTable from "../CreatePage/StandardsTable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";

const CreatePageStandardsReview = () => {
  const navigate = useNavigate();
  const type = useParams().type;
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const loadedIDRef = useRef('');
  const [change, setChange] = useState("");
  const [azureFN, setAzureFN] = useState("");
  const fileID = useParams().fileId;
  const [offlineDraft, setOfflineDraft] = useState(false);
  const [generatePopup, setGeneratePopup] = useState(false);
  const [loadingAim, setLoadingAim] = useState(false);
  const [loadingScope, setLoadingScope] = useState(false);
  const [draftNote, setDraftNote] = useState(null);

  const openDraftNote = () => {
    setDraftNote(true);
  }

  const closeDraftNote = () => {
    setDraftNote(false);
  }

  const openSaveAs = () => {
    if (!titleSet) {
      toast.warn("Please fill in at least the title field before saving.", {
        closeButton: false,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });
      return;
    }
    setIsSaveAsModalOpen(true);
  };

  const closeSaveAs = () => {
    setIsSaveAsModalOpen(false);
  };

  const confirmSaveAs = (newTitle) => {
    // apply the new title, clear loadedID, then save
    const me = userIDRef.current;
    const newFormData = {
      ...formDataRef.current,        // your current formData
      title: newTitle,             // override title
    };

    setFormData(newFormData);
    formDataRef.current = newFormData;

    setUserIDs([me]);
    userIDsRef.current = [me];

    loadedIDRef.current = '';
    setLoadedID('');

    saveAsData();

    toast.dismiss();
    toast.clearWaitingQueue();
    toast.success("New Draft Successfully Saved", {
      closeButton: false,
      autoClose: 1500, // 1.5 seconds
      style: {
        textAlign: 'center'
      }
    });

    setIsSaveAsModalOpen(false);
  };

  const [rewriteHistory, setRewriteHistory] = useState({
    aim: [],
    scope: []
  });

  const pushAiRewriteHistory = (field) => {
    setRewriteHistory(prev => ({
      ...prev,
      [field]: [...prev[field], formData[field]]
    }));
  };

  const undoAiRewrite = (field) => {
    setRewriteHistory(prev => {
      const hist = [...prev[field]];
      if (hist.length === 0) return prev;         // nothing to undo
      const lastValue = hist.pop();
      setFormData(fd => ({ ...fd, [field]: lastValue }));
      return { ...prev, [field]: hist };
    });
  };

  const AiRewriteAim = async () => {
    try {
      const prompt = formData.aim;

      pushAiRewriteHistory('aim');
      setLoadingAim(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatAim/standard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt }),
      });

      const { response: newText } = await response.json();
      setLoadingAim(false);
      setFormData(fd => ({ ...fd, aim: newText }));
    } catch (error) {
      setLoadingAim(false);
      console.error('Error saving data:', error);
    }
  }

  const AiRewriteScope = async () => {
    try {
      const prompt = formData.scope;

      pushAiRewriteHistory('scope');
      setLoadingScope(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatScope/standard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt }),
      });

      const { response: newText } = await response.json();
      setLoadingScope(false);
      setFormData(fd => ({ ...fd, scope: newText }));
    } catch (error) {
      setLoadingScope(false);
      console.error('Error saving data:', error);
    }
  }

  const handleSave = () => {
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
        style: {
          textAlign: 'center'
        }
      })
    }
  };

  const saveAsData = async () => {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standards/safe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dataToStore),
      });
      const result = await response.json();

      if (result.id) {  // Ensure we receive an ID from the backend
        setLoadedID(result.id);  // Update loadedID to track the saved document
        loadedIDRef.current = result.id;
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const saveData = async (fileID) => {
    const dataToStore = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: formDataRef.current
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/standard/save/${fileID}`, {
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

  useEffect(() => {
    if (fileID) {
      loadData(fileID);
    }
  }, []);

  const getNewAzureFileName = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/standard/getFile/${fileID}`);
      const storedData = await response.json();
      setAzureFN(storedData.files.azureFileName || "");
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadData = async (fileID) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/standard/getFile/${fileID}`);
      const data = await response.json();
      const storedData = data.files;
      // Update your states as needed:
      setUsedAbbrCodes(storedData.usedAbbrCodes || []);
      setUsedTermCodes(storedData.usedTermCodes || []);
      setUserIDs(storedData.userIDs || []);
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

  const updateRefRows = (newRef) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      references: newRef, // Update procedureRows with new data
    }));
  };

  const [formData, setFormData] = useState({
    title: "",
    documentType: useParams().type,
    aim: "The aim of the document is ",
    scope: "",
    date: new Date().toLocaleDateString(),
    version: "1",
    rows: [
      { auth: "Author", name: "", pos: "", num: 1 },
      { auth: "Reviewer", name: "", pos: "", num: 2 },
      { auth: "Approver", name: "", pos: "", num: 3 },
    ],
    standard: [{
      id: uuidv4(), nr: 1, mainSection: "", details: [{ id: uuidv4(), nr: "1.1", minRequirement: "", reference: "", notes: "" }]
    }],
    abbrRows: [],
    termRows: [],
    chapters: [],
    references: [],
    supportingDocuments: [],
    pictures: [],
    reviewDate: 0,
    changeTable: [
      { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
    ],
  });

  useEffect(() => {
    const hasActiveError = Object.values(errors).some(val => val === true);

    if (hasActiveError) {
      const newErrors = validateFormRevised();
      setErrors(newErrors);
    }
  }, [formData]);

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
    saveData(fileID);
    toast.dismiss();
    toast.clearWaitingQueue();
    toast.success("Draft has been auto-saved", {
      closeButton: true,
      style: {
        textAlign: 'center'
      }
    });
  };

  const addPicRow = () => {
    setFormData((prevData) => {
      const totalFigures = prevData.pictures.length * 2 + 1; // Count total fields

      return {
        ...prevData,
        pictures: [
          ...prevData.pictures,
          {
            pic1: `Figure 1.${totalFigures}: `, // Assign next available number
            pic2: `Figure 1.${totalFigures + 1}: `
          }
        ]
      };
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
    if (!formData.scope) newErrors.scope = true;
    if (!formData.reviewDate) newErrors.reviewDate = true;
    if (formData.abbrRows.length === 0) newErrors.abbrs = true;
    if (formData.termRows.length === 0) newErrors.terms = true;

    if (formData.standard.length === 0) {
      newErrors.standard = true;
    } else {
      formData.standard.forEach((row, index) => {
        if (!row.mainSection) newErrors.standard = true;
      });
    }

    if (formData.rows.length === 0) {
      newErrors.signs = true;
    } else {
      formData.rows.forEach((row, index) => {
        if (!row.name) newErrors.signs = true;
      });
    }

    if (formData.references.length === 0) {
      newErrors.reference = true;
    } else {
      formData.references.forEach((row, index) => {
        if (!row.ref) newErrors.reference = true;
        if (!row.refDesc) newErrors.reference = true;
      });
    }

    return newErrors;
  };

  const validateFormRevised = () => {
    const newErrors = errors;
    if (!formData.reviewDate) { newErrors.reviewDate = true } else {
      newErrors.reviewDate = false;
    };
    return newErrors;
  };

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    console.log(formData)

    if (e.target.name === "title" && e.target.value.trim() !== "") {
      setTitleSet(true); // Enable auto-save only after title is entered
    }
  };

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
        { auth: "Author", name: "", pos: "", num: 1 }
      ]
    });
  };

  const updateSignatureRows = (newSignatureRows) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      rows: newSignatureRows, // Update procedureRows with new data
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
    const initialRequiredRows = ["Author", "Reviewer", "Approver"];
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

  // Send data to backend to generate a Word document
  const handleGeneratePDF = async () => {
    const documentName = (formData.title) + ' ' + formData.documentType;

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
        formData: updatedFormData,
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/publish-standard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore), // Now sending the correct dataToStore
      });
      if (response.status === 404) throw new Error("Failed to generate document")

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


  const handleGenerateDocument = async () => {
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

    await handleGenerateStandardDocument(updatedFormData);
  };

  const handleGenerateStandardDocument = async (generateData) => {
    const dataToStore = {
      formData: generateData,
    };

    const documentName = (formData.title) + ' ' + formData.documentType;
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-standard`, {
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
      openDraftNote();
    } catch (error) {
      console.error("Error generating document:", error);
      setLoading(false);
    }
  };

  return (
    <div className="file-create-container">
      {isSidebarVisible && (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
            <p className="logo-text-um">Document Development</p>
          </div>

          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/standardsDMSInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{"Standard"}</p>
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

      <div className="main-box-create">
        <div className="top-section-create-page">
          <div className="icons-container-create-page">
            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
            </div>

            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faFloppyDisk} title="Save" onClick={handleSave} />
            </div>

            <div className="burger-menu-icon-risk-create-page-1">
              <span className="fa-layers fa-fw" style={{ fontSize: "24px" }} onClick={openSaveAs} title="Save As">
                {/* base floppy-disk, full size */}
                <FontAwesomeIcon icon={faSave} />
                {/* pen, shrunk & nudged down/right into corner */}
                <FontAwesomeIcon
                  icon={faPen}
                  transform="shrink-6 down-5 right-7"
                  color="gray"   /* or whatever contrast you need */
                />
              </span>
            </div>

            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faRotateLeft} onClick={undoLastChange} title="Undo" />
            </div>

            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faRotateRight} onClick={redoChange} title="Redo" />
            </div>

            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faUpload} className={`${!loadedID ? "disabled-share" : ""}`} title="Publish" onClick={handleClick} />
            </div>
          </div>

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          {/* Container for right-aligned icons */}
          <TopBarDD role={role} menu={"1"} create={true} />
        </div>

        <div className={`scrollable-box`}>
          <div className="input-row">
            <div className={`input-box-title ${errors.title ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Document Title <span className="required-field">*</span></h3>
              <div className="input-group-cpt">
                <input
                  spellcheck="true"
                  type="text"
                  name="title"
                  className="font-fam title-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Title of your document (e.g. Working at Heights)"
                />
                <span className="type-create-page">{formData.documentType}</span>
              </div>
            </div>
          </div>

          <DocumentSignaturesTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} setErrors={setErrors} />

          <div className="input-row">
            <div className={`input-box-aim-cp ${errors.aim ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Aim <span className="required-field">*</span></h3>
              <textarea
                spellcheck="true"
                name="aim"
                className="aim-textarea font-fam expanding-textarea"
                value={formData.aim}
                onChange={handleInputChange}
                rows="5"   // Adjust the number of rows for initial height
                placeholder="Insert the aim of the document here..." // Optional placeholder text
              />
              {loadingAim ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-ibra spin-animation" />) : (
                <FontAwesomeIcon
                  icon={faMagicWandSparkles}
                  className="aim-textarea-icon-ibra"
                  title="AI Rewrite"
                  style={{ fontSize: "15px" }}
                  onClick={() => AiRewriteAim()}
                />
              )}

              <FontAwesomeIcon
                icon={faRotateLeft}
                className="aim-textarea-icon-ibra-undo"
                title="Undo AI Rewrite"
                onClick={() => undoAiRewrite('aim')}
                style={{
                  marginLeft: '8px',
                  opacity: rewriteHistory.aim.length ? 1 : 0.3,
                  cursor: rewriteHistory.aim.length ? 'pointer' : 'not-allowed',
                  fontSize: "15px"
                }}
              />
            </div>
          </div>

          <div className="input-row">
            <div className={`input-box-aim-cp ${errors.scope ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Scope <span className="required-field">*</span></h3>
              <textarea
                spellcheck="true"
                name="scope"
                className="aim-textarea font-fam expanding-textarea"
                value={formData.scope}
                onChange={handleInputChange}

                onFocus={() => {
                  setErrors(prev => ({
                    ...prev,
                    scope: false
                  }))
                }}
                rows="5"   // Adjust the number of rows for initial height
                placeholder="Insert the scope of the document" // Optional placeholder text
              />

              {loadingScope ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-ibra spin-animation" />)
                : (
                  <FontAwesomeIcon
                    icon={faMagicWandSparkles}
                    className="aim-textarea-icon-ibra"
                    title="AI Rewrite"
                    style={{ fontSize: "15px" }}
                    onClick={() => AiRewriteScope()}
                  />
                )}

              <FontAwesomeIcon
                icon={faRotateLeft}
                className="aim-textarea-icon-ibra-undo"
                title="Undo AI Rewrite"
                onClick={() => undoAiRewrite('scope')}
                style={{
                  marginLeft: '8px',
                  opacity: rewriteHistory.scope.length ? 1 : 0.3,
                  cursor: rewriteHistory.scope.length ? 'pointer' : 'not-allowed',
                  fontSize: "15px"
                }}
              />
            </div>
          </div>

          <AbbreviationTable formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} role={role} error={errors.abbrs} userID={userID} setErrors={setErrors} />
          <TermTable formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} role={role} error={errors.terms} userID={userID} setErrors={setErrors} />
          <StandardsTable formData={formData} setFormData={setFormData} error={errors.standard} setErrors={setErrors} />
          <ChapterTable formData={formData} setFormData={setFormData} />
          <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} setErrors={setErrors} error={errors.reference} required={true} />
          <SupportingDocumentTable formData={formData} setFormData={setFormData} />
          <PicturesTable picturesRows={formData.pictures} addPicRow={addPicRow} updatePicRow={updatePicRow} removePicRow={removePicRow} />

          <div className="input-row">
            <div className={`input-box-3 ${errors.reviewDate ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Review Period (Months) <span className="required-field">*</span></h3>
              <input
                type="number"
                name="reviewDate"
                className="aim-textarea cent-create font-fam"
                value={formData.reviewDate}
                onChange={handleInputChange}
                placeholder="Insert the review period in months" // Optional placeholder text
              />
            </div>
          </div>

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
                placeholder="Insert the reason for the document update..." // Optional placeholder text
              />
            </div>
          </div>

          <div className="input-row-buttons">
            {/* Generate File Button */}
            <button
              className="generate-button font-fam"
              onClick={handleGenerateDocument}
              title={validateForm() ? "" : "Fill in all fields marked by a * before generating the file"}
            >
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Generate Document'}
            </button>
            {false && (
              <button
                className="pdf-button font-fam"
                disabled
              >
                Generate PDF
              </button>
            )}
          </div>
        </div>
        {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={type} userID={userID} create={false} standard={true} />)}
        {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
      </div>
      <ToastContainer />
    </div>
  );
};

export default CreatePageStandardsReview;