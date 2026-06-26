import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faArrowLeft, faShareNodes, faUpload, faRotateRight, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight, faInfo, faL, faMagicWandSparkles, faEye, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons";
import { v4 as uuidv4 } from "uuid";
import InductionContent from "../VisitorsInduction/InductionCreation/InductionContent";
import InductionOutline from "../VisitorsInduction/InductionCreation/InductionOutline";
import ApproversPopup from "../VisitorsInduction/InductionCreation/ApproversPopup";
import AbbreviationTable from "../CreatePage/AbbreviationTable";
import TermTable from "../CreatePage/TermTable";
import TopBarDD from "../Notifications/TopBarDD";
import { canIn, getCurrentUser } from "../../utils/auth";
import SharePage from "../CreatePage/SharePage";
import DocumentWorkflow from "../Popups/DocumentWorkflow";
import DraftPopup from "../Popups/DraftPopup";
import OnlineTrainingSummary from "./OnlineTrainingSummary";
import OnlineTrainingCoursePreviewPage from "./OnlineTrainingCoursePreviewPage";
import SaveAsOnlineTrainingPopup from "./SaveAsOnlineTrainingPopup";
import OTCourseAssessment from "./OTCourseAssessment";
import CourseResourceTable from "./CourseResourceTable";
import SaveConfirmationPopup from "../CreatePage/SaveConfirmationPopup";

const OnlineCourseCreationPage = () => {
  const id = useParams().id || '';
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
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
  const [owner, setOwner] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [isPublisher, setIsPublisher] = useState(false);

  const readOnlyRef = useRef(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [saveConfirmTrigger, setSaveConfirmTrigger] = useState("back");
  const pendingActionRef = useRef(null);

  const stopAutoSave = () => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
      autoSaveInterval.current = null;
    }
  };

  const enableReadOnlyImmediately = () => {
    readOnlyRef.current = true;
    setReadOnly(true);
    stopAutoSave();
  };

  const SHARE_ROLES = ["collaborator", "viewer", "publisher"];
  const ALL_ALLOWED_ROLES = ["owner", ...SHARE_ROLES];

  const normalizeSharedUsers = (value, ownerId) => {
    const rawItems = Array.isArray(value)
      ? value
      : value == null
        ? []
        : [value];

    const mapped = rawItems
      .map((item) => {
        if (typeof item === "string") {
          return {
            userId: item,
            role: item === ownerId ? "owner" : "collaborator"
          };
        }

        if (item && typeof item === "object") {
          const userId =
            item.userId ||
            item.userID ||
            item._id ||
            item.id ||
            "";

          if (!userId) return null;

          let role = String(item.role || "").toLowerCase().trim();

          if (!ALL_ALLOWED_ROLES.includes(role)) {
            role = userId === ownerId ? "owner" : "collaborator";
          }

          if (userId === ownerId) {
            role = "owner";
          }

          return { userId, role };
        }

        return null;
      })
      .filter(Boolean);

    const seen = new Set();
    const deduped = [];

    mapped.forEach((entry) => {
      if (seen.has(entry.userId)) return;
      seen.add(entry.userId);
      deduped.push(entry);
    });

    if (ownerId && !deduped.some((entry) => entry.userId === ownerId)) {
      deduped.unshift({ userId: ownerId, role: "owner" });
    }

    return deduped.map((entry) => ({
      userId: entry.userId,
      role: entry.userId === ownerId ? "owner" : entry.role
    }));
  };
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

  /*
  async function hydrateDraftMediaPreviews(draft) {
    const apiBase = process.env.REACT_APP_URL;
    const token = localStorage.getItem("token") || "";

    // helper: fetch blob once per fileId and cache an object URL
    const fetchPreview = async (fileId, fallbackType = "") => {
      const cached = objectUrlCacheRef.current.get(fileId);
      if (cached) return { url: cached, mime: fallbackType || "" };

      const url = `${apiBase}/api/onlineTrainingCourses/loadMedia/${encodeURIComponent(fileId)}`;
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
  */

  async function hydrateDraftMediaPreviews(draft) {
    const apiBase = process.env.REACT_APP_URL;
    const token = localStorage.getItem("token") || "";

    // helper: fetch SAS url once per fileId and cache it
    const fetchPreview = async (fileId, fallbackType = "") => {
      const cached = objectUrlCacheRef.current.get(fileId);
      if (cached) return { url: cached, mime: fallbackType || "" };

      const endpoint = `${apiBase}/api/onlineTrainingCourses/loadMediaOptimized/${encodeURIComponent(fileId)}`;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error(`media ${fileId} ${res.status}`);

      // NEW: backend returns JSON with a SAS url
      const data = await res.json();

      const sasUrl = data?.url;
      if (!sasUrl) throw new Error(`media ${fileId} missing url`);

      objectUrlCacheRef.current.set(fileId, sasUrl);

      return {
        url: sasUrl,
        mime: data?.contentType || fallbackType || ""
      };
    };

    const jobs = [];

    for (const mod of draft.courseModules || []) {
      for (const topic of mod.topics || []) {
        for (const slide of topic.slides || []) {
          // --- MIGRATE legacy single-media -> array (keep your current behavior) ---
          if (!Array.isArray(slide.mediaItems)) {
            if (slide.media?.fileId) {
              slide.mediaItems = [{ media: { ...slide.media } }];
            } else {
              slide.mediaItems = [];
            }
            slide.media = undefined;
          }

          // hydrate each media item slot
          slide.mediaItems = (slide.mediaItems || []).map((it) => {
            const m = it?.media;

            // normalize structure so callers don't crash
            const next = {
              media: m || null,
              mediaFile: null,
              mediaPreview: null,
              mediaType: ""
            };

            if (!m?.fileId) return next;

            jobs.push(
              (async () => {
                try {
                  const { url, mime } = await fetchPreview(m.fileId, m.contentType || "");
                  next.mediaPreview = url;   // <- SAS url
                  next.mediaType = mime;
                } catch (err) {
                  console.warn("Hydrate media failed:", m.fileId, err?.message || err);
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

    const normalizedOwnerOnly = normalizeSharedUsers([], me);
    setUserIDs(normalizedOwnerOnly);
    userIDsRef.current = normalizedOwnerOnly;

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

  const openShare = () => {
    if (loadedIDRef.current || loadedID) {
      setShare(true);
    } else {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.warn("Please save a draft before sharing.", {
        closeButton: true,
        autoClose: 800,
        style: {
          textAlign: 'center'
        }
      });
    }
  };

  function buildDraftFormData(currentForm, normalizedSharedUsers) {
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

    wire.resources = (wire.resources || []).map((r, idx) => {
      const f = r?.file;
      if (f instanceof File) {
        const fileId = r.media?.fileId || crypto.randomUUID();
        fd.append(`files[${fileId}]`, f, f.name);

        return {
          ...r,
          nr: idx + 1,
          name: r.name || f.name,
          media: { fileId, filename: f.name, contentType: f.type, size: f.size },
          file: undefined
        };
      }

      return { ...r, nr: idx + 1, file: undefined };
    });

    const payload = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: wire,
      userIDs: normalizedSharedUsers,
      creator: userIDRef.current,
      updater: null,
      dateUpdated: null
    };

    fd.append("draft", JSON.stringify(payload)); // <- string, not Blob
    return fd;
  }

  const closeShare = () => { setShare(false); };

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

    const normalizedSharedUsers = normalizeSharedUsers(
      userIDsRef.current,
      userIDRef.current
    );

    const fd = buildDraftFormData(formDataRef.current, normalizedSharedUsers);

    const res = await fetch(`${process.env.REACT_APP_URL}/api/onlineTrainingCourses/safe`, {
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

    const normalizedSharedUsers = normalizeSharedUsers(
      selectedUserIDs,
      userIDRef.current
    );

    const payload = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: wire,
      userIDs: normalizedSharedUsers,
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

    wire.resources = (wire.resources || []).map((r, idx) => {
      const f = r?.file;
      if (f instanceof File) {
        const fileId = r.media?.fileId || crypto.randomUUID();
        fd.append(`files[${fileId}]`, f, f.name);

        return {
          ...r,
          nr: idx + 1,
          name: r.name || f.name,
          media: { fileId, filename: f.name, contentType: f.type, size: f.size },
          file: undefined
        };
      }
      return { ...r, nr: idx + 1, file: undefined };
    });

    fd.append("draft", JSON.stringify(payload));

    const res = await fetch(`${process.env.REACT_APP_URL}/api/onlineTrainingCourses/modifySafe/${loadedIDRef.current}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd
    });

    if (!res.ok) {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error("Failure when saving draft", {
        closeButton: true,
        autoClose: 800,
        style: { textAlign: "center" }
      });

      return false;
    }

    return true;
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
    stopAutoSave();

    const saved = await updateData(userIDsRef.current);
    if (saved === false) {
      setLoading(false);
      return;
    }

    enableReadOnlyImmediately();

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/onlineTrainingCourses/approve-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Course successfully approved. The course is now read-only.`, {
        closeButton: true,
        autoClose: 1200,
        style: {
          textAlign: 'center'
        }
      });

      enableReadOnlyImmediately();
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

      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/load/${loadID}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );

      const storedData = await response.json();

      if (!response.ok) {
        setLoadingDraft(false);
        return;
      }

      const draftData = storedData.draft || {};

      console.log("Loaded draft data:", draftData);

      const ownerId =
        draftData.creator ||
        draftData.userID ||
        userIDRef.current;

      const normalizedSharedUsers = normalizeSharedUsers(
        draftData.userIDs,
        ownerId
      );

      setUsedAbbrCodes(draftData.usedAbbrCodes || []);
      setUsedTermCodes(draftData.usedTermCodes || []);
      setUserIDs(normalizedSharedUsers);
      userIDsRef.current = normalizedSharedUsers;

      setPublishable(storedData.publishable);

      const rawForm = draftData.formData || {};
      const normalizedForm = {
        ...rawForm,
        supportingDocuments: Array.isArray(rawForm.supportingDocuments)
          ? rawForm.supportingDocuments
          : [],
        resources: Array.isArray(rawForm.resources)
          ? rawForm.resources
          : []
      };

      const isOwner = storedData.isOwner || false;
      const isViewer = storedData.isViewer || false;
      const isPublisher = storedData.isPublisher || false;

      revokeAllObjectUrls();
      const hydrated = await hydrateDraftMediaPreviews(normalizedForm);

      setFormData(hydrated);
      setTitleSet(true);
      loadedIDRef.current = loadID;
      setLoadedID(loadID);

      setInApproval(Boolean(storedData.statusApproval));

      if (storedData.statusApproval && storedData.readOnly) {
        enableReadOnlyImmediately();
      } else {
        setReadOnly(storedData.readOnly);
      }

      setOwner(isOwner);
      setIsViewer(isViewer);
      setIsPublisher(isPublisher);

      setTimeout(() => {
        setLoadingDraft(false);
      }, 2000);

    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingDraft(false);
    }
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
    resources: [],
    courseOutline: {
      department: "",
      duration: "",
      audience: "",
      table: []
    },
    assessment: [
      { id: uuidv4(), type: "MCQ", question: "", answer: "", options: ["", "", ""] }
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
    readOnlyRef.current = readOnly;

    if (readOnly) {
      stopAutoSave();
    }
  }, [readOnly]);

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
    if (
      !readOnlyRef.current &&
      !autoSaveInterval.current &&
      formData.courseTitle.trim() !== ""
    ) {
      autoSaveInterval.current = setInterval(() => {
        autoSaveDraft();
      }, 120000);
    }

    return () => {
      stopAutoSave();
    };
  }, [formData.courseTitle, readOnly]);

  const autoSaveDraft = () => {
    if (readOnlyRef.current) return;
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

  const validateForm = () => {
    const newErrors = {};
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
      setUserIDs(normalizeSharedUsers([], decodedToken.userId));
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "courseTitle" && e.target.value.trim() !== "") {
      setTitleSet(true); // Enable auto-save only after title is entered
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/onlineTrainingCourses/publish-course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      toast.success(`Course Published`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      setLoading(false);

      setTimeout(() => {
        navigate('/FrontendDMS/onlinePublishedCourses');
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
    stopAutoSave();

    const saved = await updateData(userIDsRef.current);
    if (saved === false) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/onlineTrainingCourses/start-approval-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`The approval process has started for this online training course.`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      if (!data.currentApprover) {
        enableReadOnlyImmediately();
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

  const requiresSavePrompt = () => !readOnlyRef.current && !!loadedIDRef.current;

  const openSaveConfirm = (triggerType, action) => {
    setSaveConfirmTrigger(triggerType);
    pendingActionRef.current = action;
    setIsSaveConfirmOpen(true);
  };

  const handleBack = () => {
    if (!requiresSavePrompt()) { navigate("/FrontendDMS/onlineTrainingHome"); return; }
    openSaveConfirm("back", () => navigate("/FrontendDMS/onlineTrainingHome"));
  };

  const handleHomeNav = () => {
    if (!requiresSavePrompt()) { navigate("/FrontendDMS/home"); return; }
    openSaveConfirm("home", () => navigate("/FrontendDMS/home"));
  };

  const handleConfirmSave = async () => {
    if (loadedIDRef.current) {
      await updateData(userIDsRef.current);
    } else {
      await saveData();
    }
    toast.dismiss();
    toast.clearWaitingQueue();
    toast.success("Draft has been saved.", {
      closeButton: true,
      autoClose: 1200,
      style: { textAlign: "center" }
    });
    setTimeout(() => {
      setIsSaveConfirmOpen(false);
      if (pendingActionRef.current) pendingActionRef.current();
      pendingActionRef.current = null;
    }, 1500);
  };

  const handleDiscard = () => {
    setIsSaveConfirmOpen(false);
    if (pendingActionRef.current) pendingActionRef.current();
    pendingActionRef.current = null;
  };

  const handleCancelSave = () => {
    setIsSaveConfirmOpen(false);
    pendingActionRef.current = null;
  };

  return (
    <div className="file-create-container">
      {isSidebarVisible && (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={handleHomeNav} title="Home" />
            <p className="logo-text-um" onClick={() => console.log(formData)}>Training Management</p>
          </div>

          <div className="button-container-create">
            <button className="but-um" onClick={() => navigate("/FrontendDMS/onlineDraftCourses")}>
              <div className="button-content">
                <span className="button-logo-custom" aria-hidden="true">
                  <FontAwesomeIcon icon={faFolderOpenSolid} className="icon-base-draft" />
                  <FontAwesomeIcon icon={faArrowUp} className="icon-badge-draft" />
                </span>
                <span className="button-text">Saved Drafts</span>
              </div>
            </button>
            <button className="but-um" onClick={() => navigate("/FrontendDMS/onlinePublishedCourses")}>
              <div className="button-content">
                <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                <span className="button-text">Published Courses</span>
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
                <span className="button-text">Preview Course</span>
              </div>
            </button>)}
          </div>

          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/tmsCreateCourse2.svg`} alt="Control Attributes" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{"Develop Course"}</p>
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

      <div className="main-box-create">
        <div className="top-section-create-page">
          <div className="icons-container-create-page">
            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faArrowLeft} onClick={handleBack} title="Back" />
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

                {owner && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faShareNodes} className={`${!loadedID ? "disabled-share" : ""}`} title="Share" onClick={openShare} />
                </div>)}

                {!isViewer && !inApproval && owner && canIn(access, "TMS", ["systemAdmin"]) && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faUpload} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handlePubClick} title="Publish" />
                </div>)}

                {inApproval && canIn(access, "TMS", ["systemAdmin"]) && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faCheckCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleApproveClick} title="Approve Draft" />
                </div>)}
              </>
            )}
          </div>

          <div className="spacer"></div>

          <TopBarDD refreshable={false} canIn={canIn} access={access} menu={"1"} create={true} onHome={handleHomeNav} />
        </div>

        <div className={`scrollable-box`}>
          {loadingDraft && (
            <div className="file-info-loading" role="status" aria-live="polite" aria-label="Loading">
              <div className="file-info-loading__spinner" />
              <div className="file-info-loading__text">Loading Course Draft</div>
            </div>
          )}

          {(isViewer && readOnly) && (<div className="input-row">
            <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#FFFF89", color: "black", fontWeight: "bold" }}>
              View-only access. Please contact the owner to request edit access.
            </div>
          </div>)}

          {!loadingDraft && (
            <>
              {!isViewer && readOnly && (<div className="input-row">
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
                      placeholder="Insert Course Title"
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
                    placeholder="Insert Course Introduction"
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
                    placeholder="By the end of this course, participants will be able to:"
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

              <AbbreviationTable collapsible={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setErrors={setErrors} readOnly={readOnly} />
              <TermTable collapsible={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setErrors={setErrors} readOnly={readOnly} />
              <InductionContent collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <InductionOutline collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <OnlineTrainingSummary collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <OTCourseAssessment collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <CourseResourceTable collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} userID={userID} />
            </>
          )}
        </div>
        {isSaveAsModalOpen && (<SaveAsOnlineTrainingPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.courseTitle} type={""} userID={userID} create={true} />)}
        {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
        {showWorkflow && (<DocumentWorkflow setClose={closeWorkflow} />)}
        {preview && (<OnlineTrainingCoursePreviewPage draftID={loadedIDRef.current} closeModal={closePreview} />)}
        {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
      </div>
      <ToastContainer />
      {isSaveConfirmOpen && (
        <SaveConfirmationPopup
          setIsSaveModalOpen={setIsSaveConfirmOpen}
          onConfirmSave={handleConfirmSave}
          onDiscard={handleDiscard}
          onCancel={handleCancelSave}
          draftTitle={formData.courseTitle}
          triggerType={saveConfirmTrigger}
        />
      )}
    </div>
  );
};

export default OnlineCourseCreationPage;