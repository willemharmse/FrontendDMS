import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faCaretLeft, faCaretRight, faChevronLeft, faChevronRight,
    faClipboardList, faInfoCircle, faBookOpen, faClipboard,
    faFolderOpen,
    faDownload,
    faCircleNotch
} from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import TopBar from "../../Notifications/TopBar";
import { toast, ToastContainer } from "react-toastify";
import { saveAs } from "file-saver";
import StartAssessmentPopup from "../../VisitorsInduction/Popups/StartAssessmentPopup";
import IncompleteAssessmentPopup from "../../VisitorsInduction/Popups/IncompleteAssessmentPopup";
import ReviewAssessmentPopup from "../../VisitorsInduction/Popups/ReviewAssessmentPopup";
import HelpPanel from "./HelpPanel";

import AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import StudentCourseStartAssessmentPopup from "./StudentCourseStartAssessmentPopup";
/** Keep slide type names aligned with the editor */
const SLIDE_TYPES = {
    TEXT: "TEXT",
    TEXT_MEDIA: "TEXT_MEDIA",
    MEDIA: "MEDIA",
    MEDIA_GALLERY: "MEDIA_GALLERY",
    TEXT_MEDIA_2X2: "TEXT_MEDIA_2X2",
    MEDIAX2_TEXT: "MEDIAX2_TEXT",
    MEDIA_2X2: "MEDIA_2X2",
    PDF_VIEW: "PDF_VIEW"
};

const StudentCourseViewPage = () => {
    const assessScrollRef = useRef(null);
    const questionRefs = useRef([]);
    const [popupAssessment, setPopupAssessment] = useState(false);
    const [submissionIncomplete, setSubmissionIncomplete] = useState(false);
    const [submissionReview, setSubmissionReview] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [student, setStudent] = useState(null);

    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const [userID, setUserID] = useState('');

    const [viewMode, setViewMode] = useState('outline');

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    const [courseOutline, setCourseOutline] = useState([]);
    const [terms, setTerms] = useState([]);
    const [abbrs, setAbbrs] = useState([]);
    const [user, setUser] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);

    const objectUrlCacheRef = useRef(new Map());
    const mediaTypeCacheRef = useRef(new Map());

    // --- Lazy media loader state ---
    const mediaStatusRef = useRef(new Map()); // fid -> "idle" | "loading" | "ready" | "error"
    const inFlightRef = useRef(new Map());    // fid -> Promise<void>
    const [mediaTick, setMediaTick] = useState(0); // forces re-render when status changes

    const bumpMediaTick = () => setMediaTick(t => t + 1);

    const getMediaStatus = (fid) => mediaStatusRef.current.get(fid) || "idle";

    const setMediaStatus = (fid, status) => {
        const prev = mediaStatusRef.current.get(fid) || "idle";
        if (prev === status) return;              // ✅ prevent useless re-renders
        mediaStatusRef.current.set(fid, status);
        bumpMediaTick();
    };

    /*
    const fetchMediaById = (fid) => {
        if (!fid) return Promise.resolve();
        if (objectUrlCacheRef.current.has(fid)) {
            setMediaStatus(fid, "ready");
            return Promise.resolve();
        }
        const existing = inFlightRef.current.get(fid);
        if (existing) return existing;

        setMediaStatus(fid, "loading");

        const url = `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/loadMedia/${encodeURIComponent(fid)}`;

        const p = fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(async (res) => {
                if (!res.ok) throw new Error(`media ${fid} ${res.status}`);
                const blob = await res.blob();
                const objUrl = URL.createObjectURL(blob);
                objectUrlCacheRef.current.set(fid, objUrl);
                mediaTypeCacheRef.current.set(fid, blob.type || "");
                setMediaStatus(fid, "ready");
            })
            .catch((e) => {
                console.warn("Lazy media load failed:", fid, e?.message || e);
                setMediaStatus(fid, "error");
            })
            .finally(() => {
                inFlightRef.current.delete(fid);
            });

        inFlightRef.current.set(fid, p);
        return p;
    };
    */

    const fetchMediaById = (fid) => {
        if (!fid) return Promise.resolve();
        if (objectUrlCacheRef.current.has(fid)) {
            setMediaStatus(fid, "ready");
            return Promise.resolve();
        }
        const existing = inFlightRef.current.get(fid);
        if (existing) return existing;

        setMediaStatus(fid, "loading");

        const url = `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/loadMediaOptimized/${encodeURIComponent(fid)}`;

        const p = fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(async (res) => {
                if (!res.ok) throw new Error(`media ${fid} ${res.status}`);
                const data = await res.json();

                // Store SAS URL directly instead of object URL
                objectUrlCacheRef.current.set(fid, data.url);
                mediaTypeCacheRef.current.set(fid, data.contentType || "");
                setMediaStatus(fid, "ready");
            })
            .catch((e) => {
                console.warn("Lazy media load failed:", fid, e?.message || e);
                setMediaStatus(fid, "error");
            })
            .finally(() => inFlightRef.current.delete(fid));

        inFlightRef.current.set(fid, p);
        return p;
    };

    const fetchUser = async () => {
        const route = `/api/onlineTrainingStudentManagement/studentInfo/`;
        try {
            const token = sessionStorage.getItem("studentToken");
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            setUser(data.user);
        } catch (error) {
            console.log(error.message);
        }
    };

    const getStudentDetails = async () => {
        const route = `/api/onlineTrainingStudentManagement/student-course/${id}`;
        const token = sessionStorage.getItem("studentToken");

        const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch student");

        const data = await response.json();

        console.log("Fetched student details:", data.student);

        return data.student; // (your backend route returns { student })
    };

    const loadEnrollment = async () => {
        try {
            const token = sessionStorage.getItem("studentToken"); // adjust if you store it differently
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/student/enrollment/${id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();
            const p = readPercentFromBackend(data?.enrollment);
            setProgress(data?.enrollment?.passed ? 100 : p);
            if (data?.enrollment?.passed) { try { persistProgress(100); } catch { } }

            // total items for mapping (slides + assessment if present)
            const slidesCount = (course?.formData?.courseModules || [])
                .flatMap(m => (m.topics || []).flatMap(t => t.slides || []))
                .length + (course?.formData?.assessment?.length ? 1 : 0);

            // Convert percent back to a 0-based "item index"
            const approxItemIdx = Math.round((p / 100) * Math.max(1, slidesCount - 1));

            // Our "currentIndex" is a *slide* index, so cap to last slide (exclude the assessment item)
            const lastSlideIndex = Math.max(0,
                ((course?.formData?.courseModules || [])
                    .flatMap(m => (m.topics || []).flatMap(t => t.slides || [])).length) // slides only
            );
            const initialIdxFromPercent = Math.min(approxItemIdx, Math.max(0, lastSlideIndex - 1));

            highestVisitedIndexRef.current = initialIdxFromPercent || 0;

            if (!res.ok) {
                throw new Error(data?.error || "Failed to load enrollment");
            }

            // ✅ store enrollment in state
            setStudent(data.enrollment);

            console.log("Loaded enrollment:", data.enrollment);
        } catch (e) {
            console.error("Error loading enrollment:", e);
        }
    };

    useEffect(() => {
        loadEnrollment();
        fetchUser();
    }, [id]);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('studentToken') || '';
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const formatDuration = (d) =>
        typeof d === 'number' ? `${d} min` : (d || '');

    // Load course from API (unchanged base flow)
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                const base = process.env.REACT_APP_URL || "";
                const res = await fetch(`${base}/api/onlineTrainingCourses/getCourseData/${id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setCourse(data);
                console.log("Loaded course data:", data);
                setCourseOutline(data?.formData?.courseOutline);
                setAbbrs(data?.formData?.abbrRows);
                setTerms(data?.formData?.termRows);

                setErr('');
            } catch (e) {
                if (e.name !== "AbortError") setErr("Failed to load course.");
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [id, token]);

    const viewModules = course?.formData?.courseModules || [];

    // Topic groups with slide context (new shape, with legacy fallback)
    const topicGroups = useMemo(() => {
        const groups = [];
        viewModules.forEach((mod, mIdx) => {
            const topics = Array.isArray(mod.topics) && mod.topics.length
                ? mod.topics
                : [{ id: `legacy-${mIdx}`, title: "", slides: mod.slides || [] }]; // legacy: treat slides as one topic

            topics.forEach((topic, tIdx) => {
                const slides = (topic.slides || []).map((s, sIdx) => ({
                    ...s,
                    _moduleIndex: mIdx,
                    _topicIndex: tIdx,
                    _slideIndex: sIdx,
                    _moduleTitle: mod?.title || `Module ${mIdx + 1}`,
                    _topicTitle: topic?.title || `Topic ${mIdx + 1}.${tIdx + 1}`,
                    _topicId: topic?.id,
                }));
                groups.push({ mod, mIdx, topic, tIdx, slides });
            });
        });
        return groups;
    }, [viewModules]);

    // Build intro as a pseudo-slide
    const introSlide = course ? {
        type: "INTRO",
        title: "Introduction",
        content: course?.formData?.intorduction || "No introduction provided.",
        objectives: course?.formData?.courseObjectives || "",
        _topicTitle: "Introduction",
        _moduleIndex: -1,
        _topicIndex: -1,
        _slideIndex: 0
    } : null;

    const allSlides = useMemo(() => {
        const slides = topicGroups.flatMap(g => g.slides);
        return introSlide ? [introSlide, ...slides] : slides;
    }, [topicGroups, introSlide]);

    const orderedMediaIds = useMemo(() => {
        const seen = new Set();
        const out = [];

        const pushFid = (fid) => {
            if (!fid || seen.has(fid)) return;
            seen.add(fid);
            out.push(fid);
        };

        for (const s of allSlides) {
            if (!s) continue;

            // legacy
            pushFid(s?.media?.fileId);

            // multi
            if (Array.isArray(s?.mediaItems)) {
                for (const it of s.mediaItems) pushFid(it?.media?.fileId);
            }
        }

        return out;
    }, [allSlides]);

    const hasAssessment = useMemo(() => {
        return Array.isArray(course?.formData?.assessment) && course.formData.assessment.length > 0;
    }, [course?.formData?.assessment]);

    const total = allSlides.length;
    const canBack = currentIndex > 0;
    const canNext = currentIndex < total - 1;
    const currentSlide = total > 0 ? allSlides[currentIndex] : null;

    const mediaIds = useMemo(() => {
        const out = new Set();
        for (const mod of viewModules) {
            for (const topic of mod.topics || []) {
                for (const slide of topic.slides || []) {
                    // legacy single-media
                    const fid = slide?.media?.fileId;
                    if (fid) out.add(fid);

                    // new multi-media
                    if (Array.isArray(slide?.mediaItems)) {
                        for (const it of slide.mediaItems) {
                            const fid2 = it?.media?.fileId;
                            if (fid2) out.add(fid2);
                        }
                    }
                }
            }
        }
        return Array.from(out);
    }, [viewModules]);

    /*
    useEffect(() => {
        let cancelled = false;

        async function hydrate() {
            const jobs = [];
            for (const fid of mediaIds) {
                if (objectUrlCacheRef.current.has(fid)) continue;

                const url = `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/loadMedia/${encodeURIComponent(fid)}`; // <-- new route
                jobs.push(
                    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                        .then(async (res) => {
                            if (!res.ok) throw new Error(`media ${fid} ${res.status}`);
                            const blob = await res.blob();
                            const objUrl = URL.createObjectURL(blob);
                            objectUrlCacheRef.current.set(fid, objUrl);
                            mediaTypeCacheRef.current.set(fid, blob.type || "");
                        })
                        .catch((e) => {
                            console.warn("Hydrate media failed:", fid, e?.message || e);
                        })
                );
            }
            await Promise.all(jobs);
            if (!cancelled) {
                setCourse((prev) => ({ ...(prev || {}) })); // trigger render
            }
        }

        if (mediaIds.length) hydrate();
        return () => { cancelled = true; };
    }, [mediaIds.join(','), token]);
    */

    useEffect(() => {
        if (!orderedMediaIds.length) return;

        const first3 = orderedMediaIds.slice(0, 3);
        first3.forEach(fetchMediaById);
        // no await needed; we just kick them off
    }, [orderedMediaIds.join(","), token]);

    useEffect(() => {
        if (viewMode !== "material") return;
        if (!allSlides.length) return;
        preloadForIndex(currentIndex, 2);
    }, [viewMode, currentIndex, allSlides.length]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            for (const url of objectUrlCacheRef.current.values()) {
                try { URL.revokeObjectURL(url); } catch { }
            }
            objectUrlCacheRef.current.clear();
        };
    }, []);

    const goBack = () => {
        // On first content slide, BACK should go to Outline
        if (viewMode === 'material' && currentIndex === 0) {
            setViewMode('outline');
            return;
        }
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    };
    const goNext = async () => {
        if (!canNext) return;

        const targetIndex = currentIndex + 1;
        setCurrentIndex(targetIndex);

        if (targetIndex > highestVisitedIndexRef.current) {
            highestVisitedIndexRef.current = targetIndex;

            const nextWeighted = computeWeightedProgress();
            if (nextWeighted > progress) {
                setProgress(nextWeighted);
                const { ok, percent } = await persistProgress(nextWeighted);
                if (!ok) setProgress(percent);
            }
        }
    };

    const getNavTitle = (s) => {
        if (!s) return "";
        if (s.type === "INTRO") return "Introduction";
        const base = s._topicTitle || s.title || "Untitled";
        return base;
    };

    const prevSlide = canBack ? allSlides[currentIndex - 1] : null;
    const nextSlide = canNext ? allSlides[currentIndex + 1] : null;

    const moduleFirstSlideIndexMap = useMemo(() => {
        const map = new Map();
        allSlides.forEach((s, i) => {
            if (s && s._moduleIndex != null && s._moduleIndex >= 0) {
                if (!map.has(s._moduleIndex)) map.set(s._moduleIndex, i);
            }
        });
        return map;
    }, [allSlides]);

    const goToModule = (mIdx) => {
        setViewMode('material');
        const target = moduleFirstSlideIndexMap.get(mIdx);
        if (typeof target === 'number') {
            setCurrentIndex(target);
        } else {
            setCurrentIndex(Math.min(1, allSlides.length - 1));
        }
    };

    const goToRecap = () => setViewMode('recap');

    const isLastContentSlide = currentIndex === total - 1;

    useEffect(() => {
        if (viewMode !== "material") return;
        if (!currentSlide) return;

        // ensure current slide media starts loading (if not ready)
        const fids = getSlideFileIds(currentSlide);
        fids.forEach((fid) => {
            if (!fid) return;
            if (!objectUrlCacheRef.current.has(fid) && getMediaStatus(fid) === "idle") {
                fetchMediaById(fid);
            }
        });
    }, [viewMode, currentIndex, currentSlide]);

    const renderMedia = (slide, index = 0, aspectRatio = null) => {
        const item = Array.isArray(slide?.mediaItems)
            ? slide.mediaItems[index]
            : (index === 0 && slide?.media ? { media: slide.media } : null);

        const fid = item?.media?.fileId;
        if (!fid) return null;

        const src = objectUrlCacheRef.current.get(fid);
        const status = getMediaStatus(fid);

        // If not loaded yet, show spinner (and ensure we started loading)
        if (!src) {
            return <MediaSpinner label="Loading slide…" />;
        }

        let type = (item.media?.contentType || mediaTypeCacheRef.current.get(fid) || "").toLowerCase();

        if (!type && item.media?.filename) {
            const n = item.media.filename.toLowerCase();
            if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n)) type = "image/*";
            else if (/\.(mp4|webm|mov|m4v)$/.test(n)) type = "video/*";
            else if (/\.(mp3|wav|m4a|ogg)$/.test(n)) type = "audio/*";
            else if (/\.(pdf)$/.test(n)) type = "pdf"
        }

        const mediaTagStyle = {
            objectFit: "contain",
            display: "block",
            borderRadius: "6px"
        };

        if (aspectRatio) {
            mediaTagStyle.aspectRatio = aspectRatio;
        } else {
        }

        if (type.startsWith("image/")) return <img src={src} alt={item.media?.filename || "image"} style={mediaTagStyle} />;
        if (type.startsWith("video/")) return <video src={src} controls style={{ width: "100%", height: "100%" }} controlsList="nodownload noremoteplayback" disablePictureInPicture disableRemotePlayback onContextMenu={(e) => e.preventDefault()} />;
        if (type.startsWith("audio/")) return (<AudioPlayer
            className="popup-audio"
            src={src}
            layout="horizontal"
            showJumpControls={false}
            customAdditionalControls={[]}
            customVolumeControls={[]}
            customControlsSection={[]}
            autoPlayAfterSrcChange={false}
            preload="metadata"
            customProgressBarSection={[
                RHAP_UI.MAIN_CONTROLS,
                RHAP_UI.CURRENT_TIME,
                RHAP_UI.PROGRESS_BAR,
                RHAP_UI.DURATION,
            ]}
        />);

        if (type.includes("pdf")) {
            return (
                <iframe
                    src={`${src}#toolbar=0&navpanes=0&scrollbar=0`}
                    title="PDF preview"
                    className="courseCont-pdfFrame-view"
                    onContextMenu={(e) => e.preventDefault()}
                />
            );
        }

        return <a href={src} download={item.media?.filename || "file"}>{item.media?.filename || "file"}</a>;
    };

    const SidebarButton = ({ icon, text, onClick, active }) => (
        <button
            className={`but-um-sidebar-button ${active ? "active" : ""}`}
            onClick={onClick}
            style={{ marginBottom: "0px" }}
        >
            <div className="button-content">
                <FontAwesomeIcon icon={icon} className="button-icon" />
                <span className="button-text">{text}</span>
            </div>
        </button>
    );

    const [assessmentAnswers, setAssessmentAnswers] = useState({});

    const [qIndex, setQIndex] = useState(0);
    const totalQuestions = (course?.formData?.assessment || []).length;

    const hasPrevQ = qIndex > 0;
    const hasNextQ = qIndex < Math.max(0, totalQuestions - 1);
    const isLastQ = totalQuestions > 0 && qIndex === totalQuestions - 1;

    const prevQLabel = hasPrevQ ? `Question ${qIndex}` : "";
    const nextQLabel = isLastQ ? "Submit Assessment"
        : (hasNextQ ? `Question ${qIndex + 2}` : "");

    const goPrevQ = () => { if (hasPrevQ) setQIndex(i => i - 1); };
    const goNextQ = () => {
        if (isLastQ) {
            onSubmitClick();
        } else if (hasNextQ) {
            setQIndex(i => i + 1);
        }
    };

    const getStudentToken = () => sessionStorage.getItem("studentToken") || "";
    const getStudentId = () => {
        try {
            const tok = getStudentToken();
            if (!tok) return null;
            const decoded = jwtDecode(tok);
            return decoded?.userId || decoded?.sub || null;
        } catch { return null; }
    };

    const getAnsweredCount = () => {
        return (course?.formData?.assessment || []).reduce((acc, q, i) => {
            const key = q.id || `idx_${i}`;
            const v = assessmentAnswers[key];

            // MCQ answered if number
            if (q.type !== "TEXT") return acc + (typeof v === "number" ? 1 : 0);

            // TEXT answered if non-empty string
            return acc + (typeof v === "string" && v.trim().length > 0 ? 1 : 0);
        }, 0);
    };

    const hasUnanswered = () => getAnsweredCount() < totalQuestions;

    const onSubmitClick = () => {
        if (isSubmitting) return;
        if (totalQuestions === 0) return;

        if (hasUnanswered()) {
            setSubmissionIncomplete(true);
        } else {
            setSubmissionReview(true);
        }
    };

    const cancelIncomplete = () => setSubmissionIncomplete(false);
    const continueWithIncomplete = () => {
        setSubmissionIncomplete(false);
        setSubmissionReview(true);
    };

    const cancelReview = () => setSubmissionReview(false);
    const confirmReviewAndSubmit = () => {
        setSubmissionReview(false);
        doSubmitAssessment();
    };

    const doSubmitAssessment = async () => {
        const answers = (course?.formData?.assessment || []).map((q, i) => {
            const key = q.id || `idx_${i}`;
            const value = assessmentAnswers[key];

            if (q.type === "TEXT") {
                return {
                    questionId: q.id || null,
                    index: i,
                    type: "TEXT",
                    text: typeof value === "string" ? value : ""
                };
            }

            return {
                questionId: q.id || null,
                index: i,
                type: "MCQ",
                selectedIndex: Number.isInteger(value) ? value : null
            };
        });

        const studentToken = getStudentToken();
        const studentId = getStudentId();
        if (!studentToken || !studentId) {
            toast.warn("You are not logged in as a student.");
            return;
        }

        const body = { userId: studentId, answers };
        try {
            setIsSubmitting(true);
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/submit/${id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${studentToken}`
                    },
                    body: JSON.stringify(body)
                }
            );

            const raw = await res.text();
            const json = (() => { try { return JSON.parse(raw); } catch { return null; } })();

            if (!res.ok) {
                throw new Error(json?.error || json?.message || raw || `Submit failed (HTTP ${res.status})`);
            }

            setSubmitResult(json);

            if (json?.assessmentStatus === "PENDING_REVIEW" || json?.pendingReview === true) {
                setViewMode("assessment");
                try { await loadEnrollment(); } catch { }
            }

            console.log("Submit result", json);

            if (hasAssessment && json?.passed) {
                try {
                    const newWeighted = computeWeightedProgress();
                    setProgress(100);
                    try { await persistProgress(100); } catch { }
                } catch {

                }
            }
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Submission failed");
        } finally {
            setIsSubmitting(false);
            setLockAssessment(false);
        }
    };

    const handleRetryAssessment = async () => {
        const studentToken = getStudentToken();
        if (!studentToken) {
            toast.warn("You are not logged in as a student.");
            return;
        }

        try {
            setIsSubmitting(true);

            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/assessment/reset/${id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${studentToken}`,
                    },
                }
            );

            const raw = await res.text();
            const json = (() => { try { return JSON.parse(raw); } catch { return null; } })();

            if (!res.ok) {
                throw new Error(json?.error || json?.message || raw || `Reset failed (HTTP ${res.status})`);
            }

            // ✅ reset local assessment UI
            setSubmitResult(null);
            setAssessmentAnswers({});
            setQIndex(0);            // ✅ back to first question
            setLockAssessment(true); // ✅ force submit before navigating away
            setViewMode("assessment");

            // ✅ refresh enrollment from backend so fail screen condition is gone
            try { await loadEnrollment(); } catch { }

            try {
                document
                    .querySelector(".course-content-body-outline")
                    ?.scrollTo({ top: 0, behavior: "smooth" });
            } catch { }
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Could not start retake");
        } finally {
            setIsSubmitting(false);
        }
    };

    const clamp = (n, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

    const getContentCompletionPercent = () => {
        if (!allSlides.length) return 0;
        const maxIndex = Math.max(1, allSlides.length - 1);
        const furthest = clamp(highestVisitedIndexRef.current, 0, maxIndex);
        return clamp(Math.round((furthest / maxIndex) * 100));
    };

    const getAssessmentRawPercent = () => {
        if (typeof submitResult?.scorePercent === "number") return clamp(Math.round(submitResult.scorePercent));
        if (student?.passed === false) {
            return 0;
        }
        else {
            return 100;
        }

    };

    const computeWeightedProgress = () => {
        const contentPct = getContentCompletionPercent();
        const assessPct = getAssessmentRawPercent();
        const combined = Math.round(contentPct * 0.5 + assessPct * 0.5);
        return clamp(combined);
    };

    const parsePercent = (val) => {
        if (val == null) return null;

        if (typeof val === "number" && Number.isFinite(val)) {
            return clamp(Math.round(val));
        }

        const s = String(val).toLowerCase().trim();
        if (!s) return null;

        if (s.includes("completed")) return 100;

        const pct = s.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pct) return clamp(Math.round(parseFloat(pct[1])));

        const plain = s.match(/\b(100|[1-9]?\d)\b(?!\s*of)/);
        if (plain) return clamp(parseInt(plain[1], 10));

        return null;
    };

    const readPercentFromBackend = (enrollment) => {
        return (
            enrollment?.progressPercent ?? // if you ever decide to store it inside
            parsePercent(enrollment?.progress) ??
            0
        );
    };

    const persistProgress = async (nextPercent) => {
        const base = process.env.REACT_APP_URL;
        const studentToken = getStudentToken();
        if (!studentToken || !studentId) {
            return { ok: false, percent: progress };
        }

        try {
            const res = await fetch(`${base}/api/onlineTrainingCourses/progress/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${studentToken}`,
                },
                body: JSON.stringify({
                    percent: nextPercent,
                }),
            });

            const raw = await res.text();
            const json = (() => { try { return JSON.parse(raw); } catch { return null; } })();

            if (!res.ok) {
                console.warn("Persist progress failed", raw);
                return { ok: false, percent: progress };
            }

            const returned = typeof json?.percent === "number" ? clamp(Math.round(json.percent)) : nextPercent;

            setProgress(returned);

            return { ok: true, percent: returned };
        } catch (e) {
            console.warn("Persist progress error", e);
            return { ok: false, percent: progress };
        }
    };

    const [progress, setProgress] = useState(0);
    const highestVisitedIndexRef = useRef(0);

    const studentId = useMemo(() => getStudentId(), [token]);

    const topicDurationMap = useMemo(() => {
        const map = new Map();
        const table = courseOutline?.table || [];
        const topicMeta = courseOutline?.topicMeta || {};
        for (const row of table) {
            if (row?.kind === "topic") {
                const tid = row.topicId;
                const metaDur = topicMeta[tid]?.duration;
                const value = row.duration ?? metaDur;
                if (tid && value != null && value !== "") {
                    map.set(tid, value);
                }
            }
        }
        return {
            map,
            intro: courseOutline?.introDuration ?? "",
        };
    }, [courseOutline]);

    const formatMinutes = (d) => {
        if (d == null || d === "") return "";
        const n = Number(d);
        if (Number.isFinite(n)) return `${n} min`;
        return String(d);
    };

    const getSlideDurationLabel = (s) => {
        if (!s) return "";
        if (s.type === "INTRO") return formatMinutes(topicDurationMap.intro);
        const tid = s._topicId;
        if (!tid) return "";
        const val = topicDurationMap.map.get(tid);
        return formatMinutes(val);
    };

    const [lockAssessment, setLockAssessment] = useState(false);

    const allowContent = useMemo(() => {
        const alreadyPassed = Boolean(student?.passed);
        const freshlySubmitted = Boolean(submitResult);
        const passedNow = freshlySubmitted ? Boolean(submitResult?.passed) : false;
        const pendingReview =
            submitResult?.assessmentStatus === "PENDING_REVIEW";
        return alreadyPassed || passedNow || pendingReview;
    }, [student?.passed, submitResult, student?.assessmentStatus]);

    useEffect(() => {
        if (allowContent) setLockAssessment(false);
    }, [allowContent]);

    const enterAssessment = () => {
        // ✅ If assessment is awaiting grading, never show the start popup.
        // Always go straight to the assessment screen (which already renders the pending-review screen)
        if (student?.assessmentStatus === "PENDING_REVIEW" || student?.assessmentStatus === "GRADED") {
            setViewMode("assessment");
            return;
        }

        // existing logic unchanged
        if (!allowContent) {
            setPopupAssessment(true);
        } else {
            setViewMode('assessment');
        }
    };

    const closePopupAssessment = () => setPopupAssessment(false);

    const startAssessment = () => {
        setLockAssessment(true);
        setPopupAssessment(false);
        setViewMode('assessment');
    }

    const guardNavigation = (action) => {
        if (lockAssessment && !allowContent) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.info("Please submit your assessment to continue.", {
                autoClose: 1500,
            });
            return;
        }
        action();
    };

    const handleTopBack = () => {
        if (viewMode === 'outline') navigate(-1);
        if (viewMode === 'assessment') {
            if (!allowContent) return;
            setViewMode('recap');
            return;
        }

        if (viewMode === 'recap') {
            setViewMode('material');
            if (total > 0) setCurrentIndex(Math.max(0, total - 1));
            return;
        }

        if (viewMode === 'material') {
            if (currentIndex > 0) {
                setCurrentIndex(i => i - 1);
            } else {
                setViewMode('outline');
            }
            return;
        }

        setViewMode('outline');
    };

    const onSelectAnswer = (qid, qIndex, optIndex) => {
        const key = qid || `idx_${qIndex}`;
        setAssessmentAnswers(prev => ({ ...prev, [key]: optIndex }));
    };

    const onTypeAnswer = (qid, qIndex, text) => {
        const key = qid || `idx_${qIndex}`;
        setAssessmentAnswers(prev => ({ ...prev, [key]: text }));
    };

    const prevLabel =
        viewMode === 'material' && currentIndex === 0
            ? 'Course Outline'
            : getNavTitle(prevSlide);

    const nextLabel =
        viewMode === 'material' && isLastContentSlide
            ? 'Course Recap'
            : getNavTitle(nextSlide);

    const lastMaterialIndex = Math.max(0, total - 1);

    const handleRecapBack = () => {
        setViewMode('material');
        if (total > 0) setCurrentIndex(lastMaterialIndex);
    };

    const recapPrevLabel = total > 0 ? getNavTitle(allSlides[lastMaterialIndex]) : 'Course Material';
    const recapNextLabel = 'Start Assessment';

    const getItemAt = (slide, idx) => {
        if (!slide) return null;
        if (Array.isArray(slide.mediaItems)) return slide.mediaItems[idx] || null;
        // legacy single-media fallback (only for slot 0)
        if (idx === 0 && slide.media) return { media: slide.media };
        return null;
    };

    // Best-effort MIME type for an item
    const getTypeForItem = (item) => {
        if (!item?.media) return "";
        let t = (item.media.contentType || "").toLowerCase();

        // fallback from filename
        if (!t && item.media.filename) {
            const n = item.media.filename.toLowerCase();
            if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n)) t = "image/*";
            else if (/\.(mp4|webm|mov|m4v)$/.test(n)) t = "video/*";
            else if (/\.(mp3|wav|m4a|ogg)$/.test(n)) t = "audio/*";
            else if (/\.(pdf)$/.test(n)) t = "application/pdf";
        }

        // fallback from loaded blob type cache (you already fill this)
        if (!t && item.media.fileId) {
            const bt = (mediaTypeCacheRef.current.get(item.media.fileId) || "").toLowerCase();
            if (bt) t = bt;
        }

        return t || "";
    };

    // Is the given slot an audio file?
    const isAudioAt = (slide, idx) => {
        const it = getItemAt(slide, idx);
        const t = getTypeForItem(it);
        return t.startsWith("audio/");
    };

    const handleGenerateCertificateDocument = async () => {
        console.log("Generating certificate document for course:", course);
        const inductionTitle = course?.formData?.courseTitle || course?.name || "Induction";
        const studentDetails = await getStudentDetails();
        const dataToStore = {
            studentName: user?.name + " " + user?.surname,
            idNumber: user?.idNumber,
            dateCompleted: studentDetails?.completionDate,
            dateExpiry: studentDetails?.expiryDate,
            inductionName: inductionTitle
        };

        const docName =
            (user ? `${user.name} ${user?.surname || ""}`.trim() : "Visitor") +
            ` ${inductionTitle} Certificate`;

        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/api/onlineTrainingStudentManagement/generate-certificate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
                },
                body: JSON.stringify(dataToStore),
            });
            if (!res.ok) throw new Error("Failed to generate document");
            const blob = await res.blob();
            saveAs(blob, `${docName}.pdf`);
        } catch (err) {
            console.error("Error generating document:", err);
            toast.error("Could not generate certificate.");
        }
    };

    useEffect(() => {
        // Helper to check if the target is an editable field
        const isEditable = (target) => {
            const tagName = target?.tagName?.toUpperCase();
            return tagName === "TEXTAREA" || tagName === "INPUT";
        };

        // Block right-click context menu (except on inputs/textareas)
        const onContextMenu = (e) => {
            if (isEditable(e.target)) return;
            e.preventDefault();
        };

        // Block common copy/select shortcuts
        const onKeyDown = (e) => {
            // If typing in a textarea/input, allow all shortcuts (Ctrl+A, C, X, etc.)
            if (isEditable(e.target)) return;

            const key = (e.key || "").toLowerCase();
            const isMac = navigator.platform.toUpperCase().includes("MAC");
            const mod = isMac ? e.metaKey : e.ctrlKey;

            // Block Ctrl/Cmd + C, X, A, S, P (copy/cut/selectall/save/print)
            if (mod && ["c", "x", "a", "s", "p"].includes(key)) {
                e.preventDefault();
            }
        };

        // Block copy/cut events directly
        const onCopy = (e) => {
            if (isEditable(e.target)) return;
            e.preventDefault();
        };

        const onCut = (e) => {
            if (isEditable(e.target)) return;
            e.preventDefault();
        };

        document.addEventListener("contextmenu", onContextMenu);
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("copy", onCopy);
        document.addEventListener("cut", onCut);

        return () => {
            document.removeEventListener("contextmenu", onContextMenu);
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("copy", onCopy);
            document.removeEventListener("cut", onCut);
        };
    }, []);

    const downloadResourceFile = async (fileId, fallbackName = "resource") => {
        try {
            if (!fileId) return;

            const base = (process.env.REACT_APP_URL || "").replace(/\/+$/, "");
            const url = `${base}/api/onlineTrainingCourses/downloadResource/${encodeURIComponent(fileId)}`;

            const studentToken = sessionStorage.getItem("studentToken") || "";

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${studentToken}`,
                },
            });

            if (!res.ok) return;

            // Prefer filename from Content-Disposition (if backend exposes it)
            const cd = res.headers.get("content-disposition") || "";
            const m = cd.match(/filename="([^"]+)"/i);
            const filename = m?.[1] || fallbackName;

            const blob = await res.blob();
            const objUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = objUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(objUrl);
        } catch (err) {
            console.error("downloadResourceFile error:", err);
        }
    };

    const getSlideFileIds = (slide) => {
        const fids = [];
        if (!slide) return fids;

        const add = (fid) => { if (fid) fids.push(fid); };

        add(slide?.media?.fileId);
        if (Array.isArray(slide?.mediaItems)) {
            for (const it of slide.mediaItems) add(it?.media?.fileId);
        }
        return fids;
    };

    const preloadForIndex = async (index, lookaheadSlides = 2) => {
        const indices = [];
        for (let i = index; i <= index + lookaheadSlides; i++) {
            if (i >= 0 && i < allSlides.length) indices.push(i);
        }

        const fids = [];
        for (const i of indices) fids.push(...getSlideFileIds(allSlides[i]));

        // de-dupe while keeping order
        const seen = new Set();
        const unique = [];
        for (const fid of fids) {
            if (!fid || seen.has(fid)) continue;
            seen.add(fid);
            unique.push(fid);
        }

        // fire them (parallel)
        await Promise.all(unique.map(fetchMediaById));
    };

    const MediaSpinner = ({ label = "Loading…" }) => (
        <div className="media-loading-overlay" aria-live="polite" aria-busy="true">
            <style>{`
          @keyframes mediaSpin { to { transform: rotate(360deg); } }
          .media-loading-overlay{
            width:100%;
            height:100%;
            min-height:220px;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            gap:10px;
          }
          .media-loading-spinner{
            width:42px;
            height:42px;
            border-radius:50%;
            border:4px solid rgba(0,0,0,0.15);
            border-top-color: rgba(0,0,0,0.55);
            will-change: transform;
          }
          .media-loading-label{ font-size:14px; opacity:0.8; }
        `}</style>

            <FontAwesomeIcon icon={faCircleNotch} className="spin-animation" />
            <div className="media-loading-label">{label}</div>
        </div>
    );

    return (
        <div className="risk-admin-draft-info-container no-copy-page">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/studentHomePage')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="button-container-create">
                        <SidebarButton
                            icon={faClipboardList}
                            text="Course Outline"
                            onClick={() => guardNavigation(() => setViewMode('outline'))}
                            active={viewMode === 'outline'}
                        />
                        <SidebarButton
                            icon={faInfoCircle}
                            text="Introduction"
                            onClick={() => guardNavigation(() => { setViewMode('material'); setCurrentIndex(0); })}
                            active={viewMode === 'material' && currentIndex === 0}
                        />
                        <SidebarButton
                            icon={faBookOpen}
                            text="Course Material"
                            onClick={() => guardNavigation(() => { setViewMode('material'); setCurrentIndex(1); })}
                            active={viewMode === 'material' && currentIndex > 0}
                        />
                        <SidebarButton
                            icon={faClipboardList}
                            text="Course Recap"
                            onClick={() => guardNavigation(() => setViewMode('recap'))}
                            active={viewMode === 'recap'}
                        />
                        <SidebarButton
                            icon={faClipboard}
                            text="Assessment"
                            onClick={enterAssessment}
                            active={viewMode === 'assessment'}
                        />
                        <SidebarButton
                            icon={faFolderOpen}
                            text="Resources"
                            onClick={() => guardNavigation(() => setViewMode('resources'))}
                            active={viewMode === 'resources'}
                        />
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/visitorInductionMainIcon2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">Online Training</p>
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

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        {viewMode !== "resources" && (
                            <FontAwesomeIcon
                                onClick={handleTopBack}
                                icon={faArrowLeft}
                                title="Back"
                                style={{ cursor: "pointer" }}
                            />
                        )}
                    </div>
                    <div className="spacer"></div>
                    <TopBar visitor={false} student={true} />
                </div>

                <div className="course-view-box">
                    <div className="course-view-content">
                        <div className="course-title-row">
                            <div className="course-view-title">
                                {course?.formData?.courseTitle || course?.name || "Course Title"}
                            </div>

                            {(viewMode === 'material' || viewMode === "assessment" || viewMode === "recap") && total > 0 && (
                                <div className="viewer-progress">
                                    <div className="viewer-progress-bar">
                                        <div
                                            className={`${progress === 100 ? `viewer-progress-bar-fill` : `viewer-progress-bar-fill-ip`}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="viewer-progress-label">{progress}%</div>
                                </div>
                            )}
                        </div>

                        {viewMode === 'outline' && (
                            <>
                                <div className="course-content-body-outline">
                                    <div className="course-outline-text">
                                        <span style={{ fontWeight: "normal" }}><strong>Department:</strong> {courseOutline?.department || course?.dept || ""}</span>
                                        <span style={{ fontWeight: "normal" }}><strong>Duration:</strong> {formatDuration(courseOutline?.duration)}</span>
                                        <span style={{ fontWeight: "normal" }}><strong>Version Number:</strong> {course?.versionNumber ?? course?.version ?? ""}</span>
                                    </div>

                                    <div className="course-outline-text" style={{ marginBottom: "0px" }}>
                                        <span style={{ color: "#002060", fontSize: "20px" }}>COURSE OUTLINE </span>
                                    </div>

                                    <div className="course-outline-table-visitorView">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "6%", textAlign: "center" }}>Nr</th>
                                                    <th style={{ width: "26%", textAlign: "center" }}>Topic</th>
                                                    <th style={{ width: "8%", textAlign: "center" }}>Duration</th>
                                                    <th style={{ width: "60%", textAlign: "center" }}>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(courseOutline?.table || []).map((row, i) => {
                                                    const fmt = (d) => {
                                                        if (d == null || d === "") return "";
                                                        const n = Number(d);
                                                        return Number.isFinite(n) ? `${n} min` : d;
                                                    };

                                                    if (row.kind === "module") {
                                                        return (
                                                            <tr key={`m-${i}`}>
                                                                <td colSpan={4} style={{ textAlign: "left", fontWeight: 700, backgroundColor: "lightgray" }}>
                                                                    {row.text}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    if (row.kind === "intro") {
                                                        const duration = row.duration ?? courseOutline?.introDuration;
                                                        const description = row.description ?? courseOutline?.introDescription;
                                                        return (
                                                            <tr key={`i-${i}`} style={{ fontWeight: "normal" }}>
                                                                <td style={{ textAlign: "center" }}>{row.nr ?? "0"}</td>
                                                                <td>{row.topic ?? "Introduction"}</td>
                                                                <td style={{ textAlign: "center" }}>{fmt(duration)}</td>
                                                                <td>{description || ""}</td>
                                                            </tr>
                                                        );
                                                    }

                                                    /* ✅ NEW: render topic rows under their modules */
                                                    if (row.kind === "topic") {
                                                        const meta = (courseOutline?.topicMeta || {})[row.topicId] || {};
                                                        const duration = row.duration ?? meta.duration;
                                                        const description = row.description ?? meta.description;

                                                        return (
                                                            <tr key={row.topicId || `t-${i}`} style={{ fontWeight: "normal" }}>
                                                                <td style={{ textAlign: "center" }}>
                                                                    {row.nr ?? `${(row.moduleIndex ?? 0) + 1}.${(row.topicIndex ?? 0) + 1}`}
                                                                </td>
                                                                <td /* slight indent so topics sit “under” modules */ style={{ paddingLeft: 12 }}>
                                                                    {row.topic}
                                                                </td>
                                                                <td style={{ textAlign: "center" }}>{fmt(duration)}</td>
                                                                <td>{description || ""}</td>
                                                            </tr>
                                                        );
                                                    }

                                                    if (row.kind === "slide") {
                                                        const meta = (courseOutline?.slideMeta || {})[row.slideId] || {};
                                                        const duration = row.duration ?? meta.duration;
                                                        const description = row.description ?? meta.description;
                                                        return (
                                                            <tr key={row.slideId || `s-${i}`}>
                                                                <td style={{ textAlign: "center" }}>
                                                                    {row.nr ?? `${(row.moduleIndex ?? 0) + 1}.${(row.slideIndex ?? 0) + 1}`}
                                                                </td>
                                                                <td style={{ paddingLeft: 24 /* deeper indent for slides (optional) */ }}>
                                                                    {row.topic}
                                                                </td>
                                                                <td style={{ textAlign: "center" }}>{fmt(duration)}</td>
                                                                <td>{description || ""}</td>
                                                            </tr>
                                                        );
                                                    }

                                                    return null;
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="course-outline-text" style={{ marginBottom: "0px" }}>
                                        <span style={{ color: "#002060", fontSize: "20px" }}>ABBREVIATIONS </span>
                                    </div>

                                    <div className="course-outline-table-visitorView">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "20%", textAlign: "center" }}>Abbreviation</th>
                                                    <th style={{ width: "80%", textAlign: "center" }}>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {abbrs.map((row, i) => (
                                                    <tr key={i} style={{ fontWeight: "normal" }}>
                                                        <td>{row.abbr}</td>
                                                        <td>{row.meaning}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="course-outline-text" style={{ marginBottom: "0px" }}>
                                        <span style={{ color: "#002060", fontSize: "20px" }}>TERMS & DEFINITIONS </span>
                                    </div>

                                    <div className="course-outline-table-visitorView">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "20%", textAlign: "center" }}>Term</th>
                                                    <th style={{ width: "80%", textAlign: "center" }}>Definition</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {terms.map((row, i) => (
                                                    <tr key={i} style={{ fontWeight: "normal" }}>
                                                        <td>{row.term}</td>
                                                        <td>{row.definition}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="course-outline-text">
                                        <span style={{ color: "#002060", fontSize: "20px" }}>ASSESSMENT & CERTIFICATION</span>
                                        <span style={{ fontWeight: "normal" }}><strong>Assessment Pass Mark:</strong> 80%</span>
                                        <span style={{ fontWeight: "normal" }}><strong>Certificate Validity:</strong> 12 months</span>
                                    </div>
                                </div>

                                <div className="course-nav-bar">
                                    <div className="nav-text-title" style={{ textAlign: "left" }}>{""}</div>
                                    <button
                                        className={`${viewMode !== 'outline'
                                            ? 'course-nav-button' : 'course-nav-button-disabled'} back`}
                                        onClick={goBack}
                                        disabled={(viewMode === 'outline')}
                                        title="Back"
                                    >
                                        Back
                                    </button>
                                    <button
                                        className={`${(canNext || isLastContentSlide) ? 'course-nav-button' : 'course-nav-button-disabled'} back`}
                                        onClick={() => {
                                            setViewMode("material")
                                            setCurrentIndex(0);
                                        }}
                                        title={isLastContentSlide ? "Go to Course Recap" : "Next"}
                                    >
                                        Next
                                    </button>
                                    <div className="nav-text-title" style={{ textAlign: "right" }}>
                                        {"Introduction"}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* === COURSE MATERIAL (slides viewer) === */}
                        {viewMode === 'material' && (
                            <>
                                {viewMode === "material" && currentIndex !== 0 && Array.isArray(viewModules) && viewModules.length > 0 &&
                                    <div className="module-rail" aria-label="Module navigation">
                                        {viewModules.map((mod, mIdx) => {
                                            const firstIdx = moduleFirstSlideIndexMap.get(mIdx);
                                            const isActive = currentSlide._moduleIndex === mIdx;
                                            const isClickable = typeof firstIdx === 'number';
                                            const titleRaw = (mod && mod.title) ? String(mod.title) : '';
                                            const nr = mIdx + 1;
                                            const title = titleRaw.trim() || `Module ${nr}`;
                                            return (
                                                <div
                                                    key={mod?.id || mIdx}
                                                    className={`module-box${isActive ? ' active' : ''}${!isClickable ? ' disabled' : ''}`}
                                                    title={title}
                                                    role={isClickable ? 'button' : undefined}
                                                    tabIndex={isClickable ? 0 : -1}
                                                    onClick={() => isClickable && !isActive && goToModule(mIdx)}
                                                    onKeyDown={(e) => {
                                                        if (isClickable && !isActive && (e.key === 'Enter' || e.key === ' ')) {
                                                            e.preventDefault();
                                                            goToModule(mIdx);
                                                        }
                                                    }}
                                                >
                                                    {title}
                                                </div>
                                            );
                                        })}
                                    </div>
                                }
                                <div className="course-content-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {!loading && total > 0 && currentSlide && (
                                        <>
                                            {currentSlide.type === "INTRO" ? (
                                                <div style={{ background: "#fff", borderRadius: 8, padding: 14 }} className="inductionView-intro">
                                                    <div className="slide-title-row">
                                                        <div className="slide-title-left">INTRODUCTION</div>
                                                        <div className="slide-title-right">
                                                            {(() => {
                                                                const dur = getSlideDurationLabel(currentSlide);
                                                                return dur ? <span className="slide-duration-badge">{dur}</span> : null;
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div style={{ height: 4, background: "#0b2f6b", borderRadius: 2, marginTop: 8, marginBottom: 10 }} />
                                                    <div className="inductionView-intro-center">
                                                        <div style={{ whiteSpace: "pre-wrap", fontSize: 22, lineHeight: 1.45, marginBottom: 12, textAlign: "left", color: "black" }}>
                                                            {currentSlide.content}
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 6, textAlign: "left", color: "black" }}>
                                                            Course Objectives:
                                                        </div>
                                                        <ul className="intro-objectives-list" style={{ marginTop: 0, fontSize: 22, color: "black", textAlign: "left", lineHeight: 1.45 }}>
                                                            {currentSlide.objectives
                                                                .split(/\r?\n/)
                                                                .filter(Boolean)
                                                                .map((line, i) => <li key={i} className="intro-objectives-item" style={{ marginBottom: 6 }}>{line}</li>)}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="inductionView-card-module-info">
                                                    <div className="inductionView-module-course-content">
                                                        <div className="slide-title-row">
                                                            <div className="slide-title-left">
                                                                {`${currentSlide._moduleIndex + 1}.${currentSlide._slideIndex + 1} ${currentSlide.title || currentSlide._topicTitle || "Untitled Slide"
                                                                    }`}
                                                            </div>
                                                            <div className="slide-title-right">
                                                                {(() => {
                                                                    const dur = getSlideDurationLabel(currentSlide);
                                                                    return dur ? <span className="slide-duration-badge">{dur}</span> : null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div style={{ height: 4, background: "#0b2f6b", borderRadius: 2, marginTop: 8, marginBottom: 10 }} />
                                                        <div className="inductionView-slide-content">
                                                            {(currentSlide.type === SLIDE_TYPES.TEXT) && (
                                                                <div style={{ height: "100%" }}>
                                                                    <div className="inductionView-text-box-text" style={{ whiteSpace: "pre-wrap", fontSize: 22, lineHeight: 1.45, textAlign: "left" }}>
                                                                        <div style={{ margin: "auto 0" }}>
                                                                            {currentSlide.content || ""}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(currentSlide.type === SLIDE_TYPES.TEXT_MEDIA) && (
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%" }}>
                                                                    <div className="inductionView-text-box" style={{ whiteSpace: "pre-wrap", fontSize: 22, lineHeight: 1.45, textAlign: "left", paddingTop: "10px" }}>
                                                                        <div style={{ margin: "auto 0" }}>
                                                                            {currentSlide.content || ""}
                                                                        </div>
                                                                    </div>
                                                                    <div className={isAudioAt(currentSlide, 0) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 0, "4/3")}</div>
                                                                </div>
                                                            )}

                                                            {(currentSlide.type === SLIDE_TYPES.MEDIA_GALLERY) && (
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%" }}>
                                                                    <div className={isAudioAt(currentSlide, 0) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 0, "4/3")}</div>
                                                                    <div className={isAudioAt(currentSlide, 1) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 1, "4/3")}</div>
                                                                </div>
                                                            )}
                                                            {currentSlide.type === SLIDE_TYPES.MEDIA && (
                                                                <div className={isAudioAt(currentSlide, 0) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 0, "16/9")}</div>
                                                            )}

                                                            {(currentSlide.type === SLIDE_TYPES.TEXT_MEDIA_2X2) && (
                                                                <div className={`limitHeightInductionView`} style={{ display: "grid", gridTemplateColumns: "2fr 2fr", gap: 16 }}>
                                                                    <div className="inductionView-text-box" style={{ whiteSpace: "pre-wrap", fontSize: 22, lineHeight: 1.45, textAlign: "left", paddingTop: "10px" }}>
                                                                        <div style={{ margin: "auto 0" }}>
                                                                            {currentSlide.contentLeft || ""}
                                                                        </div>
                                                                    </div>
                                                                    <div className={isAudioAt(currentSlide, 0) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 0, "16/9")}</div>
                                                                    <div className="inductionView-text-box" style={{ whiteSpace: "pre-wrap", fontSize: 22, lineHeight: 1.45, textAlign: "left", paddingTop: "10px" }}>
                                                                        <div style={{ margin: "auto 0" }}>
                                                                            {currentSlide.contentRight || ""}
                                                                        </div>
                                                                    </div>
                                                                    <div className={isAudioAt(currentSlide, 1) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 1, "16/9")}</div>
                                                                </div>
                                                            )}

                                                            {currentSlide.type === SLIDE_TYPES.MEDIAX2_TEXT && (
                                                                <div className="limitHeightInductionView" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                                    {/* Column 1: Text box (no changes needed here) */}
                                                                    <div
                                                                        className="inductionView-text-box"
                                                                        style={{
                                                                            whiteSpace: "pre-wrap",
                                                                            fontSize: 22,
                                                                            lineHeight: 1.45,
                                                                            textAlign: "left",
                                                                            paddingTop: "10px",
                                                                        }}
                                                                    >
                                                                        <div style={{ margin: "auto 0" }}>
                                                                            {currentSlide.content || ""}
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
                                                                        <div className={isAudioAt(currentSlide, 0) ? `inductionView-media-box-2` : "inductionView-media-box"} style={{ flex: 1, minHeight: 0 }}>
                                                                            {renderMedia(currentSlide, 0, "16/9")}
                                                                        </div>
                                                                        <div className={isAudioAt(currentSlide, 1) ? `inductionView-media-box-2` : "inductionView-media-box"} style={{ flex: 1, minHeight: 0 }}>
                                                                            {renderMedia(currentSlide, 1, "16/9")}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(currentSlide.type === SLIDE_TYPES.MEDIA_2X2) && (
                                                                <div className={`limitHeightInductionView`} style={{ display: "grid", gridTemplateColumns: "2fr 2fr", gap: 16 }}>
                                                                    <div className={isAudioAt(currentSlide, 0) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 0, "16/9")}</div>
                                                                    <div className={isAudioAt(currentSlide, 1) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 1, "16/9")}</div>
                                                                    <div className={isAudioAt(currentSlide, 2) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 2, "16/9")}</div>
                                                                    <div className={isAudioAt(currentSlide, 3) ? `inductionView-media-box-2` : "inductionView-media-box"}>{renderMedia(currentSlide, 3, "16/9")}</div>
                                                                </div>
                                                            )}

                                                            {(currentSlide.type === SLIDE_TYPES.PDF_VIEW) && (
                                                                <div className="inductionView-media-box-pdf">{renderMedia(currentSlide, 0)}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="course-nav-bar">
                                    <div className="nav-text-title" style={{ textAlign: "left" }}>{prevLabel}</div>
                                    <button
                                        className={`${(currentIndex > 0 || (viewMode === 'material' && currentIndex === 0))
                                            ? 'course-nav-button' : 'course-nav-button-disabled'} back`}
                                        onClick={goBack}
                                        disabled={!(currentIndex > 0 || (viewMode === 'material' && currentIndex === 0))}
                                        title="Back"
                                    >
                                        Back
                                    </button>
                                    <button
                                        className={`${(canNext || isLastContentSlide) ? 'course-nav-button' : 'course-nav-button-disabled'} back`}
                                        onClick={isLastContentSlide ? goToRecap : goNext}
                                        disabled={!(canNext || isLastContentSlide)}
                                        title={isLastContentSlide ? "Go to Course Recap" : "Next"}
                                    >
                                        Next
                                    </button>
                                    <div className="nav-text-title" style={{ textAlign: "right" }}>
                                        {nextLabel}
                                    </div>
                                </div>
                            </>
                        )}

                        {viewMode === 'recap' && (
                            <>
                                <div className="course-content-body">
                                    <div className="inductionView-module-course-content" style={{ marginTop: "0px" }}>
                                        <div className="slide-title-row">
                                            <div className="slide-title-left">
                                                {`COURSE RECAP`}
                                            </div>
                                        </div>
                                        <div style={{ height: 4, background: "#0b2f6b", borderRadius: 2, marginTop: 8, marginBottom: 10 }} />

                                        <div className="recap-content" style={{ fontSize: "22px" }}>

                                            {course?.formData?.summary || "No summary provided."}
                                        </div>
                                    </div>
                                </div>


                                <div className="course-nav-bar">
                                    <div className="nav-text-title" style={{ textAlign: "left" }}>
                                        {recapPrevLabel}
                                    </div>

                                    <button
                                        type="button"
                                        className="course-nav-button back"
                                        onClick={handleRecapBack}
                                        title="Back to material"
                                        disabled={total === 0}
                                    >
                                        Back
                                    </button>

                                    <button
                                        type="button"
                                        className="course-nav-button back"
                                        onClick={enterAssessment}
                                        title="Start Assessment"
                                        disabled={false}
                                    >
                                        Next
                                    </button>

                                    <div className="nav-text-title" style={{ textAlign: "right" }}>
                                        {recapNextLabel}
                                    </div>
                                </div>
                            </>
                        )}

                        {viewMode === 'assessment' && (
                            <div className="course-content-body-outline" style={{ marginBottom: "0px", gap: "8px" }}>
                                {(() => {
                                    const alreadyPassed = Boolean(student?.passed);
                                    const freshlySubmitted = Boolean(submitResult);
                                    const passedNow = freshlySubmitted ? Boolean(submitResult?.passed) : false;

                                    const pendingFromBackend = student?.assessmentStatus === "PENDING_REVIEW";
                                    const pendingFromSubmit = freshlySubmitted && (submitResult?.assessmentStatus === "PENDING_REVIEW" || submitResult?.pendingReview === true);
                                    const showPending = pendingFromBackend || pendingFromSubmit;

                                    const showPass = alreadyPassed || passedNow;

                                    // decide which score to show
                                    const scorePercent =
                                        freshlySubmitted && typeof submitResult?.scorePercent === 'number'
                                            ? submitResult.scorePercent
                                            : (typeof student?.mark === 'number' ? student.mark : null);

                                    const failedFromBackend =
                                        student?.assessmentStatus === "GRADED" && student?.passed === false;

                                    const failedFromSubmit =
                                        freshlySubmitted && submitResult?.passed === false;

                                    if (showPending) {
                                        return (
                                            <div className="assessment-pass-screen" style={{ background: "#FFF3CD" }}>
                                                <div className="assessment-pass-content">
                                                    <div className="assessment-pass-title">
                                                        Your assessment has been submitted and is <strong>pending review</strong>.
                                                    </div>

                                                    <div className="assessment-pass-title" style={{ marginTop: 20, marginBottom: 20 }}>
                                                        <strong>{course?.formData?.courseTitle}</strong>
                                                    </div>

                                                    <div className="assessment-pass-sub">
                                                        An author will review your written answers. Your final score and certificate will be available once marking is complete.
                                                    </div>

                                                    <div className="course-nav-bar-subScreen">
                                                        <button
                                                            type="button"
                                                            className="course-nav-button-startAss2"
                                                            title="Back to recap"
                                                            onClick={() => setViewMode("recap")}
                                                        >
                                                            Back to Recap
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (showPass) {
                                        // ✅ PASS SCREEN (unchanged)
                                        return (
                                            <div className="assessment-pass-screen">
                                                <div className="assessment-pass-content">
                                                    <div className="assessment-pass-title">
                                                        Congratulations <strong>{course?.requestedBy?.name} {course?.requestedBy?.surname}</strong>, you have completed your course!
                                                    </div>

                                                    <div className="assessment-pass-title" style={{ marginTop: 20, marginBottom: 20 }}>
                                                        <strong>{course?.formData?.courseTitle}</strong>
                                                    </div>

                                                    <div className="assessment-pass-grade">
                                                        <strong>Your Total Grade: </strong>
                                                        {scorePercent != null ? `${scorePercent}%` : '—'}
                                                    </div>

                                                    <div className="course-nav-bar-subScreen">
                                                        <button
                                                            type="button"
                                                            className="course-nav-button-startAss2"
                                                            title="Download Certificate"
                                                            onClick={handleGenerateCertificateDocument}
                                                        >
                                                            Download Certificate
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (failedFromBackend || failedFromSubmit) {
                                        // ❌ FAIL SCREEN (unchanged)
                                        return (
                                            <div className="assessment-fail-screen">
                                                <div className="assessment-pass-content">
                                                    <div className="assessment-pass-title">
                                                        Unfortunately <strong>{course?.requestedBy?.name} {course?.requestedBy?.surname}</strong>, you did not achieve the required score to pass this course.
                                                    </div>
                                                    <div className="assessment-pass-title" style={{ marginTop: 20, marginBottom: 20 }}>
                                                        <strong>{course?.formData?.courseTitle}</strong>
                                                    </div>
                                                    <div className="assessment-pass-title" style={{ marginTop: 20, marginBottom: 20 }}>
                                                        Please review the course material and retake the assessment to complete your course successfully.
                                                    </div>
                                                    <div className="assessment-pass-grade">
                                                        <strong>Your Total Grade: </strong>{scorePercent != null ? `${scorePercent}%` : "—"}
                                                    </div>
                                                    <div className="course-nav-bar-subScreen">
                                                        <button
                                                            type="button"
                                                            className="course-nav-button-startAss"
                                                            onClick={handleRetryAssessment}
                                                            title="Try Again"
                                                        >
                                                            Try Again
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ❓ SINGLE-QUESTION VIEW
                                    const questions = course?.formData?.assessment || [];
                                    if (!questions.length) {
                                        return (
                                            <div className="assessment-card">
                                                <div className="assessment-header">ASSESSMENT</div>
                                                <div className="assessment-divider" />
                                                <div style={{ padding: 12 }}>No questions available.</div>
                                            </div>
                                        );
                                    }

                                    const q = questions[qIndex];
                                    const key = q.id || `idx_${qIndex}`;

                                    return (
                                        <>
                                            <div className="assessment-card">
                                                {/* Header with compact progress */}
                                                <div className="assessment-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>ASSESSMENT</div>
                                                </div>
                                                <div className="assessment-divider" />

                                                {/* ONE question only */}
                                                <div className="assessment-q" key={key}>
                                                    <div className="assessment-q-title" style={{ marginTop: 10, fontSize: 22 }}>
                                                        {qIndex + 1}. {q.question}
                                                    </div>

                                                    {q.type === "TEXT" ? (
                                                        <div className="assessment-text-answer" style={{ marginTop: 0, width: "calc(100% - 25px)" }}>
                                                            <textarea
                                                                className="assessment-textarea"
                                                                placeholder="Type your answer here..."
                                                                value={typeof assessmentAnswers[key] === "string" ? assessmentAnswers[key] : ""}
                                                                onChange={(e) => onTypeAnswer(q.id, qIndex, e.target.value)}
                                                                rows={6}
                                                                style={{ width: "100%", resize: "none" }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="assessment-options">
                                                            {(q.options || []).map((opt, oi) => (
                                                                <label className="assessment-option" key={oi} style={{ fontSize: 22 }}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`q_${key}`}
                                                                        value={oi}
                                                                        checked={assessmentAnswers[key] === oi}
                                                                        onChange={() => onSelectAnswer(q.id, qIndex, oi)}
                                                                    />
                                                                    <span>{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer nav bar with prev/next labels */}

                                            </div>
                                            <div className="course-nav-bar" style={{ marginTop: 0 }}>
                                                <div className="nav-text-title" style={{ textAlign: "left" }}>{prevQLabel}</div>

                                                <button
                                                    type="button"
                                                    className={` ${hasPrevQ ? 'course-nav-button back' : 'course-nav-button-disabled'}`}
                                                    onClick={goPrevQ}
                                                    disabled={!hasPrevQ}
                                                    title="Back"
                                                >
                                                    Back
                                                </button>

                                                <button
                                                    type="button"
                                                    className={` ${!isLastQ ? 'course-nav-button back' : 'course-nav-button-disabled'}`}
                                                    onClick={goNextQ}
                                                    disabled={(isLastQ || !hasNextQ)}
                                                    title={"Next"}
                                                >
                                                    {"Next"}
                                                </button>

                                                {!isLastQ && (
                                                    <div className="nav-text-title" style={{ textAlign: "right" }}>
                                                        {nextQLabel}
                                                    </div>
                                                )}

                                                {isLastQ && (
                                                    <div className="nav-text-title-button" style={{ textAlign: "right" }}>
                                                        <button
                                                            type="button"
                                                            className={`course-nav-button-submit`}
                                                            onClick={goNextQ}
                                                            disabled={!(isLastQ || hasNextQ)}
                                                            title={isLastQ ? "Submit Assessment" : "Next"}
                                                        >
                                                            {isSubmitting ? "Submitting…" : "Submit Assessment"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {viewMode === 'resources' && (
                            <>
                                <div className="course-content-body">
                                    <div className="inductionView-module-course-content" style={{ marginTop: "0px" }}>
                                        <div className="slide-title-row">
                                            <div className="slide-title-left">
                                                {`RESOURCES`}
                                            </div>
                                        </div>

                                        <div style={{ height: 4, background: "#0b2f6b", borderRadius: 2, marginTop: 8, marginBottom: 10 }} />

                                        <div className="course-resources-scroll">
                                            <table className="course-resources-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: "10%", textAlign: "center" }}>Nr</th>
                                                        <th style={{ width: "80%", textAlign: "left" }}>File Name</th>
                                                        <th style={{ width: "10%", textAlign: "center" }}>Action</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {(() => {
                                                        const resources = Array.isArray(course?.formData?.resources)
                                                            ? course.formData.resources
                                                            : [];

                                                        const removeExt = (name = "") => name.replace(/\.[^/.]+$/, "");

                                                        // ✅ no resources row
                                                        if (resources.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan={3} style={{ textAlign: "center", fontWeight: "normal" }}>
                                                                        This course does not have any resources
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        return resources.map((r, idx) => {
                                                            const fileId = r?.media?.fileId;
                                                            const displayName = removeExt(r?.name || r?.media?.filename || `Resource ${idx + 1}`);

                                                            return (
                                                                <tr key={fileId || idx} style={{ fontWeight: "normal", color: "black" }}>
                                                                    <td style={{ textAlign: "center" }}>{idx + 1}</td>

                                                                    <td style={{ textAlign: "left" }}>{displayName}</td>

                                                                    <td style={{ textAlign: "center" }}>
                                                                        <button
                                                                            type="button"
                                                                            className="course-resource-download-btn"
                                                                            title="Download"
                                                                            disabled={!fileId}
                                                                            onClick={() =>
                                                                                downloadResourceFile(
                                                                                    fileId,
                                                                                    r?.name || r?.media?.filename || "resource"
                                                                                )
                                                                            }
                                                                        >
                                                                            <FontAwesomeIcon icon={faDownload} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {popupAssessment && (<StudentCourseStartAssessmentPopup closeModal={closePopupAssessment} startAssessment={startAssessment} />)}
            {submissionIncomplete && (<IncompleteAssessmentPopup closeModal={cancelIncomplete} submit={continueWithIncomplete} />)}
            {submissionReview && (<ReviewAssessmentPopup closeModal={cancelReview} submit={confirmReviewAndSubmit} />)}
            <ToastContainer />
            <HelpPanel studentId={studentId} courseId={id} token={token} />
        </div >
    );
};

export default StudentCourseViewPage;
