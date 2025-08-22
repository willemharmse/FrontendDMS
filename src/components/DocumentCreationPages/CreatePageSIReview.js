import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./CreatePage.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import LoadDraftPopup from "../CreatePage/LoadDraftPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faChevronLeft, faChevronRight, faFileCirclePlus, faArrowLeft, faSort, faCircleUser, faBell, faShareNodes, faUpload, faRotateRight, faCircleExclamation, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import SharePage from "../CreatePage/SharePage";
import TopBarDD from "../Notifications/TopBarDD";
import ChapterTable from "../CreatePage/ChapterTable";
import SpecialInstructionsTable from "../CreatePage/SpecialInstructionsTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
import ReferenceTableSpecialInstructions from "../CreatePage/ReferenceTableSpecialInstructions";
import DocumentSignaturesTableSI from "../CreatePage/DocumentSignaturesTableSI";
import AbbreviationTableSI from "../CreatePage/AbbreviationTableSI";
import TermTableSI from "../CreatePage/TermTableSI";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";

const CreatePageSIReview = () => {
  const navigate = useNavigate();
  const access = getCurrentUser();
  const type = useParams().type;
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
  const [usedTermCodes, setUsedTermCodes] = useState([]);
  const [loadedID, setLoadedID] = useState('');
  const [isLoadPopupOpen, setLoadPopupOpen] = useState(false);
  const [titleSet, setTitleSet] = useState(false);
  const [userID, setUserID] = useState('');
  const [userIDs, setUserIDs] = useState([]);
  const autoSaveInterval = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const loadedIDRef = useRef('');
  const [loadingAim, setLoadingAim] = useState(false);
  const [offlineDraft, setOfflineDraft] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [filteredSites, setFilteredSites] = useState([]);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const sitesInputRef = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [filteredNames, setFilteredNames] = useState([]);
  const [showNamesDropdown, setShowNamesDropdown] = useState(false);
  const directeeInputRef = useRef(null);
  const [directees, setDirectees] = useState([]);
  const [generatePopup, setGeneratePopup] = useState(false);
  const [change, setChange] = useState("");
  const [azureFN, setAzureFN] = useState("");
  const fileID = useParams().fileId;
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

  const fetchSites = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/sites`);
      if (!response.ok) {
        throw new Error("Failed to fetch values");
      }
      const data = await response.json();
      setCompanies(data.sites.map(s => s.site));
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  const fetchNames = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/stk`);
      if (!response.ok) {
        throw new Error("Failed to fetch values");
      }
      const data = await response.json();
      const names = data.stakeholders.map(s => s.name);
      setDirectees(names)
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  useEffect(() => {
    fetchSites();
    fetchNames();
  }, []);

  const closeAllDropdowns = () => {
    setShowSiteDropdown(null);
    setShowNamesDropdown(null);
  };

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

    setErrors(prev => ({
      ...prev,
      site: false
    }))

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

  const handleDirecteeInput = (value) => {
    closeAllDropdowns();
    setFormData(prev => ({
      ...prev,
      directee: value
    }));

    const matches = directees
      .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
    setFilteredNames(matches);
    setShowNamesDropdown(true);

    const el = directeeInputRef.current;
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
  const handleDirecteeFocus = () => {
    closeAllDropdowns();

    setErrors(prev => ({
      ...prev,
      directee: false
    }))

    const matches = directees;
    setFilteredNames(matches);
    setShowNamesDropdown(true);

    const el = directeeInputRef.current;
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
  const selectDirecteeSuggestion = (value) => {
    setFormData(prev => ({
      ...prev,
      directee: value
    }));
    setShowNamesDropdown(false);
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
      setShowNamesDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showSiteDropdown, showNamesDropdown]);

  const [formData, setFormData] = useState({
    title: "",
    documentType: useParams().type,
    aim: "",
    site: "",
    date: new Date().toLocaleDateString(),
    version: "1",
    rows: [
      { auth: "Owner", name: "", pos: "", num: 1 },
    ],
    abbrRows: [],
    termRows: [],
    chapters: [],
    references: [],
    special: [{ id: uuidv4(), nr: "1", instruction: "" }],
    changeTable: [
      { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
    ],
    dateConducted: "",
    expiryDate: "",
    directed: "",
    directee: ""
  });

  const [rewriteHistory, setRewriteHistory] = useState({
    aim: [],
  });

  const pushAiRewriteHistory = (field) => {
    setRewriteHistory(prev => ({
      ...prev,
      [field]: [...prev[field], formData[field]]
    }));
  };

  const AiRewriteAim = async () => {
    try {
      const prompt = formData.aim;

      pushAiRewriteHistory('aim');
      setLoadingAim(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatAim/special`, {
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

  const undoAiRewrite = (field) => {
    setRewriteHistory(prev => {
      const hist = [...prev[field]];
      if (hist.length === 0) return prev;         // nothing to undo
      const lastValue = hist.pop();
      setFormData(fd => ({ ...fd, [field]: lastValue }));
      return { ...prev, [field]: hist };
    });
  };

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
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: formDataRef.current,
      userIDs: userIDsRef.current,
      creator: userIDRef.current,
      updater: null,
      dateUpdated: null
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/special/safe`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/special/save/${fileID}`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/special/getFile/${fileID}`);
      const storedData = await response.json();
      setAzureFN(storedData.files.azureFileName || "");
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadData = async (fileID) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/special/getFile/${fileID}`);
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
    if (!formData.site) newErrors.site = true;
    if (!formData.dateConducted) newErrors.dateConducted = true;
    if (!formData.aim) newErrors.aim = true;
    if (!formData.directed) newErrors.directed = true;
    if (!formData.directee) newErrors.directee = true;

    if (formData.rows.length === 0) {
      newErrors.signs = true;
    } else {
      formData.rows.forEach((row, index) => {
        if (!row.name) newErrors.signs = true;
      });
    }


    formData.special.forEach((row, index) => {
      if (!row.instruction) newErrors.special = true;
    });

    return newErrors;
  };

  // Authentication check
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decodedToken = jwtDecode(storedToken);

      setUserID(decodedToken.userId);
      setUserIDs([decodedToken.userId]);
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

    const previousAuth = rowToChange.auth;
    rowToChange[field] = e.target.value;

    if (field === "auth") {
      const requiredRoles = ["Owner"];

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
    const initialRequiredRows = ["Owner"];
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/publish-special`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-special`, {
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
            <img src={`${process.env.PUBLIC_URL}/specialInstInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{"Special Instruction"}</p>
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

            {canIn(access, "DDS", ["systemAdmin", "contributor"]) && (
              <div className="burger-menu-icon-risk-create-page-1">
                <FontAwesomeIcon icon={faUpload} className={`${!loadedID ? "disabled-share" : ""}`} title="Publish" onClick={handleClick} />
              </div>
            )}
          </div>

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          {/* Container for right-aligned icons */}
          <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} />
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
                  placeholder="Title of your document (e.g., Surface TMM Pre-Use Checklist)"
                />
                <span className="type-create-page" style={{ width: "10%" }}>{formData.documentType}</span>
              </div>
            </div>
          </div>

          <div className="input-row-special-intruction">
            <div className={`input-box-type-special-intruction ${errors.site ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Operation / Site <span className="required-field">*</span></h3>
              <div className="special-intruction-select-container">
                <input
                  type="text"
                  name="site"
                  value={formData.site}
                  onChange={e => handleSiteInput(e.target.value)}
                  onFocus={handleSiteFocus}
                  ref={sitesInputRef}
                  autoComplete="off"
                  className="special-intruction-input special-intruction-row-input"
                  placeholder="Insert or Select Operation/ Site Name"
                />
              </div>
            </div>
            <div className="input-box-type-special-intruction-date">
              <div className="input-row-special-intruction-dates">
                <div className={`input-box-type-special-intruction-date-half ${errors.dateConducted ? "error-create" : ""}`}>
                  <h3 className="font-fam-labels">
                    Implementation Date <span className="required-field">*</span>
                  </h3>
                  <input
                    type="date"
                    name="dateConducted"
                    value={formData.dateConducted || ""}
                    onChange={handleInputChange}
                    onFocus={() => setErrors(prev => ({
                      ...prev,
                      dateConducted: false
                    }))}
                    className="special-intruction-input-date-half font-fam"
                  />
                </div>
                <div className={`input-box-type-special-intruction-date-half`}>
                  <h3 className="font-fam-labels">
                    Expiry Date
                  </h3>
                  <input
                    type="date"
                    name="expiryDate"
                    min={formData.dateConducted}
                    value={formData.expiryDate || ""}
                    onChange={handleInputChange}
                    className="special-intruction-input-date-half font-fam"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="input-row">
            <div className={`input-box-special-instruction`}>
              <strong>Note: </strong> This Special Instruction shall remain in effect from the stated effective date until the specified expiry date and shall take precedence over any previous instructions related to this subject.
            </div>
          </div>

          <div className="input-box-type-special-intruction-to-from">
            <div className="input-row-special-intruction-dates">
              <div className={`input-box-type-special-intruction-select-half ${errors.directee ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                  Special Instruction From <span className="required-field">*</span>
                </h3>

                <div className="special-intruction-select-container-2">
                  <input
                    type="text"
                    name="directee"
                    value={formData.directee || ""}
                    onChange={e => handleDirecteeInput(e.target.value)}
                    onFocus={handleDirecteeFocus}
                    ref={directeeInputRef}
                    autoComplete="off"
                    className="special-intruction-input-select-half font-fam"
                    placeholder="Insert Person Giving the Special Instruction"
                  />
                </div>
              </div>
              <div className={`input-box-type-special-intruction-select-half ${errors.directed ? "error-create" : ""}`}>
                <h3 className="font-fam-labels">
                  Special Instruction Directed To <span className="required-field">*</span>
                </h3>

                <input
                  type="text"
                  name="directed"
                  value={formData.directed || ""}
                  onChange={handleInputChange}
                  onFocus={() => setErrors(prev => ({
                    ...prev,
                    directed: false
                  }))}
                  autoComplete="off"
                  className="special-intruction-input-select-half font-fam"
                  placeholder="Insert Group or Person Instruction is Directed To"
                />
              </div>
            </div>
          </div>

          <DocumentSignaturesTableSI rows={formData.rows} handleRowChange={handleRowChange} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} setErrors={setErrors} />

          <div className="input-row" style={{ position: 'relative' }}>
            <div className={`input-box-aim-cp ${errors.aim ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Purpose and Background <span className="required-field">*</span></h3>
              <textarea
                spellcheck="true"
                name="aim"
                className="aim-textarea-si font-fam"
                value={formData.aim}
                onChange={handleInputChange}
                onFocus={() => setErrors(prev => ({
                  ...prev,
                  aim: false
                }))}
                rows="5"   // Adjust the number of rows for initial height
                placeholder="Insert the purpose of this document and include any relevant background information regarding the topic." // Optional placeholder text
              />

              {loadingAim ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-si spin-animation" />) : (
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
                className="aim-textarea-icon-si-undo"
                title="Undo AI Rewrite"
                style={{
                  marginLeft: '8px',
                  opacity: rewriteHistory.aim.length ? 1 : 0.3,
                  cursor: rewriteHistory.aim.length ? 'pointer' : 'not-allowed',
                  fontSize: "15px"
                }}
                onClick={() => undoAiRewrite("aim")}
              />
            </div>
          </div>

          <SpecialInstructionsTable formData={formData} setFormData={setFormData} error={errors.special} setErrors={setErrors} />
          <ChapterTable formData={formData} setFormData={setFormData} />
          <AbbreviationTableSI formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setErrors={setErrors} si={true} />
          <TermTableSI formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setErrors={setErrors} si={true} />
          <ReferenceTableSpecialInstructions formData={formData} setFormData={setFormData} referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} />

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
      </div>
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

      {showNamesDropdown && filteredNames.length > 0 && (
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
          {filteredNames.sort().map((term, i) => (
            <li
              key={i}
              onMouseDown={() => selectDirecteeSuggestion(term)}
            >
              {term}
            </li>
          ))}
        </ul>
      )}
      {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={type} userID={userID} create={false} special={true} />)}
      {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
      <ToastContainer />
    </div>
  );
};

export default CreatePageSIReview;