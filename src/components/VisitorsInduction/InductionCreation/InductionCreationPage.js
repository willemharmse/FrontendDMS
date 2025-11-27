import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import TermTable from "../../CreatePage/TermTable";
import AbbreviationTable from "../../CreatePage/AbbreviationTable";
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faArrowLeft, faShareNodes, faUpload, faRotateRight, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight, faInfo, faL, faMagicWandSparkles, faEye, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons";
import TopBarDD from "../../Notifications/TopBarDD";
import SaveAsPopup from "../../Popups/SaveAsPopup";
import GenerateDraftPopup from "../../Popups/GenerateDraftPopup";
import DraftPopup from "../../Popups/DraftPopup";
import DocumentWorkflow from "../../Popups/DocumentWorkflow";
import { v4 as uuidv4 } from "uuid";
import { canIn, getCurrentUser } from "../../../utils/auth";
import InductionAssessment from "./InductionAssessment";
import InductionContent from "./InductionContent";
import InductionSummary from "./InductionSummary";
import LoadDraftPopup from "../../CreatePage/LoadDraftPopup";
import SharePage from "../../CreatePage/SharePage";
import InductionOutline from "./InductionOutline";
import LoadIndcutionDraftPopup from "./LoadIndcutionDraftPopup";
import SaveAsInductionPopup from "./SaveAsInductionPopup";
import LoadDraftIndcutionPopup from "./LoadDraftIndcutionPopup";
import InductionPreviewPage from "./InductionPreviewPage";
import ApproversPopup from "./ApproversPopup";

const InductionCreationPage = () => {
  const id = useParams().id || '';
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [share, setShare] = useState(false);
  const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
  const [usedTermCodes, setUsedTermCodes] = useState([]);
  const access = getCurrentUser();
  const [loadedID, setLoadedID] = useState('');
  const [isLoadPopupOpen, setLoadPopupOpen] = useState(false);
  const [titleSet, setTitleSet] = useState(false);
  const [userID, setUserID] = useState('');
  const [userIDs, setUserIDs] = useState([]);
  const autoSaveInterval = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const loadedIDRef = useRef('');
  const [generatePopup, setGeneratePopup] = useState(false);
  const [draftNote, setDraftNote] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(null);
  const [loadingIntro, setLoadingIntro] = useState(false);
  const [loadingObj, setLoadingObj] = useState(false);
  const [publishable, setPublishable] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [preview, setPreview] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [approval, setApproval] = useState(false);
  const [inApproval, setInApproval] = useState(false);

  const openApproval = () => {
    setApproval(true);
  }

  const closeApproval = () => {
    setApproval(false);
  }

  const closePreview = () => {
    setPreview(false);
  }

  const [rewriteHistory, setRewriteHistory] = useState({
    intorduction: [],
    courseObjectives: []
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


  const AiRewriteIntro = async () => {
    try {
      const prompt = formData.intorduction;

      pushAiRewriteHistory('intorduction');
      setLoadingIntro(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatInduction/intro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt }),
      });

      const { response: newText } = await response.json();
      setLoadingIntro(false);
      setFormData(fd => ({ ...fd, intorduction: newText }));
    } catch (error) {
      setLoadingIntro(false);
      console.error('Error saving data:', error);
    }
  }

  const AiRewriteObjectives = async () => {
    try {
      const prompt = formData.courseObjectives;

      pushAiRewriteHistory('courseObjectives');
      setLoadingObj(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatInduction/objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt }),
      });

      const { response: newText } = await response.json();
      setLoadingObj(false);
      setFormData(fd => ({ ...fd, courseObjectives: newText }));
    } catch (error) {
      setLoadingObj(false);
    }
  }

  const objectUrlCacheRef = useRef(new Map()); // fileId -> objectURL

  function revokeAllObjectUrls() {
    for (const url of objectUrlCacheRef.current.values()) URL.revokeObjectURL(url);
    objectUrlCacheRef.current.clear();
  }

  async function hydrateDraftMediaPreviews(draft) {
    const apiBase = process.env.REACT_APP_URL;
    const token = localStorage.getItem("token") || "";

    // helper: fetch blob once per fileId and cache an object URL
    const fetchPreview = async (fileId, fallbackType = "") => {
      const cached = objectUrlCacheRef.current.get(fileId);
      if (cached) return { url: cached, mime: fallbackType || "" };

      const url = `${apiBase}/api/visitorDrafts/mediaNew/${encodeURIComponent(fileId)}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`media ${fileId} ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      objectUrlCacheRef.current.set(fileId, objUrl);
      return { url: objUrl, mime: blob.type || fallbackType || "" };
    };

    const jobs = [];

    for (const mod of draft.courseModules || []) {
      for (const topic of mod.topics || []) {
        for (const slide of topic.slides || []) {
          // --- MIGRATE legacy single-media -> array ---
          if (!Array.isArray(slide.mediaItems)) {
            if (slide.media?.fileId) {
              slide.mediaItems = [{ media: { ...slide.media } }];
            } else {
              slide.mediaItems = [];
            }
            // keep the legacy field around only if you still read it elsewhere; otherwise clear:
            slide.media = undefined;
          }

          // hydrate each media item slot
          slide.mediaItems = (slide.mediaItems || []).map((it) => {
            const m = it?.media;
            // normalize structure so callers don't crash
            const next = { media: m || null, mediaFile: null, mediaPreview: null, mediaType: "" };

            if (!m?.fileId) {
              // empty slot
              return next;
            }

            // schedule fetch/hydration
            jobs.push(
              (async () => {
                try {
                  const { url, mime } = await fetchPreview(m.fileId, m.contentType || "");
                  next.mediaPreview = url;
                  next.mediaType = mime;
                } catch (err) {
                  console.warn("Hydrate media failed:", m.fileId, err.message);
                  next.mediaPreview = null;
                  next.mediaType = "";
                }
              })()
            );

            return next;
          });
        }
      }
    }

    await Promise.all(jobs);
    return draft;
  }

  // Clean up created ObjectURLs when the component unmounts or when you load a different draft
  useEffect(() => {
    return () => revokeAllObjectUrls();
  }, []);

  const openWorkflow = () => {
    setShowWorkflow(true);
  }

  const closeWorkflow = () => {
    setShowWorkflow(false);
  }

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

  const confirmSaveAs = async (newTitle) => {
    // apply the new title, clear loadedID, then save
    const me = userIDRef.current;
    const newFormData = {
      ...formDataRef.current,        // your current formData
      courseTitle: newTitle,             // override title
    };

    setFormData(newFormData);
    formDataRef.current = newFormData;

    setUserIDs([me]);
    userIDsRef.current = [me];

    loadedIDRef.current = '';
    setLoadedID('');

    const newId = await saveData();           // <-- returns the new draft id
    if (newId) {
      await loadData(newId);
    }

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

  function buildDraftFormData(currentForm) {
    // deep clone so we can mutate a wire copy
    const wire = structuredClone(currentForm);
    const fd = new FormData();

    // walk modules → topics → slides; collect files
    for (const mod of wire.courseModules || []) {
      for (const topic of mod.topics || []) {
        for (const slide of topic.slides || []) {
          slide.mediaItems = (slide.mediaItems || []).map((it) => {
            if (!it) return { media: null };   // preserve empty slot safely
            const f = it.mediaFile;
            if (f instanceof File) {
              const fileId = it.media?.fileId || crypto.randomUUID();
              fd.append(`files[${fileId}]`, f, f.name);
              return {
                ...it,
                media: { fileId, filename: f.name, contentType: f.type, size: f.size },
                mediaFile: undefined,          // remove transient
                mediaPreview: undefined,       // not sent
              };
            }
            return { ...it, mediaFile: undefined, mediaPreview: undefined };
          });
        }
      }
    }

    // You already send other wrapper data; mirror your current payload shape
    const payload = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: wire,                       // the cleaned form
      userIDs: userIDsRef.current,
      creator: userIDRef.current,
      updater: null,
      dateUpdated: null
    };

    fd.append("draft", JSON.stringify(payload)); // <- string, not Blob
    return fd;
  }

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
    if (formData.courseTitle !== "") {
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
          autoClose: 1500, // 1.5 seconds
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

  async function saveData() {
    if (readOnly) return;
    const fd = buildDraftFormData(formDataRef.current);

    const res = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/safe`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` },
      body: fd
    });
    const result = await res.json();
    if (result.id) { setLoadedID(result.id); loadedIDRef.current = result.id; }
    return result.id || null;
  }


  async function updateData(selectedUserIDs) {
    if (readOnly) return;
    const wire = structuredClone(formDataRef.current);
    const fd = new FormData();

    const payload = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: wire,
      userIDs: selectedUserIDs,
      updater: userIDRef.current,
      dateUpdated: new Date().toISOString(),
      userID
    };

    for (const mod of wire.courseModules || []) {
      for (const topic of mod.topics || []) {
        for (const slide of topic.slides || []) {
          slide.mediaItems = (slide.mediaItems || []).map((it) => {
            const f = it.mediaFile;
            if (f instanceof File) {
              const fileId = it.media?.fileId || crypto.randomUUID();
              fd.append(`files[${fileId}]`, f, f.name);
              return {
                ...it,
                media: { fileId, filename: f.name, contentType: f.type, size: f.size },
                mediaFile: undefined,          // remove transient
                mediaPreview: undefined,       // not sent
              };
            }
            return { ...it, mediaFile: undefined, mediaPreview: undefined };
          });
        }
      }
    }

    fd.append("draft", JSON.stringify(payload));

    const res = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/modifySafe/${loadedIDRef.current}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd
    });

    if (!res.ok) {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.success("Failure when saving draft", {
        closeButton: true,
        autoClose: 800,
        style: { textAlign: "center" }
      });
    }
  }

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
      openApproval();  // Call your function when the form is valid
    }
  };

  const handleApproveClick = () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields marked by a *", {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });
    } else {
      approveDraft();  // Call your function when the form is valid
    }
  };

  const approveDraft = async () => {
    const dataToStore = {
      draftID: loadedIDRef.current
    };

    setLoading(true);
    updateData(userIDsRef.current);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/approve-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Induction Successfully Approved.`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      setReadOnly(true);
      setLoading(false);

      if (data.fullyApproved) {
        handlePublish()
      }
    } catch (error) {
      console.error("Error generating document:", error);
      setLoading(false);
    }
  };

  const loadData = async (loadID) => {
    try {
      setLoadingDraft(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/load/${loadID}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } // if your load route is protected
      });
      const storedData = await response.json();

      if (!response.ok) {
        setLoadingDraft(false);
        return;
      }

      setUsedAbbrCodes(storedData.usedAbbrCodes || []);
      setUsedTermCodes(storedData.usedTermCodes || []);
      setUserIDs(storedData.userIDs || []);
      console.log(storedData)
      setPublishable(storedData.publishable);

      const rawForm = storedData.formData || {};
      const normalizedForm = {
        ...rawForm,
        supportingDocuments: Array.isArray(rawForm.supportingDocuments) ? rawForm.supportingDocuments : []
      };

      // IMPORTANT: hydrate media previews for any saved files
      revokeAllObjectUrls(); // clear any previous draft's object URLs
      const hydrated = await hydrateDraftMediaPreviews(normalizedForm);

      setFormData(hydrated);
      setTitleSet(true);
      loadedIDRef.current = loadID;
      setLoadedID(loadID);
      setReadOnly(storedData.readOnly);
      setInApproval(storedData.statusApproval);

      setTimeout(() => {
        setLoadingDraft(false);
      }, 2000);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingDraft(false);
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
    courseTitle: "",
    intorduction: "",
    courseObjectives: "",
    abbrRows: [],
    termRows: [],
    references: [],
    courseSummary: "",
    courseOutline: "",
    additionalResources: [],
    chapters: [],
    summary: "",
    courseOutline: {
      department: "",
      duration: "",
      audience: "",
      table: []
    },
    assessment: [
      { id: uuidv4(), question: "", answer: "", options: ["", "", ""] }
    ]
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
    if (!autoSaveInterval.current && formData.courseTitle.trim() !== "") {
      console.log("✅ Auto-save interval set");

      autoSaveInterval.current = setInterval(() => {
        console.log("⏳ Auto-saving...");
        autoSaveDraft();
      }, 120000);
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
        autoSaveInterval.current = null;
        console.log("🧹 Auto-save interval cleared");
      }
    };
  }, [formData.courseTitle]);

  const autoSaveDraft = () => {
    if (readOnly) return;
    if (formData.courseTitle.trim() === "") return;
    if (preview) return;

    if (loadedIDRef.current === '') {
      saveData();
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
      updateData(userIDsRef.current);
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

  const updateRefRows = (newRef) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      references: newRef, // Update procedureRows with new data
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    return newErrors;

    if (!formData.courseTitle) newErrors.title = true;
    if (!formData.documentType) newErrors.documentType = true;
    if (!formData.aim) newErrors.aim = true;
    if (!formData.scope) newErrors.scope = true;
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

      setUserID(decodedToken.userId);
      setUserIDs([decodedToken.userId]);
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "courseTitle" && e.target.value.trim() !== "") {
      setTitleSet(true); // Enable auto-save only after title is entered
    }
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

  const handleGeneratePDF = async () => {
    const dataToStore = {
      usedAbbrCodes,       // your current state values
      usedTermCodes,
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-docx`, {
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

  const handlePublish = async () => {
    const dataToStore = {
      usedAbbrCodes,       // your current state values
      usedTermCodes,
      formData,
      userID,
      draftID: loadedIDRef.current
    };

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/publish-induction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      toast.success(`Induction Published`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      setLoading(false);

      setTimeout(() => {
        navigate('/FrontendDMS/generatedInductionInfo');
      }, 1000);
    } catch (error) {
      console.error("Error generating document:", error);
      setLoading(false);
    }
  };

  const handlePublishApprovalFlow = async (approversValue) => {
    const dataToStore = {
      draftID: loadedIDRef.current,
      approvers: approversValue
    };

    setLoading(true);
    updateData(userIDsRef.current);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/start-approval-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Induction Publishing Approval Started.`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      if (!data.currentApprover) {
        setReadOnly(true)
      }

      setInApproval(data.approvalStatus);

      setLoading(false);
    } catch (error) {
      console.error("Error generating document:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id === 'new') {
      console.log("New draft, not loading existing data.");
      return;
    }
    loadData(id);
  }, [id]);

  const openPreview = async () => {
    await updateData(userIDsRef.current);
    setPreview(true);
  }

  return (
    <div className="file-create-container">
      {isSidebarVisible && (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
            <p className="logo-text-um" onClick={() => console.log(formData)}>Training Management</p>
          </div>

          <div className="button-container-create">
            <button className="but-um" onClick={() => navigate("/FrontendDMS/inductionDrafts")} style={{ height: "62px" }}>
              <div className="button-content">
                <span className="button-logo-custom" aria-hidden="true">
                  <FontAwesomeIcon icon={faFolderOpenSolid} className="icon-base-draft" />
                  <FontAwesomeIcon icon={faArrowUp} className="icon-badge-draft" />
                </span>
                <span className="button-text">Saved Drafts</span>
              </div>
            </button>
            <button className="but-um" onClick={() => navigate("/FrontendDMS/generatedInductionInfo")}>
              <div className="button-content">
                <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                <span className="button-text">Published Visitor Induction</span>
              </div>
            </button>
            <div className="horizontal-divider-with-icon">
              <hr />
              <div className="divider-icon">
                <FontAwesomeIcon icon={faInfo} onClick={openWorkflow} />
              </div>
              <hr />
            </div>

            {loadedIDRef.current && (<button className="but-um" style={{ marginTop: "10px", height: "62px" }} onClick={openPreview}>
              <div className="button-content" >
                <FontAwesomeIcon icon={faEye} className="button-logo-custom" />
                <span className="button-text">Preview Visitor Induction</span>
              </div>
            </button>)}
          </div>

          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/tmsCreateCourse2.svg`} alt="Control Attributes" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{"Develop Visitor Induction"}</p>
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
      {isLoadPopupOpen && <LoadIndcutionDraftPopup isOpen={isLoadPopupOpen} onClose={closeLoadPopup} setLoadedID={setLoadedID} loadData={loadData} userID={userID} />}

      <div className="main-box-create">
        <div className="top-section-create-page">
          <div className="icons-container-create-page">
            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate("/FrontendDMS/visitorInductionHome")} title="Back" />
            </div>

            {!readOnly && (
              <>
                <div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faFloppyDisk} onClick={handleSave} title="Save" />
                </div>

                <div className="burger-menu-icon-risk-create-page-1">
                  <span className="fa-layers fa-fw" style={{ fontSize: "24px" }} onClick={openSaveAs} title="Save As">
                    <FontAwesomeIcon icon={faSave} />
                    <FontAwesomeIcon
                      icon={faPen}
                      transform="shrink-6 down-5 right-7"
                      color="gray"
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

                {!inApproval && canIn(access, "TMS", ["systemAdmin"]) && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faUpload} onClick={handlePubClick} className={`${(!loadedID) ? "disabled-share" : ""}`} title="Publish" />
                </div>)}

                {inApproval && canIn(access, "TMS", ["systemAdmin"]) && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faCheckCircle} onClick={handleApproveClick} className={`${(!loadedID) ? "disabled-share" : ""}`} title="Approve Draft" />
                </div>)}
              </>
            )}
          </div>

          <div className="spacer"></div>

          <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} />
        </div>

        <div className={`scrollable-box`}>
          {loadingDraft && (
            <div className="file-info-loading" role="status" aria-live="polite" aria-label="Loading">
              <div className="file-info-loading__spinner" />
              <div className="file-info-loading__text">Loading Induction Draft</div>
            </div>
          )}

          {!loadingDraft && (
            <>
              {readOnly && (<div className="input-row">
                <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white" }}>
                  <strong>Read-only mode:</strong> This document is currently in its publishing phase and cannot be edited at this time.
                </div>
              </div>)}

              <div className="input-row">
                <div className={`input-box-title ${errors.title ? "error-create" : ""}`} style={{ marginBottom: "0px" }}>
                  <h3 className="font-fam-labels" onClick={() => console.log(formData)}>Title <span className="required-field">*</span></h3>
                  <div className="input-group-cpt">
                    <input
                      spellcheck="true"
                      style={{ fontSize: "14px" }}
                      type="text"
                      name="courseTitle"
                      className="font-fam title-input"
                      value={formData.courseTitle}
                      readOnly={readOnly}
                      onChange={handleInputChange}
                      placeholder="Insert Visitor Induction Title"
                    />
                  </div>
                </div>
              </div>

              <div className="input-row">
                <div className={`input-box-aim-cp ${errors.aim ? "error-create" : ""}`}>
                  <h3 className="font-fam-labels">Introduction <span className="required-field">*</span></h3>
                  <textarea
                    style={{ fontSize: "14px" }}
                    spellcheck="true"
                    name="intorduction"
                    className="aim-textarea font-fam expanding-textarea"
                    value={formData.intorduction}
                    onChange={handleInputChange}
                    readOnly={readOnly}
                    rows="5"
                    placeholder="Insert Visitor Induction Introduction"
                  />

                  {!readOnly && (
                    <>
                      {loadingIntro ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-ibra spin-animation" />) : (
                        <FontAwesomeIcon
                          icon={faMagicWandSparkles}
                          className="aim-textarea-icon-ibra"
                          title="AI Rewrite"
                          style={{ fontSize: "15px" }}
                          onClick={() => AiRewriteIntro()}
                        />
                      )}

                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        className="aim-textarea-icon-ibra-undo"
                        title="Undo AI Rewrite"
                        onClick={() => undoAiRewrite('intorduction')}
                        style={{
                          marginLeft: '8px',
                          opacity: rewriteHistory.intorduction.length ? 1 : 0.3,
                          cursor: rewriteHistory.intorduction.length ? 'pointer' : 'not-allowed',
                          fontSize: "15px"
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="input-row">
                <div className={`input-box-aim-cp ${errors.scope ? "error-create" : ""}`}>
                  <h3 className="font-fam-labels">Objectives <span className="required-field">*</span></h3>
                  <textarea
                    style={{ fontSize: "14px" }}
                    spellcheck="true"
                    name="courseObjectives"
                    className="aim-textarea font-fam expanding-textarea"
                    value={formData.courseObjectives}
                    readOnly={readOnly}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="The objective of the visitor induction is to: "
                  />

                  {!readOnly && (
                    <>
                      {loadingObj ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-ibra spin-animation" />) : (
                        <FontAwesomeIcon
                          icon={faMagicWandSparkles}
                          className="aim-textarea-icon-ibra"
                          title="AI Rewrite"
                          style={{ fontSize: "15px" }}
                          onClick={() => AiRewriteObjectives()}
                        />
                      )}

                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        className="aim-textarea-icon-ibra-undo"
                        title="Undo AI Rewrite"
                        onClick={() => undoAiRewrite('courseObjectives')}
                        style={{
                          marginLeft: '8px',
                          opacity: rewriteHistory.courseObjectives.length ? 1 : 0.3,
                          cursor: rewriteHistory.courseObjectives.length ? 'pointer' : 'not-allowed',
                          fontSize: "15px"
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              <AbbreviationTable formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setErrors={setErrors} readOnly={readOnly} />
              <TermTable formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setErrors={setErrors} readOnly={readOnly} />
              <InductionContent formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <InductionOutline formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <InductionSummary formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <InductionAssessment formData={formData} setFormData={setFormData} readOnly={readOnly} />
            </>
          )}
        </div>
        {isSaveAsModalOpen && (<SaveAsInductionPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.courseTitle} type={""} userID={userID} create={true} />)}
        {generatePopup && (<GenerateDraftPopup deleteDraft={handleGeneratePDF} closeModal={closeGenerate} cancel={cancelGenerate} />)}
        {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
        {showWorkflow && (<DocumentWorkflow setClose={closeWorkflow} />)}
        {preview && (<InductionPreviewPage draftID={loadedIDRef.current} closeModal={closePreview} />)}
        {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
      </div>
      <ToastContainer />
    </div>
  );
};

export default InductionCreationPage;