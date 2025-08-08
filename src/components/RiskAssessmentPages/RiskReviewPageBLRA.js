import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4, validate } from 'uuid';
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
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faShareNodes, faUpload, faRotateRight, faChevronLeft, faChevronRight, faInfoCircle, faMagicWandSparkles, faSave, faPen, faArrowLeft, faArrowUp, faCaretRight, faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import TopBarDD from "../Notifications/TopBarDD";
import AttendanceTable from "../RiskRelated/AttendanceTable";
import DocumentSignaturesRiskTable from "../RiskRelated/DocumentSignaturesRiskTable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import ControlAnalysisTable from "../RiskRelated/ControlAnalysisTable";
import LoadRiskDraftPopup from "../RiskRelated/LoadRiskDraftPopup";
import SharePageRisk from "../RiskRelated/SharePageRisk";
import RiskAim from "../RiskRelated/RiskInfo/RiskAim";
import RiskScope from "../RiskRelated/RiskInfo/RiskScope";
import ExecutiveSummary from "../RiskRelated/ExecutiveSummary";
import PicturesTable from "../CreatePage/PicturesTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
import SavePopup from "../Popups/SavePopup";
import BLRATable from "../RiskRelated/BLRAComponents/BLRATable";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";

const RiskReviewPageBLRA = () => {
    const navigate = useNavigate();
    const riskType = useParams().type;
    const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
    const [companies, setCompanies] = useState([]);
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
    const [loadingAim, setLoadingAim] = useState(false);
    const [loadingScope, setLoadingScope] = useState(false);
    const [loadingScopeI, setLoadingScopeI] = useState(false);
    const [loadingScopeE, setLoadingScopeE] = useState(false);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [controls, setControls] = useState([]);
    const [generatePopup, setGeneratePopup] = useState(false);
    const [azureFN, setAzureFN] = useState("");
    const fileID = useParams().fileId;
    const [change, setChange] = useState("");
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
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/blra/safe`, {
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

    const saveData = async (fileID) => {
        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
            usedTermCodes: usedTermCodesRef.current,
            formData: formDataRef.current
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/blra/save/${fileID}`, {
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

    const handleClick3 = async () => {
        try {
            await handleGeneratePublish();
        } catch (err) {
            toast.error("Could not save draft, generation aborted." + err);
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

        await handleGenerateBLRADocument(updatedFormData);
    };

    const handleGenerateBLRADocument = async (generateData) => {
        const dataToStore = {
            formData: generateData,
        };

        const documentName = (formData.title) + ' ' + formData.documentType;
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-blra`, {
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

    const AiRewriteAim = async () => {
        try {
            const prompt = formData.aim;

            pushAiRewriteHistory('aim');
            setLoadingAim(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatAim/ibra`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatScope/ibra`, {
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

    const AiRewriteScopeInclusions = async () => {
        try {
            const prompt = formData.scopeInclusions;

            pushAiRewriteHistory('scopeInclusions');
            setLoadingScopeI(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatScopeI/ibra`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ prompt }),
            });

            const { response: newText } = await response.json();
            setLoadingScopeI(true);
            setFormData(fd => ({ ...fd, scopeInclusions: newText }));
        } catch (error) {
            setLoadingScopeI(true);
            console.error('Error saving data:', error);
        }
    }

    const AiRewriteScopeExlusions = async () => {
        try {
            const prompt = formData.scopeExclusions;

            pushAiRewriteHistory('scopeExclusions');
            setLoadingScopeE(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatScopeE/ibra`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ prompt }),
            });

            const { response: newText } = await response.json();
            setLoadingScopeE(false);
            setFormData(fd => ({ ...fd, scopeExclusions: newText }));
        } catch (error) {
            setLoadingScopeE(false);
            console.error('Error saving data:', error);
        }
    }

    useEffect(() => {
        if (fileID) {
            loadData(fileID);
        }
    }, [fileID]);

    const getNewAzureFileName = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/blra/getFile/${fileID}`);
            const storedData = await response.json();
            setAzureFN(storedData.files.azureFileName || "");
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    function normalizeIbraFormData(formData = {}) {
        if (!Array.isArray(formData.ibra)) return formData;

        const normalized = {
            ...formData,
            ibra: formData.ibra.map(row => {
                const possible = Array.isArray(row.possible) ? row.possible : [];

                return {
                    ...row,
                    possible: possible.map(block => {
                        const possibleId = block?.id ?? uuidv4();
                        const count = block?.actions?.length;

                        const actions = Array.from({ length: count }, (_, i) => {
                            const a = block?.actions?.[i];
                            return {
                                id: a?.id ?? uuidv4(),
                                action: a?.action ?? ''
                            };
                        });

                        const responsible = Array.from({ length: count }, (_, i) => {
                            const r = block?.responsible?.[i];
                            return {
                                id: r?.id ?? uuidv4(),
                                person: r?.person ?? ''
                            };
                        });

                        // Normalize dueDate to match actions count, each with id
                        const dueDate = Array.from({ length: count }, (_, i) => {
                            const d = block?.dueDate?.[i];
                            return {
                                id: d?.id ?? uuidv4(),
                                date: d?.date ?? ''
                            };
                        });

                        return { ...block, id: possibleId, actions, responsible, dueDate };
                    })
                };
            })
        };

        // ——— Normalize CEA: just add missing plain fields ———
        if (Array.isArray(normalized.cea)) {
            normalized.cea = normalized.cea.map(block => ({
                ...block,
                action: block.action !== undefined ? block.action : '',
                responsible: block.responsible !== undefined ? block.responsible : '',
                dueDate: block.dueDate !== undefined ? block.dueDate : ''
            }));
        }

        return normalized;
    }

    const loadData = async (fileID) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/blra/getFile/${fileID}`);
            const data = await response.json();
            const storedData = data.files;
            // Update your states as needed:
            setUsedAbbrCodes(storedData.usedAbbrCodes || []);
            setUsedTermCodes(storedData.usedTermCodes || []);

            const raw = storedData.formData || {};
            const patched = normalizeIbraFormData(raw);
            setFormData(patched);

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

    const updateIbraRows = (idToUpdate, newValues) => {
        setFormData(prev => ({
            ...prev,
            ibra: prev.ibra.map(item =>
                item.id === idToUpdate
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
                    id: uuidv4(),
                    nr: prevFormData.ibra.length + 1,
                    main: "", sub: "", owner: "", odds: "", riskRank: "",
                    hazards: [], controls: [], S: "-", H: "-", E: "-", C: "-", LR: "-", M: "-",
                    R: "-", source: "", material: "", priority: "",
                    possible: [{ id: uuidv4(), actions: [{ id: uuidv4(), action: "" }], responsible: [{ id: uuidv4(), person: "" }], dueDate: [{ id: uuidv4(), date: "" }] }],
                    UE: "", additional: "", maxConsequence: ""
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
        aim: "",
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
                possible: [{ id: uuidv4(), actions: [{ id: uuidv4(), action: "" }], responsible: [{ id: uuidv4(), person: "" }], dueDate: [{ id: uuidv4(), date: "" }] }], UE: "", additional: "", maxConsequence: ""
            }
        ],
        cea: [
            {
                id: uuidv4(), nr: 1, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: "", description: "", performance: "", dueDate: "", responsible: "", action: ""
            }
        ],
        abbrRows: [],
        termRows: [],
        attendance: [
            {
                name: "", site: "", designation: "Facilitator", num: "", presence: "Absent"
            }
        ],
        supportingDocuments: [],
        references: [],
        pictures: [],
        reviewDate: 0,
        changeTable: [
            { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
        ],
    });

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }, [formData])

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

    const [rewriteHistory, setRewriteHistory] = useState({
        aim: [],
        scope: [],
        scopeInclusions: [],
        scopeExclusions: [],
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
        saveData(fileID);
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
        const withCER = newCEA.map(r => ({
            ...r,
            cer: (r.quality && r.hierarchy)
                ? calculateCER(r.hierarchy, r.quality)
                : r.cer
        }));
        setFormData((prevFormData) => ({
            ...prevFormData,
            cea: withCER, // Update procedureRows with new data
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
                position: "top-right",
                autoClose: 800,
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
                position: "top-right",
                autoClose: 800,
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

    const handleGenerateIBRA = async () => {
        const dataToStore = {
            formData
        };

        const documentName = (formData.title) + ' ' + formData.documentType + " Output Register";
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
            usedAbbrCodes: usedAbbrCodesRef.current,
            usedTermCodes: usedTermCodesRef.current,
            formData: formDataToStore,
            userID,
            azureFN: azureFN,
            draftID: ""
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/publish-blra`, {
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

    const prevControlsRef = useRef([]);  // hold last‐seen list so we only fetch on real changes

    const calculateCER = (hierarchy, quality) => {
        const ratingMatrix = [
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Could Improve', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Not Effective', 'Not Effective', 'Not Effective', 'Not Effective']
        ];
        const hIndex = parseInt(hierarchy.split('. ')[0], 10) - 1;
        const qMap = { '> 90%': 0, '60-90%': 1, '30-59%': 2, '< 30%': 3 };
        const cIndex = qMap[quality];
        return (hIndex >= 0 && cIndex >= 0)
            ? ratingMatrix[hIndex][cIndex]
            : "";
    };


    useEffect(() => {
        // 1. Build a de-duplicated list of controls in the order they first appeared
        const distinctControls = Array.from(
            new Set(
                formData.ibra
                    .flatMap(item => item.controls || [])
                    .map(c =>
                        typeof c === "string"
                            ? c.trim()
                            : c && typeof c === "object" && "control" in c
                                ? String(c.control).trim()
                                : ""
                    )
                    .filter(name => name.length > 0)
            )
        );

        // 2. If the list really hasn’t changed, do nothing
        const prev = prevControlsRef.current;
        if (
            distinctControls.length === prev.length &&
            distinctControls.every((c, i) => c === prev[i])
        ) {
            return;
        }
        prevControlsRef.current = distinctControls;

        // 3. If no controls at all, clear the CEA table
        if (distinctControls.length === 0) {
            updateCeaRows([]);
            return;
        }

        // 4. Fetch your metadata for all controls
        const fetchCEAData = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_URL}/api/riskInfo/getControls`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ controls: distinctControls }),
                    }
                );
                const { controls: returnedData } = await res.json();

                // 5. Merge into existing CEA rows:
                //    • Keep rows the user already has, in their current order
                //    • Append any brand-new controls at the end
                const kept = formData.cea.filter(r =>
                    distinctControls.includes(r.control)
                );
                const existingNames = kept.map(r => r.control);
                const toAdd = distinctControls.filter(
                    c => !existingNames.includes(c)
                );
                const newRows = toAdd.map(ctrl => {
                    const oldRow = formData.cea.find(r => r.control === ctrl);
                    const ret = returnedData.find(d => d.control === ctrl) || {};
                    return {
                        id: oldRow?.id || uuidv4(),
                        control: ctrl,
                        critical: oldRow?.critical ?? ret.critical ?? "",
                        act: oldRow?.act ?? ret.act ?? "",
                        activation: oldRow?.activation ?? ret.activation ?? "",
                        hierarchy: oldRow?.hierarchy ?? ret.hierarchy ?? "",
                        cons: oldRow?.cons ?? ret.cons ?? "",
                        quality: oldRow?.quality ?? ret.quality ?? "",
                        cer: oldRow?.cer ?? ret.cer ?? "",
                        notes: oldRow?.notes ?? ret.notes ?? "",
                        description: oldRow?.description ?? ret.description ?? "",
                        performance: oldRow?.performance ?? ret.performance ?? "",
                        action: oldRow?.action ?? ret.action ?? "",
                        dueDate: oldRow?.dueDate ?? ret.dueDate ?? "",
                        responsible: oldRow?.responsible ?? ret.responsible ?? "",
                    };
                });

                // 6. Renumber and push back to state
                const merged = [...kept, ...newRows].map((r, i) => ({
                    ...r,
                    nr: i + 1,
                }));
                updateCeaRows(merged);
            } catch (err) {
                console.error("Failed to fetch CEA data", err);
            }
        };

        fetchCEAData();
    }, [formData.ibra]);

    const handleControlRename = (oldName, newName) => {
        // 1) Rename in IBRA rows (all duplicates)
        const updatedIBRA = formData.ibra.map(r => ({
            ...r,
            controls: r.controls.map(c =>
                c.trim() === oldName.trim() ? newName.trim() : c
            )
        }));

        // 2) Rename in CEA rows so popup/table stay in sync
        const updatedCEA = formData.cea.map(r => ({
            ...r,
            control: r.control.trim() === oldName.trim() ? newName.trim() : r.control
        }));

        setFormData(prev => ({
            ...prev,
            ibra: updatedIBRA,
            cea: updatedCEA
        }));
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
                        <img src={`${process.env.PUBLIC_URL}/blra2.svg`} alt="Control Attributes" className="icon-risk-rm" />
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
                            <FontAwesomeIcon icon={faUpload} onClick={handleClick3} className={`${!loadedID ? "disabled-share" : ""}`} title="Publish" />
                        </div>
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBarDD role={role} menu={"1"} create={true} risk={true} />
                </div>

                <div className={`scrollable-box-risk-create`}>
                    <div className="input-row-risk-create">
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
                                    placeholder="Insert Risk Assessment Title"
                                />
                                <span className="type-risk-create">{formData.documentType}</span>
                            </div>
                        </div>
                    </div>

                    <div className="input-row-risk-create">
                        <div className={`input-box-type-risk-create ${errors.site ? "error-create" : ""}`}>
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
                        <div className={`input-box-type-risk-create-date ${errors.dateConducted ? "error-create" : ""}`}>
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
                            <h3 className="font-fam-labels">Aim</h3>
                            <textarea
                                spellCheck="true"
                                name="aim"
                                className="aim-textarea-risk-create-ibra font-fam"
                                onChange={handleInputChange}
                                value={formData.aim}
                                rows="5"   // Adjust the number of rows for initial height
                                placeholder="Clearly state the goal of the risk assessment, focusing on what the assessment intends to achieve or address. Keep it specific, relevant, and outcome-driven." // Optional placeholder text
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

                    <div className="input-row-risk-create">
                        <div className={`input-box-aim-risk-scope ${errors.aim ? "error-create" : ""}`}>
                            <button
                                className="top-left-button-refs"
                                title="Information"
                            >
                                <FontAwesomeIcon icon={faInfoCircle} onClick={openHelpScope} style={{ cursor: 'pointer' }} className="icon-um-search" />
                            </button>
                            <h3 className="font-fam-labels">Scope</h3>
                            <div className="risk-scope-group" style={{ marginBottom: "-10px" }}>
                                <div className="risk-execSummary-popup-page-additional-row ">
                                    <div className="risk-popup-page-column-half-scope">
                                        <label className="scope-risk-label">Introduction</label>
                                        <textarea
                                            lang="en-ZA"
                                            spellCheck="true"
                                            name="scope"
                                            className="aim-textarea-risk-scope-2 font-fam"
                                            onChange={handleInputChange}
                                            value={formData.scope}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="Insert a brief scope introduction (General scope notes and comments)." // Optional placeholder text
                                        />
                                        {loadingScope ? (<FontAwesomeIcon icon={faSpinner} className="scope-textarea-icon spin-animation" />)
                                            : (
                                                <FontAwesomeIcon
                                                    icon={faMagicWandSparkles}
                                                    className="scope-textarea-icon"
                                                    title="AI Rewrite"
                                                    style={{ fontSize: "15px" }}
                                                    onClick={() => AiRewriteScope()}
                                                />
                                            )}

                                        <FontAwesomeIcon
                                            icon={faRotateLeft}
                                            className="scope-textarea-icon-undo"
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
                            </div>
                            <div className="risk-scope-group">
                                <div className="risk-scope-popup-page-additional-row ">
                                    <div className="risk-popup-page-column-half-scope">
                                        <label className="scope-risk-label">Scope Inclusions</label>
                                        <textarea
                                            spellCheck="true"
                                            name="scopeInclusions"
                                            className="aim-textarea-risk-scope font-fam"
                                            value={formData.scopeInclusions}
                                            onChange={handleInputChange}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="Insert scope inclusions (List the specific items, activities, or areas covered in this risk assessment)."
                                        />
                                        {loadingScopeI ? (<FontAwesomeIcon icon={faSpinner} className="scope-textarea-icon spin-animation" />)
                                            : (<FontAwesomeIcon
                                                icon={faMagicWandSparkles}
                                                className="scope-textarea-icon"
                                                title="AI Rewrite"
                                                style={{ fontSize: "15px" }}
                                                onClick={() => AiRewriteScopeInclusions()}
                                            />)}

                                        <FontAwesomeIcon
                                            icon={faRotateLeft}
                                            className="scope-textarea-icon-undo"
                                            title="Undo AI Rewrite"
                                            style={{
                                                marginLeft: '8px',
                                                opacity: rewriteHistory.scopeInclusions.length ? 1 : 0.3,
                                                cursor: rewriteHistory.scopeInclusions.length ? 'pointer' : 'not-allowed',
                                                fontSize: "15px"
                                            }}
                                            onClick={() => undoAiRewrite('scopeInclusions')}
                                        />
                                    </div>

                                    <div className="risk-popup-page-column-half-scope">
                                        <label className="scope-risk-label">Scope Exclusions</label>
                                        <textarea
                                            spellCheck="true"
                                            name="scopeExclusions"
                                            className="aim-textarea-risk-scope font-fam"
                                            value={formData.scopeExclusions}
                                            onChange={handleInputChange}
                                            rows="5"   // Adjust the number of rows for initial height
                                            placeholder="Insert scope exclusions (List the specific items, activities, or areas not covered in this risk assessment)."
                                        />
                                        {loadingScopeE ? (<FontAwesomeIcon icon={faSpinner} className="scope-textarea-icon spin-animation" />) :
                                            (< FontAwesomeIcon
                                                icon={faMagicWandSparkles}
                                                className="scope-textarea-icon"
                                                title="AI Rewrite"
                                                style={{ fontSize: "15px" }}
                                                onClick={() => AiRewriteScopeExlusions()}
                                            />)}

                                        < FontAwesomeIcon
                                            icon={faRotateLeft}
                                            className="scope-textarea-icon-undo"
                                            title="Undo AI Rewrite"
                                            style={{
                                                marginLeft: '8px',
                                                opacity: rewriteHistory.scopeExclusions.length ? 1 : 0.3,
                                                cursor: rewriteHistory.scopeExclusions.length ? 'pointer' : 'not-allowed',
                                                fontSize: "15px"
                                            }}
                                            onClick={() => undoAiRewrite('scopeExclusions')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AbbreviationTableRisk risk={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} role={role} error={errors.abbrs} userID={userID} />
                    <TermTableRisk risk={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} role={role} error={errors.terms} userID={userID} />
                    <AttendanceTable rows={formData.attendance} addRow={addAttendanceRow} error={errors.attend} removeRow={removeAttendanceRow} updateRows={updateAttendanceRows} role={role} userID={userID} generateAR={handleClick} />
                    {formData.documentType === "BLRA" && (<BLRATable rows={formData.ibra} error={errors.ibra} updateRows={updateIbraRows} updateRow={updateIBRARows} addRow={addIBRARow} removeRow={removeIBRARow} generate={handleClick2} isSidebarVisible={isSidebarVisible} />)}
                    {(["BLRA"].includes(formData.documentType)) && (<ControlAnalysisTable error={errors.cea} rows={formData.cea} ibra={formData.ibra} updateRows={updateCEARows} onControlRename={handleControlRename} addRow={addCEARow} updateRow={updateCeaRows} removeRow={removeCEARow} title={formData.title} isSidebarVisible={isSidebarVisible} />)}

                    <ExecutiveSummary formData={formData} setFormData={setFormData} error={errors.execSummary} handleInputChange={handleInputChange} />
                    <SupportingDocumentTable formData={formData} setFormData={setFormData} />
                    <ReferenceTable referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} />
                    <PicturesTable picturesRows={formData.pictures} addPicRow={addPicRow} updatePicRow={updatePicRow} removePicRow={removePicRow} />
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
                            onClick={handleGenerateDocument}
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
            {helpRA && (<RiskAim setClose={closeHelpRA} />)}
            {helpScope && (<RiskScope setClose={closeHelpScope} />)}
            <ToastContainer />
            {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={riskType} userID={userID} create={false} />)}
            {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}

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
            )}</div>
    );
};

export default RiskReviewPageBLRA;