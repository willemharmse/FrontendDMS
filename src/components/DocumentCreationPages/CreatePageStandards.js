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
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faChevronLeft, faChevronRight, faFileCirclePlus, faArrowLeft, faSort, faCircleUser, faBell, faShareNodes, faUpload, faRotateRight, faCircleExclamation, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import BurgerMenu from "../CreatePage/BurgerMenu";
import SharePage from "../CreatePage/SharePage";
import TopBarDD from "../Notifications/TopBarDD";
import ChapterTable from "../CreatePage/ChapterTable";
import StandardsTable from "../CreatePage/StandardsTable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";

const CreatePageStandards = () => {
  const navigate = useNavigate();
  const type = useParams().type;
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const loadedIDRef = useRef('');
  const [offlineDraft, setOfflineDraft] = useState(false);
  const [generatePopup, setGeneratePopup] = useState(false);

  const updateRow = (index, field, value) => {
    const updatedProcedureRows = formData.procedureRows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );

    setFormData(prevFormData => ({
      ...prevFormData,
      procedureRows: updatedProcedureRows,
    }));
  };

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

    handleSave();
    loadData(loadedIDRef.current);

    toast.dismiss();
    toast.clearWaitingQueue();
    toast.success("New Draft Successfully Loaded", {
      closeButton: false,
      autoClose: 1500, // 1.5 seconds
      style: {
        textAlign: 'center'
      }
    });

    setIsSaveAsModalOpen(false);
  };

  const openShare = () => {
    if (loadedID) {
      setShare(true);
    } else {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.warn("Please save a draft before sharing.", {
        closeButton: true,
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
        saveData();

        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("Draft has been successfully saved", {
          closeButton: true,
          autoClose: 1500, // 1.5 seconds
          style: {
            textAlign: 'center'
          }
        });
      }
      else if (loadedIDRef.current !== '') {
        updateData(userIDsRef.current);

        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("Draft has been successfully updated", {
          closeButton: true,
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
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });
    }
  };

  const loadOfflineData = async () => {
    try {
      const storedString = localStorage.getItem("draftData");
      if (!storedString) return;

      const storedData = JSON.parse(storedString); // ✅ Parse the JSON string

      console.log(storedData);

      setUsedAbbrCodes(storedData.usedAbbrCodes || []);
      setUsedTermCodes(storedData.usedTermCodes || []);
      setUsedPPEOptions(storedData.usedPPEOptions || []);
      setUsedHandTools(storedData.usedHandTools || []);
      setUsedEquipment(storedData.usedEquipment || []);
      setUsedMobileMachines(storedData.usedMobileMachine || []);
      setUsedMaterials(storedData.usedMaterials || []);
      setUserIDs(storedData.userIDs || []);
      setFormData(storedData.formData || {});
      setFormData(prev => ({ ...prev })); // this line may be redundant
      setTitleSet(true);
      setOfflineDraft(true);
      loadedIDRef.current = storedData.loadedID;
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveDataOffline = async (id) => {
    const dataToStore = {
      usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
      usedTermCodes: usedTermCodesRef.current,
      usedPPEOptions: usedPPEOptionsRef.current,
      usedHandTools: usedHandToolsRef.current,
      usedEquipment: usedEquipmentRef.current,
      usedMobileMachine: usedMobileMachineRef.current,
      usedMaterials: usedMaterialsRef.current,
      formData: formDataRef.current,
      userIDs: userIDsRef.current,
      creator: userIDRef.current,
      updater: null,
      dateUpdated: null,
      loadedID: id,
      date: Date.now()
    };


    console.log("Attempting to save:", dataToStore);

    try {
      localStorage.setItem('draftData', JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const saveData = async () => {
    const dataToStore = {
      usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
      usedTermCodes: usedTermCodesRef.current,
      usedPPEOptions: usedPPEOptionsRef.current,
      usedHandTools: usedHandToolsRef.current,
      usedEquipment: usedEquipmentRef.current,
      usedMobileMachine: usedMobileMachineRef.current,
      usedMaterials: usedMaterialsRef.current,
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
      setOfflineDraft(false);
      localStorage.removeItem("draftData");

      if (result.id) {  // Ensure we receive an ID from the backend
        setLoadedID(result.id);  // Update loadedID to track the saved document
        loadedIDRef.current = result.id;
      }
    } catch (error) {
      console.error('Error saving data:', error);
      saveDataOffline(""); // Fallback to offline save
    }
  };

  const updateData = async (selectedUserIDs) => {
    const dataToStore = {
      usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
      usedTermCodes: usedTermCodesRef.current,
      usedPPEOptions: usedPPEOptionsRef.current,
      usedHandTools: usedHandToolsRef.current,
      usedEquipment: usedEquipmentRef.current,
      usedMobileMachine: usedMobileMachineRef.current,
      usedMaterials: usedMaterialsRef.current,
      formData: formDataRef.current,
      userIDs: selectedUserIDs,
      updater: userIDRef.current,
      dateUpdated: new Date().toISOString(),
      userID
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standards/modifySafe/${loadedIDRef.current}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dataToStore),
      });
      const result = await response.json();
      setOfflineDraft(false);
      localStorage.removeItem("draftData");

      console.log(result.message);
    } catch (error) {
      console.error('Error saving data:', error);
      saveDataOffline(loadedIDRef.current);
    }
  };

  const handleClick = () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      if (titleSet)
        setGeneratePopup(true);

      if (!titleSet) {
        toast.error("Please fill in a title", {
          closeButton: true,
          autoClose: 800, // 1.5 seconds
          style: {
            textAlign: 'center'
          }
        });
      }
    } else {
      handleGeneratePDF();  // Call your function when the form is valid
    }
  };

  const cancelGenerate = () => {

    const newErrors = validateForm();
    setErrors(newErrors);
    setGeneratePopup(false);
  }

  const closeGenerate = () => {
    setGeneratePopup(false);
  }

  const handlePubClick = () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (loadedID === '') {
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
      handlePublish();  // Call your function when the form is valid
    }
  };

  const loadData = async (loadID) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standards/getDraft/${loadID}`);
      const storedData = await response.json();
      // Update your states as needed:
      setUsedAbbrCodes(storedData.usedAbbrCodes || []);
      setUsedTermCodes(storedData.usedTermCodes || []);
      setUsedPPEOptions(storedData.usedPPEOptions || []);
      setUsedHandTools(storedData.usedHandTools || []);
      setUsedEquipment(storedData.usedEquipment || []);
      setUsedMobileMachines(storedData.usedMobileMachine || []);
      setUsedMaterials(storedData.usedMaterials || []);
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

  const [formData, setFormData] = useState({
    title: "",
    documentType: useParams().type,
    aim: "The aim of the document is ",
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
    if (Object.keys(errors).length > 0) {
      const newErrors = validateFormRevised();
      setErrors(newErrors);
    }
  }, [formData])

  const formDataRef = useRef(formData);
  const usedAbbrCodesRef = useRef(usedAbbrCodes);
  const usedTermCodesRef = useRef(usedTermCodes);
  const usedPPEOptionsRef = useRef(usedPPEOptions);
  const usedHandToolsRef = useRef(usedHandTools);
  const usedEquipmentRef = useRef(usedEquipment);
  const usedMobileMachineRef = useRef(usedMobileMachine);
  const usedMaterialsRef = useRef(usedMaterials);
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

    if (loadedIDRef.current === '') {
      saveData(); // First time save
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
      updateData(userIDsRef.current); // Update existing draft
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

  const updateRefRows = (newRef) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      references: newRef, // Update procedureRows with new data
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title) newErrors.title = true;
    if (!formData.documentType) newErrors.documentType = true;
    if (!formData.aim) newErrors.aim = true;
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

    return newErrors;
  };

  const validateFormRevised = () => {
    const newErrors = errors;
    if (!formData.reviewDate) { newErrors.reviewDate = true } else {
      newErrors.reviewDate = false;
    };
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
          responsible: "",
          prevStep: "-",
        }
      ]
    });
  };

  const removeProRow = (indexToRemove) => {
    if (formData.procedureRows.length <= 1) {
      toast.warn("At least one procedure step is required.", {
        autoClose: 800,
        closeButton: true,
        style: { textAlign: "center" },
      });
      return;
    }

    const newRows = formData.procedureRows
      .filter((_, index) => index !== indexToRemove)
      .map((row, idx) => ({ ...row, nr: idx + 1 })); // Renumber after removal

    setFormData({
      ...formData,
      procedureRows: newRows,
    });
  };

  const updateProcedureRows = (newProcedureRows) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      procedureRows: newProcedureRows, // Update procedureRows with new data
    }));
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
    const dataToStore = {
      usedAbbrCodes,       // your current state values
      usedTermCodes,
      usedPPEOptions,
      usedHandTools,
      usedEquipment,
      usedMobileMachine,
      usedMaterials,
      formData,
      userID,
      azureFN: ""
    };

    if (generatePopup) {
      setGeneratePopup(false);
    }
    const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType;
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
      saveAs(blob, `${documentName}.docm`);
      setLoading(false);
      //saveAs(blob, `${documentName}.pdf`);
    } catch (error) {
      console.error("Error generating document:", error);
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    const dataToStore = {
      usedAbbrCodes,
      usedTermCodes,
      formData,
      userID,
      azureFN: "",
      draftID: loadedIDRef.current
    };

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/publish-standard`, {
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
      setTimeout(() => {
        navigate('/FrontendDMS/generatedStandardFiles'); // Redirect to the generated file info page
      }, 1000);
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

          <div className="button-container-create">
            <button className="but-um" onClick={() => setLoadPopupOpen(true)}>
              <div className="button-content">
                {/* base floppy-disk, full size */}
                <FontAwesomeIcon icon={faFolderOpenSolid} className="fa-regular button-icon" />
                {/* pen, shrunk & nudged down/right into corner */}
                <FontAwesomeIcon
                  icon={faArrowUp}
                  transform="shrink-2 up-8 left-20"
                  color="#002060"   /* or whatever contrast you need */
                  fontSize={"16px"}
                />
                <span className="button-text">Saved Drafts</span>
              </div>
            </button>
            <button className="but-um" onClick={() => navigate('/FrontendDMS/generatedStandardFiles')}>
              <div className="button-content">
                <FontAwesomeIcon icon={faFolderOpen} className="button-icon" />
                <span className="button-text">Published Documents</span>
              </div>
            </button>
          </div>

          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/standardsDMSInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{type}</p>
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
      {share && <SharePage closePopup={closeShare} userID={userID} userIDs={userIDs} popupVisible={share} saveData={updateData} setUserIDs={setUserIDs} />}
      {isLoadPopupOpen && <LoadDraftPopup isOpen={isLoadPopupOpen} onClose={closeLoadPopup} setLoadedID={setLoadedID} loadData={loadData} userID={userID} type={type.toLowerCase()} />}
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
              <FontAwesomeIcon icon={faShareNodes} onClick={openShare} className={`${!loadedID ? "disabled-share" : ""}`} title="Share" />
            </div>

            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faUpload} className={`${!loadedID ? "disabled-share" : ""}`} title="Publish" onClick={handlePubClick} />
            </div>
          </div>

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          {/* Container for right-aligned icons */}
          <TopBarDD role={role} menu={"1"} create={true} loadOfflineDraft={loadOfflineData} />
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
                className="aim-textarea font-fam"
                value={formData.aim}
                onChange={handleInputChange}
                rows="5"   // Adjust the number of rows for initial height
                placeholder="Insert the aim of the document here..." // Optional placeholder text
              />
            </div>
          </div>

          <AbbreviationTable formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} role={role} error={errors.abbrs} userID={userID} setErrors={setErrors} />
          <TermTable formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} role={role} error={errors.terms} userID={userID} setErrors={setErrors} />
          <StandardsTable formData={formData} setFormData={setFormData} error={errors.standard} setErrors={setErrors} />
          <ChapterTable formData={formData} setFormData={setFormData} />
          <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} />
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

          <div className="input-row-buttons">
            {/* Generate File Button */}
            <button
              className="generate-button font-fam"
              onClick={handleClick}
              title={validateForm() ? "" : "Fill in all fields marked by a * before generating the file"}
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
        {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={type} userID={userID} create={false} standard={true} />)}
        {generatePopup && (<GenerateDraftPopup deleteDraft={handleGeneratePDF} closeModal={closeGenerate} cancel={cancelGenerate} />)}
      </div>
      <ToastContainer />
    </div>
  );
};

export default CreatePageStandards;