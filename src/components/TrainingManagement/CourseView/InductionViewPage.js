import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faCaretLeft, faCaretRight, faChevronLeft, faChevronRight,
    faClipboardList, faInfoCircle, faBookOpen, faClipboard
} from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./CourseViewPage.css";
import TopBar from "../../Notifications/TopBar";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";

/** Keep slide type names aligned with the editor */
const SLIDE_TYPES = {
    TEXT: "TEXT",
    TEXT_MEDIA: "TEXT_MEDIA",
    MEDIA: "MEDIA",
};

const InductionViewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // at the top of your component
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    // shape: { total, correctCount, scorePercent, passed, passMark, trainee }

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [userID, setUserID] = useState('');

    // viewMode: 'outline' | 'material' | 'intro' | 'recap' | 'assessment'
    const [viewMode, setViewMode] = useState('outline');

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    // Outline data (existing UI)
    const [courseOutline, setCourseOutline] = useState([]);
    const [terms, setTerms] = useState([]);
    const [abbrs, setAbbrs] = useState([]);

    // Slide nav state
    const [currentIndex, setCurrentIndex] = useState(0);

    const objectUrlCacheRef = useRef(new Map());
    const mediaTypeCacheRef = useRef(new Map());

    useEffect(() => {
        const storedToken = sessionStorage.getItem('visitorToken');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    // Pick the most up-to-date trainee data: freshly submitted > backend
    const pickTraineeData = () => {
        // Case A: submitResult contains the updated trainee object
        if (submitResult?.trainee) return submitResult.trainee;

        // Case B: course already had trainee (passed earlier)
        if (course?.trainee) return course.trainee;

        // Case C (rare): just passed but backend didn’t return trainee;
        // synthesize minimal structure so the generator has something sane.
        const userName = course?.requestedBy?.name || "";
        const userSurname = course?.requestedBy?.surname || "";
        const userIdNumber = course?.trainee?.user?.idNumber || "";
        const scorePercent = typeof submitResult?.scorePercent === "number" ? submitResult.scorePercent : null;

        return {
            user: {
                name: userName,
                surname: userSurname,
                email: course?.requestedBy?.email || "",
                userIdNumber: userIdNumber
                // add any IDs you usually include if you have them available
            },
            passed: true,
            mark: scorePercent,            // your generator seems happy with this from HomePage usage
            validity: "valid",             // default valid
            dateCompleted: new Date().toISOString(),
            // sensible default: 12 months
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            progress: "Completed 100%",
        };
    };

    const getInductionTitle = () => course?.formData?.courseTitle || "Induction";

    // Download (same endpoint you use on HomePage)
    const handleGenerateCertificateDocument = async () => {
        console.log(course)
        const trainee = pickTraineeData();
        console.log(trainee)
        const inductionTitle = getInductionTitle();
        const dataToStore = { traineeData: trainee, inductionName: inductionTitle };

        const docName =
            (trainee?.user?.name ? `${trainee.user.name} ${trainee?.user?.surname || ""}`.trim() : "Visitor") +
            ` ${inductionTitle} Certificate`;

        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-pdf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // keep parity with HomePage: include token if present
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
                const res = await fetch(`${base}/api/visitorDrafts/getCourseData/${id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setCourse(data);
                setCourseOutline(data?.formData?.courseOutline);
                setAbbrs(data?.formData?.abbrRows);
                setTerms(data?.formData?.termRows);
                console.log(data);

                const p = readPercentFromBackend(data);
                setProgress(p);

                // initialise "highest visited" to whatever matches that backend percent,
                // so we don't re-increment if they land in the middle.
                const initialIdxFromPercent = Math.round(((data?.formData ? p : 0) / 100) * Math.max(1, (data?.formData ? ((data?.formData?.courseModules || []).flatMap(m => (m.topics || []).flatMap(t => t.slides || [])).length) : 0)));
                highestVisitedIndexRef.current = initialIdxFromPercent || 0;
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

    // Flat slides with intro at the start
    const allSlides = useMemo(() => {
        const slides = topicGroups.flatMap(g => g.slides);
        return introSlide ? [introSlide, ...slides] : slides;
    }, [topicGroups, introSlide]);

    const total = allSlides.length;
    const canBack = currentIndex > 0;
    const canNext = currentIndex < total - 1;
    const currentSlide = total > 0 ? allSlides[currentIndex] : null;

    const mediaIds = useMemo(() => {
        const out = [];
        for (const mod of viewModules) {
            for (const topic of mod.topics || []) {
                for (const slide of topic.slides || []) {
                    const fid = slide?.media?.fileId;
                    if (fid) out.push(fid);
                }
            }
        }
        // unique & stable order
        return Array.from(new Set(out));
    }, [viewModules]);

    // Hydrate media previews for viewer (similar to Creation page)
    useEffect(() => {
        let cancelled = false;
        const apiBase = process.env.REACT_APP_URL;
        async function hydrate() {
            const jobs = [];
            for (const fid of mediaIds) {
                if (objectUrlCacheRef.current.has(fid)) continue; // already hydrated
                const url = `${process.env.REACT_APP_URL}/api/visitorDrafts/media/${encodeURIComponent(fid)}`;
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
                // trigger re-render by replacing course shallowly
                setCourse((prev) => ({ ...(prev || {}) }));
            }
        }

        if (mediaIds.length) hydrate();
        return () => { cancelled = true; };
    }, [mediaIds.join(','), token]);// eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            for (const url of objectUrlCacheRef.current.values()) {
                try { URL.revokeObjectURL(url); } catch { }
            }
            objectUrlCacheRef.current.clear();
        };
    }, []);

    const goBack = () => { if (canBack) setCurrentIndex((i) => i - 1); };
    const goNext = async () => {
        if (!canNext) return;

        const targetIndex = currentIndex + 1;
        setCurrentIndex(targetIndex);

        if (targetIndex > highestVisitedIndexRef.current) {
            highestVisitedIndexRef.current = targetIndex;

            const nextPercent = indexToPercent(targetIndex, total);

            if (nextPercent > progress) {
                setProgress(nextPercent);

                const { ok, percent } = await persistProgress(nextPercent);
                if (!ok) {
                    setProgress(percent);
                }
            }
        }
    };

    const topicSlideCounts = useMemo(() => {
        const map = new Map();
        topicGroups.forEach(g => {
            const key = `${g.mIdx}-${g.tIdx}`;
            map.set(key, (g.slides || []).length);
        });
        // treat intro as single slide
        map.set("-1--1", 1);
        return map;
    }, [topicGroups]);

    const getSlideSuffix = (s) => {
        if (!s) return "";
        if (s.type === "INTRO") return "";
        const key = `${s._moduleIndex}-${s._topicIndex}`;
        const count = topicSlideCounts.get(key) || 1;
        if (count > 1) return ` (Slide ${s._slideIndex + 1})`;
        return "";
    };

    const getNavTitle = (s) => {
        if (!s) return "";
        if (s.type === "INTRO") return "Introduction";
        const base = s._topicTitle || s.title || "Untitled";
        return base;
    };

    const prevSlide = canBack ? allSlides[currentIndex - 1] : null;
    const nextSlide = canNext ? allSlides[currentIndex + 1] : null;

    // Map each module index -> first slide's absolute index in allSlides
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
        // Ensure we are in the slides viewer
        setViewMode('material');
        // Prefer first slide of that module; fallback to 1 (first non-intro) if not found
        const target = moduleFirstSlideIndexMap.get(mIdx);
        if (typeof target === 'number') {
            setCurrentIndex(target);
        } else {
            setCurrentIndex(Math.min(1, allSlides.length - 1));
        }
    };

    const goToRecap = () => setViewMode('recap');

    const isLastContentSlide = currentIndex === total - 1;     // last in allSlides
    const hasNextOrRecap = !isLastContentSlide || viewMode !== 'material';

    const renderMedia = (slide) => {
        const fid = slide?.media?.fileId;
        const src = slide.mediaPreview || (fid ? objectUrlCacheRef.current.get(fid) : null);
        let type = (slide.mediaType ||
            slide.media?.contentType ||
            (fid ? mediaTypeCacheRef.current.get(fid) : "") ||
            ""
        ).toLowerCase();

        if (!src) return null;
        if (!type && slide.media?.filename) {
            const name = slide.media.filename.toLowerCase();
            if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || name.endsWith(".webp")) type = "image/*";
            else if (name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov")) type = "video/*";
            else if (name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a") || name.endsWith(".ogg")) type = "audio/*";
        }

        if (type.startsWith("image/"))
            return <img src={src} alt={slide.title || "slide media"} style={{ width: "100%", height: "auto", borderRadius: 6 }} />;
        if (type.startsWith("video/"))
            return <video src={src} controls style={{ width: "100%", borderRadius: 6 }} />;
        if (type.startsWith("audio/")) return <audio src={src} controls style={{ width: "100%" }} />;
        // Fallback: download link
        const name = slide.media?.filename || "file";
        return <a href={src} download={name}>{name}</a>;
    };

    // --- Sidebar click handling (no design changes) ---
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

    const getSlideDisplayTitle = (s) => {
        if (!s) return "";
        // prefer author title; else fall back to numbered label
        const titled = (s.title && s.title.trim()) || (s.topic && s.topic.trim());
        if (titled) return titled;
        return `${s._moduleTitle || "Module"} ${s._moduleIndex + 1}.${s._slideIndex + 1}`;
    };

    const [assessmentAnswers, setAssessmentAnswers] = useState({});

    const onSelectAnswer = (qid, qIndex, optIndex) => {
        const key = qid || `idx_${qIndex}`;
        setAssessmentAnswers(prev => ({ ...prev, [key]: optIndex }));
    };

    const getVisitorToken = () => sessionStorage.getItem("visitorToken") || "";
    const getVisitorId = () => {
        try {
            const tok = getVisitorToken();
            if (!tok) return null;
            const decoded = jwtDecode(tok);
            return decoded?.userId || decoded?.sub || null;
        } catch { return null; }
    };

    const handleSubmitAssessment = async () => {
        const answers = (course?.formData?.assessment || []).map((q, i) => {
            const key = q.id || `idx_${i}`;
            const selectedIndex = assessmentAnswers[key] ?? null;
            return { questionId: q.id || null, index: i, selectedIndex };
        });

        const visitorToken = getVisitorToken();
        const visitorId = getVisitorId();
        if (!visitorToken || !visitorId) {
            toast.warn("You are not logged in as a visitor.");
            return;
        }

        const body = { userId: visitorId, answers };

        try {
            setIsSubmitting(true);
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/visitorDrafts/submit/${id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${visitorToken}`
                    },
                    body: JSON.stringify(body)
                }
            );

            const raw = await res.text(); // read once
            const json = (() => { try { return JSON.parse(raw); } catch { return null; } })();

            if (!res.ok) {
                throw new Error(json?.error || json?.message || raw || `Submit failed (HTTP ${res.status})`);
            }

            // Expecting: { total, correctCount, scorePercent, passed, passMark, trainee }
            setSubmitResult(json);

            // Rich toast (JSX) so you see line breaks nicely
            toast.success(
                <div>
                    <div><b>Submitted!</b></div>
                    <div>Score: {json.correctCount}/{json.total} ({json.scorePercent}%)</div>
                    <div>Pass mark: {json.passMark}%</div>
                    <div>Status: <b>{json.passed ? "Passed ✅" : "Not passed ❌"}</b></div>
                </div>
            );
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetryAssessment = () => {
        // clear previous submission result
        setSubmitResult(null);
        // clear any previously selected answers (radio inputs)
        setAssessmentAnswers({});
        // make sure we are on the assessment view
        setViewMode('assessment');

        // optional: scroll the assessment container to the top
        try {
            document
                .querySelector('.course-content-body-outline')
                ?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch { }
    };

    const clamp = (n, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

    const parsePercent = (val) => {
        if (val == null) return null;

        if (typeof val === "number" && Number.isFinite(val)) {
            return clamp(Math.round(val));
        }

        const s = String(val).toLowerCase().trim();
        if (!s) return null;

        // explicit completed
        if (s.includes("completed")) return 100;

        const pct = s.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pct) return clamp(Math.round(parseFloat(pct[1])));

        const plain = s.match(/\b(100|[1-9]?\d)\b(?!\s*of)/);
        if (plain) return clamp(parseInt(plain[1], 10));

        return null;
    };

    const readPercentFromBackend = (course) => {
        // Try the most specific places first
        const candidates = [
            course?.trainee?.progressPercent,
            course?.trainee?.progress,
            course?.progressPercent,
            course?.progress,
        ];

        for (const c of candidates) {
            const p = parsePercent(c);
            if (typeof p === "number") return p;
        }
        return 0;
    };

    const persistProgress = async (nextPercent) => {
        const base = process.env.REACT_APP_URL;
        const visitorToken = getVisitorToken();
        if (!visitorToken || !visitorId) {
            return { ok: false, percent: progress };
        }

        try {
            const res = await fetch(`${base}/api/visitorDrafts/progress/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${visitorToken}`,
                },
                body: JSON.stringify({
                    percent: nextPercent, // server is source of truth; we’ll use its reply
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
            setCourse(prev => ({
                ...(prev || {}),
                trainee: {
                    ...(prev?.trainee || {}),
                    progressPercent: returned,
                    progress: `${returned}`,
                },
            }));

            return { ok: true, percent: returned };
        } catch (e) {
            console.warn("Persist progress error", e);
            return { ok: false, percent: progress };
        }
    };

    const indexToPercent = (idx, total) => {
        if (!total || total <= 1) return 0;
        return clamp(Math.round((idx / (total - 1)) * 100));
    };

    const [progress, setProgress] = useState(0);

    // Track the furthest slide the learner has *ever* reached in this session,
    // so we only increment when they cross a new boundary.
    const highestVisitedIndexRef = useRef(0);

    // Just in case we need the numeric user id for the backend call
    const visitorId = useMemo(() => getVisitorId(), [token]);

    const progressPercent = useMemo(() => {
        if (!total || total <= 1) return 0;
        return Math.round((currentIndex / (total - 1)) * 100);
    }, [currentIndex, total]);

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
        return String(d); // already formatted
    };

    const getSlideDurationLabel = (s) => {
        if (!s) return "";
        if (s.type === "INTRO") return formatMinutes(topicDurationMap.intro);
        const tid = s._topicId;
        if (!tid) return "";
        const val = topicDurationMap.map.get(tid);
        return formatMinutes(val);
    };

    return (
        <div className="risk-admin-draft-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="button-container-create">
                        <SidebarButton
                            icon={faClipboardList}
                            text="Induction Outline"
                            onClick={() => setViewMode('outline')}
                            active={viewMode === 'outline'}
                        />
                        <SidebarButton
                            icon={faInfoCircle}
                            text="Introduction"
                            onClick={() => { setViewMode('material'); setCurrentIndex(0); }}
                            active={viewMode === 'material' && currentIndex === 0}
                        />
                        <SidebarButton
                            icon={faBookOpen}
                            text="Induction Material"
                            onClick={() => { setViewMode('material'); setCurrentIndex(1); }}
                            active={viewMode === 'material' && currentIndex > 0}
                        />
                        {/* Scrollable Modules list shown when Induction Material is selected */}
                        {viewMode === 'material' && currentIndex !== 0 && (
                            <div
                                style={{
                                    width: "78.30%",
                                    marginTop: 3,
                                    borderRadius: 6,
                                    backgroundColor: "transparent",
                                    maxHeight: 45,          // <- set height
                                    overflowY: "auto",       // <- scrollable
                                    padding: 8,
                                    paddingLeft: 0,
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                }}
                                aria-label="Modules list"
                            >
                                {Array.isArray(viewModules) && viewModules.length > 0 ? (
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                        {viewModules.map((mod, mIdx) => {
                                            const nr = mIdx + 1;
                                            const title = (mod?.title && String(mod.title).trim()) || `Module ${nr}`;
                                            const firstIdx = moduleFirstSlideIndexMap.get(mIdx);
                                            const isClickable = typeof firstIdx === 'number';

                                            return (
                                                <li
                                                    key={mod?.id || mIdx}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        padding: "2px 6px",
                                                        borderRadius: 4,
                                                        cursor: isClickable ? "pointer" : "default",
                                                        userSelect: "none"
                                                    }}
                                                    onClick={() => isClickable && goToModule(mIdx)}
                                                    role={isClickable ? "button" : undefined}
                                                    tabIndex={isClickable ? 0 : -1}
                                                    onKeyDown={(e) => {
                                                        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                                                            e.preventDefault();
                                                            goToModule(mIdx);
                                                        }
                                                    }}
                                                    title={isClickable ? "Go to first slide" : "No slides available"}
                                                >
                                                    <span style={{ minWidth: 28, textAlign: "right", fontWeight: 700, color: "white" }}>
                                                        {nr}.
                                                    </span>
                                                    <span
                                                        style={{
                                                            flex: 1,
                                                            textDecoration: isClickable ? "underline" : "none",
                                                            color: isClickable ? "white" : "#666"
                                                        }}
                                                    >
                                                        {title}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div style={{ color: "#666", fontSize: 13 }}>No modules found.</div>
                                )}
                            </div>
                        )}
                        <SidebarButton
                            icon={faClipboardList}
                            text="Induction Recap"
                            onClick={() => setViewMode('recap')}
                            active={viewMode === 'recap'}
                        />
                        <SidebarButton
                            icon={faClipboard}
                            text="Assessment"
                            onClick={() => setViewMode('assessment')}
                            active={viewMode === 'assessment'}
                        />
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/visitorInductionMainIcon2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">Visitor Induction</p>
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
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="spacer"></div>
                    <TopBar visitor={true} />
                </div>

                <div className="course-view-box">
                    <div className="course-view-content">
                        {/* Title */}
                        <div className="course-title-row">
                            <div className="course-view-title">
                                {course?.formData?.courseTitle || course?.name || "Course Title"}
                            </div>

                            {/* Progress only for slides viewer (intro + material live inside 'material') */}
                            {viewMode === 'material' && total > 0 && (
                                <div className="viewer-progress">
                                    <div className="viewer-progress-bar">
                                        <div
                                            className={`viewer-progress-bar-fill`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="viewer-progress-label">{progress}%</div>
                                </div>
                            )}
                        </div>

                        {/* === OUTLINE (existing) === */}
                        {viewMode === 'outline' && (
                            <div className="course-content-body-outline">
                                <div className="course-outline-text">
                                    <span style={{ fontWeight: "normal" }}><strong>Department:</strong> {courseOutline?.department || course?.dept || ""}</span>
                                    <span style={{ fontWeight: "normal" }}><strong>Duration:</strong> {formatDuration(courseOutline?.duration)}</span>
                                    <span style={{ fontWeight: "normal" }}><strong>Version Number:</strong> {course?.versionNumber ?? course?.version ?? ""}</span>
                                </div>

                                <div className="course-outline-text" style={{ marginBottom: "0px" }}>
                                    <span style={{ color: "#002060", fontSize: "20px" }}>INDUCTION OUTLINE </span>
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
                                                            <td colSpan={4} style={{ textAlign: "center", fontWeight: 700, backgroundColor: "lightgray" }}>
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
                        )}

                        {/* === COURSE MATERIAL (slides viewer) === */}
                        {viewMode === 'material' && (
                            <>
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
                                                        <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.45, marginBottom: 12, textAlign: "left", color: "black" }}>
                                                            {currentSlide.content}
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, textAlign: "left", color: "black" }}>
                                                            Induction Objectives:
                                                        </div>
                                                        <ul style={{ marginTop: 0, fontSize: 14, color: "black", textAlign: "left" }}>
                                                            {currentSlide.objectives
                                                                .split(/\r?\n/)
                                                                .filter(Boolean)
                                                                .map((line, i) => <li key={i} style={{ marginBottom: 6 }}>{line}</li>)}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="inductionView-card-module-info">
                                                    <div className="inductionView-module-course-content">
                                                        <div className="slide-title-row">
                                                            <div className="slide-title-left">
                                                                {`${currentSlide._moduleIndex + 1}.${currentSlide._topicIndex + 1} ${currentSlide._topicTitle}`}
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
                                                                <div style={{}}>
                                                                    <div className="inductionView-text-box-text" style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.45, textAlign: "left" }}>
                                                                        {currentSlide.content || ""}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(currentSlide.type === SLIDE_TYPES.TEXT_MEDIA) && (
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                                    <div className="inductionView-text-box" style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.45, textAlign: "left", paddingTop: "10px" }}>
                                                                        {currentSlide.content || ""}
                                                                    </div>
                                                                    <div className="inductionView-media-box">{renderMedia(currentSlide)}</div>
                                                                </div>
                                                            )}
                                                            {currentSlide.type === SLIDE_TYPES.MEDIA && (
                                                                <div className="inductionView-media-box">{renderMedia(currentSlide)}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="course-nav-bar">
                                    <div className="nav-text-title" style={{ textAlign: "left" }}>{getNavTitle(prevSlide)}</div>
                                    <button className={`${canBack ? `course-nav-button` : `course-nav-button-disabled`} back`} onClick={goBack} disabled={!canBack} title="Back">
                                        Back
                                    </button>
                                    <button
                                        className={`${(canNext || isLastContentSlide) ? 'course-nav-button' : 'course-nav-button-disabled'} back`}
                                        onClick={isLastContentSlide ? goToRecap : goNext}
                                        disabled={!(canNext || isLastContentSlide)}
                                        title={isLastContentSlide ? "Go to Induction Recap" : "Next"}
                                    >
                                        Next
                                    </button>
                                    <div className="nav-text-title" style={{ textAlign: "right" }}>
                                        {isLastContentSlide ? "Induction Recap" : getNavTitle(nextSlide)}
                                    </div>
                                </div>
                            </>
                        )}

                        {viewMode === 'recap' && (
                            <div className="course-content-body-outline">
                                <div className="recap-card">
                                    <div className="recap-title">INDUCTION RECAP</div>

                                    <div className="recap-content">
                                        {course?.formData?.summary || "No summary provided."}
                                    </div>
                                </div>

                                <div className="course-nav-bar">
                                    <button
                                        type="button"
                                        className="course-nav-button-startAss"
                                        onClick={() => setViewMode('assessment')}
                                        title="Start Assessment"
                                    >
                                        Start Assessment
                                    </button>
                                </div>
                            </div>
                        )}

                        {viewMode === 'assessment' && (
                            <div className="course-content-body-outline">
                                {(() => {
                                    const alreadyPassed = Boolean(course?.trainee?.passed);
                                    const freshlySubmitted = Boolean(submitResult);
                                    const passedNow = freshlySubmitted ? Boolean(submitResult?.passed) : false;
                                    const showPass = alreadyPassed || passedNow;

                                    // decide which score to show
                                    const scorePercent =
                                        freshlySubmitted && typeof submitResult?.scorePercent === 'number'
                                            ? submitResult.scorePercent
                                            : (typeof course?.trainee?.mark === 'number' ? course.trainee.mark : null);

                                    if (showPass) {
                                        return (
                                            // ✅ PASS SCREEN
                                            <div className="assessment-pass-screen">
                                                <div className="assessment-pass-content">
                                                    <div className="assessment-pass-title">
                                                        Congratulations <strong>{course?.requestedBy?.name} {course?.requestedBy?.surname}</strong>, you have completed your induction!
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

                                    if (freshlySubmitted) {
                                        return (
                                            <div className="assessment-fail-screen">
                                                <div className="assessment-pass-content">
                                                    <div className="assessment-pass-title">
                                                        Unfortunately <strong>{course?.requestedBy?.name} {course?.requestedBy?.surname}</strong>, you did not achieve the required score to pass this induction.
                                                    </div>
                                                    <div className="assessment-pass-title" style={{ marginTop: 20, marginBottom: 20 }}>
                                                        <strong>{course?.formData?.courseTitle}</strong>
                                                    </div>
                                                    <div className="assessment-pass-title" style={{ marginTop: 20, marginBottom: 20 }}>
                                                        Please review the course material and retake the assessment to complete your induction successfully.
                                                    </div>
                                                    <div className="assessment-pass-grade">
                                                        <strong>Your Total Grade: </strong>{submitResult?.scorePercent ?? '—'}%
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

                                    // ❓ NOT SUBMITTED YET → show assessment card
                                    return (
                                        <div className="assessment-card">
                                            <div className="assessment-header">ASSESSMENT</div>
                                            <div className="assessment-divider" />
                                            <div className="assessment-meta">
                                                <div style={{ fontWeight: "normal" }}><strong>Assessment Type:</strong> Multi Question Quiz (80% pass mark required)</div>
                                                <div style={{ fontWeight: "normal" }}><strong>Certification:</strong> {course?.formData?.courseTitle || "Induction"} Induction Certificate valid for 12 months</div>
                                            </div>

                                            <div className="assessment-scroll">
                                                {(course?.formData?.assessment || []).map((q, i) => {
                                                    const key = q.id || `idx_${i}`;
                                                    return (
                                                        <div className="assessment-q" key={key}>
                                                            <div className="assessment-q-title" style={{ marginTop: 10 }}>
                                                                {i + 1}. {q.question}
                                                            </div>
                                                            <div className="assessment-options">
                                                                {(q.options || []).map((opt, oi) => (
                                                                    <label className="assessment-option" key={oi}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`q_${key}`}
                                                                            value={oi}
                                                                            checked={assessmentAnswers[key] === oi}
                                                                            onChange={() => onSelectAnswer(q.id, i, oi)}
                                                                        />
                                                                        <span>{opt}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="assessment-footer">
                                                <button
                                                    className="course-nav-button next assessment-submit"
                                                    onClick={handleSubmitAssessment}
                                                    title="Submit Assessment"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? "Submitting…" : "Submit Assessment"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default InductionViewPage;
