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

    // Slide nav state
    const [currentIndex, setCurrentIndex] = useState(0);

    // Cache for hydrated media object URLs to avoid duplicates/leaks
    const objectUrlCacheRef = useRef(new Map());

    useEffect(() => {
        const storedToken = sessionStorage.getItem('visitorToken');
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
                console.log(data);
                setErr('');
            } catch (e) {
                if (e.name !== "AbortError") setErr("Failed to load course.");
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [id, token]);

    // Flatten slides across modules for viewer navigation
    const flatSlides = useMemo(() => {
        const modules = course?.formData?.courseModules || [];
        const slides = [];
        modules.forEach((mod, mIdx) => {
            (mod.slides || []).forEach((s, sIdx) => {
                slides.push({
                    ...s,
                    _moduleIndex: mIdx,
                    _slideIndex: sIdx,
                    _moduleTitle: mod?.title || `Module ${mIdx + 1}`,
                });
            });
        });
        return slides;
    }, [course]);

    // Hydrate media previews for viewer (similar to Creation page)
    useEffect(() => {
        let cancelled = false;
        const apiBase = process.env.REACT_APP_URL;
        async function hydrate() {
            const jobs = [];
            for (const s of flatSlides) {
                const media = s?.media;
                if (!media?.fileId) {
                    s.mediaPreview = null;
                    s.mediaType = s.mediaType || media?.contentType || "";
                    continue;
                }

                // Use cache if available
                const cached = objectUrlCacheRef.current.get(media.fileId);
                if (cached) {
                    s.mediaPreview = cached;
                    s.mediaType = media.contentType || s.mediaType || "";
                    continue;
                }

                const url = `${process.env.REACT_APP_URL}/api/visitorDrafts/media/${encodeURIComponent(media.fileId)}`;
                jobs.push(
                    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                        .then(async (res) => {
                            if (!res.ok) throw new Error(`media ${media.fileId} ${res.status}`);
                            const blob = await res.blob();
                            const objUrl = URL.createObjectURL(blob);
                            objectUrlCacheRef.current.set(media.fileId, objUrl);
                            s.mediaPreview = objUrl;
                            s.mediaType = blob.type || media.contentType || "";
                        })
                        .catch(() => {
                            console.warn("Hydrate media failed:", media.fileId, err?.message || err);
                            s.mediaPreview = null;
                            s.mediaType = media?.contentType || "";
                        })
                );
            }
            await Promise.all(jobs);
            if (!cancelled) {
                // trigger re-render by replacing course shallowly
                setCourse((prev) => ({ ...(prev || {}) }));
            }
        }

        if (flatSlides.length) hydrate();
        return () => { cancelled = true; };
    }, [flatSlides.length, token]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            for (const url of objectUrlCacheRef.current.values()) {
                try { URL.revokeObjectURL(url); } catch { }
            }
            objectUrlCacheRef.current.clear();
        };
    }, []);

    const total = flatSlides.length;
    const canBack = currentIndex > 0;
    const canNext = currentIndex < total - 1;

    const goBack = () => { if (canBack) setCurrentIndex((i) => i - 1); };
    const goNext = () => { if (canNext) setCurrentIndex((i) => i + 1); };

    const currentSlide = total > 0 ? flatSlides[currentIndex] : null;

    const renderMedia = (slide) => {
        const type = (slide.mediaType || slide.media?.contentType || "").toLowerCase();
        const src =
            slide.mediaPreview ||
            (slide?.media?.fileId ? objectUrlCacheRef.current.get(slide.media.fileId) : null);

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
    const SidebarButton = ({ icon, text, onClick }) => (
        <button className="but-um" onClick={onClick}>
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

    // Prev/Next label text (used beside the buttons)
    const prevLabel = currentIndex > 0 ? getSlideDisplayTitle(flatSlides[currentIndex - 1]) : (viewMode === 'material' ? "Introduction" : "");
    const nextLabel = (viewMode === 'intro')
        ? (flatSlides[0] ? getSlideDisplayTitle(flatSlides[0]) : "")
        : (currentIndex < total - 1 ? getSlideDisplayTitle(flatSlides[currentIndex + 1]) : "");

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
                        <SidebarButton icon={faClipboardList} text="Course Outline" onClick={() => setViewMode('outline')} />
                        <SidebarButton icon={faInfoCircle} text="Introduction" onClick={() => setViewMode('intro')} />
                        <SidebarButton icon={faBookOpen} text="Course Material" onClick={() => setViewMode('material')} />
                        <SidebarButton icon={faClipboardList} text="Course Recap" onClick={() => setViewMode('recap')} />
                        <SidebarButton icon={faClipboard} text="Assessment" onClick={() => setViewMode('assessment')} />
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
                    <TopBar />
                </div>

                <div className="course-view-box">
                    <div className="course-view-content">
                        {/* Title */}
                        <div className="course-view-title">
                            {course?.formData?.courseTitle || course?.name || "Course Title"}
                        </div>

                        {/* === OUTLINE (existing) === */}
                        {viewMode === 'outline' && (
                            <div className="course-content-body-outline">
                                <div className="course-outline-text">
                                    <span>Department: {courseOutline?.department || course?.dept || ""}</span>
                                    <span>Duration: {formatDuration(courseOutline?.duration)}</span>
                                    <span>Version Number: {course?.versionNumber ?? course?.version ?? ""}</span>
                                </div>

                                <div className="course-outline-text" style={{ marginBottom: "0px" }}>
                                    <span style={{ color: "#002060", fontSize: "20px" }}>COURSE OUTLINE </span>
                                </div>

                                <div className="course-outline-table">
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
                                                            <td colSpan={4} style={{ textAlign: "center" }}>{row.text}</td>
                                                        </tr>
                                                    );
                                                }
                                                if (row.kind === "intro") {
                                                    const duration = row.duration ?? courseOutline?.introDuration;
                                                    const description = row.description ?? courseOutline?.introDescription;
                                                    return (
                                                        <tr key={`i-${i}`}>
                                                            <td style={{ textAlign: "center" }}>{row.nr ?? "0"}</td>
                                                            <td>{row.topic ?? "Introduction"}</td>
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
                                                            <td style={{ textAlign: "center" }}>{row.nr ?? `${(row.moduleIndex ?? 0) + 1}.${(row.slideIndex ?? 0) + 1}`}</td>
                                                            <td>{row.topic}</td>
                                                            <td style={{ textAlign: "center" }}>{fmt(duration)}</td>
                                                            <td>{description}</td>
                                                        </tr>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="course-outline-text">
                                    <span style={{ color: "#002060", fontSize: "20px" }}>ASSESSMENT & CERTIFICATION</span>
                                    <span>Assessment Type: </span>
                                    <span>Certification: </span>
                                </div>
                            </div>
                        )}

                        {/* === COURSE MATERIAL (slides viewer) === */}
                        {viewMode === 'material' && (
                            <>
                                <div className="course-content-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {loading && <div>Loading…</div>}
                                    {err && <div>{err}</div>}
                                    {!loading && !total && <div>No slides available.</div>}

                                    {!loading && total > 0 && currentSlide && (
                                        <>
                                            <div className="inductionView-card-module-info">
                                                {/* Title bar */}
                                                <div className="inductionView-module-course-content">
                                                    <div style={{ fontWeight: 800, fontSize: 22, color: "#0b2f6b", textAlign: "left" }}>
                                                        {`${currentSlide._moduleIndex + 1}.${currentSlide._slideIndex + 1} ${getSlideDisplayTitle(currentSlide)}`}
                                                    </div>
                                                    <div style={{ height: 4, background: "#0b2f6b", borderRadius: 2, marginTop: 8, marginBottom: 10 }} />

                                                    {/* Body panel */}
                                                    <div className="inductionView-slide-content">
                                                        {/* TEXT / MEDIA layout */}
                                                        {(currentSlide.type === SLIDE_TYPES.TEXT || currentSlide.type === SLIDE_TYPES.TEXT_MEDIA) && (
                                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                                                <div className="inductionView-text-box" style={{ whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.45, textAlign: "left" }}>
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
                                        </>
                                    )}
                                </div>

                                <div className="course-nav-bar">
                                    <button className="course-nav-button back" onClick={goBack} disabled={!canBack} title="Back">
                                        <FontAwesomeIcon icon={faChevronLeft} /> Back
                                    </button>
                                    <div style={{ color: "#002060", fontWeight: 700 }}>
                                        {total ? `Slide ${currentIndex + 1} of ${total}` : ""}
                                    </div>
                                    <button className="course-nav-button next" onClick={goNext} disabled={!canNext} title="Next">
                                        Next <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>
                            </>
                        )}

                        {viewMode === 'intro' && (
                            <>
                                <div className="course-content-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ background: "#fff", borderRadius: 8, padding: 14 }} className="inductionView-intro">
                                        <div style={{ fontWeight: 800, fontSize: 22, color: "#0b2f6b", textAlign: "left" }}>
                                            INTRODUCTION
                                        </div>
                                        <div style={{ height: 4, background: "#0b2f6b", borderRadius: 2, marginTop: 8, marginBottom: 10 }} />

                                        <div className="inductionView-intro-center">
                                            <div style={{ whiteSpace: "pre-wrap", fontSize: 18, lineHeight: 1.45, marginBottom: 12, textAlign: "left", color: "black" }}>
                                                {course?.formData?.intorduction || "No introduction provided."}
                                            </div>

                                            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, textAlign: "left", color: "black" }}>Course Objectives:</div>
                                            <ul style={{ marginTop: 0, fontSize: 18, color: "black", textAlign: "left" }}>
                                                {(course?.formData?.courseObjectives || "")
                                                    .split(/\r?\n/)
                                                    .filter(Boolean)
                                                    .map((line, i) => <li key={i} style={{ marginBottom: 6 }}>{line}</li>)
                                                }
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="course-nav-bar">
                                    <button className="course-nav-button back" onClick={goBack} disabled={!canBack} title="Back">
                                        <FontAwesomeIcon icon={faChevronLeft} /> Back
                                    </button>
                                    <div style={{ color: "#002060", fontWeight: 700 }}>
                                        {total ? `Slide ${currentIndex + 1} of ${total}` : ""}
                                    </div>
                                    <button className="course-nav-button next" onClick={goNext} disabled={!canNext} title="Next">
                                        Next <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>
                            </>
                        )}

                        {viewMode === 'recap' && (
                            <div className="course-content-body-outline ">
                                <div style={{ background: "#fff", borderRadius: 8, padding: 14, height: "100%" }}>
                                    <div style={{ fontWeight: 800, fontSize: 22, color: "#0b2f6b", textAlign: "left", marginBottom: "10px" }}>
                                        COURSE RECAP
                                    </div>

                                    <div style={{ whiteSpace: "pre-wrap", fontSize: 18, lineHeight: 1.45, marginBottom: 12, textAlign: "left", color: "black" }}>
                                        {course?.formData?.summary || "No summary provided."}
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === 'assessment' && (
                            <div className="course-content-body-outline">
                                {submitResult?.passed ? (
                                    // ✅ PASS SCREEN
                                    <div className="assessment-pass-screen">
                                        <div className="assessment-pass-content">
                                            <div className="assessment-pass-title">Congratulations!</div>
                                            <div className="assessment-pass-grade">{submitResult.scorePercent}%</div>
                                            <div className="assessment-pass-sub">You passed the assessment.</div>
                                        </div>
                                    </div>
                                ) : (
                                    // ❓ NOT PASSED / NOT SUBMITTED YET → show regular assessment card
                                    <div className="assessment-card">
                                        <div className="assessment-header">ASSESSMENT</div>
                                        <div className="assessment-divider" />
                                        <div className="assessment-meta">
                                            <div><b>Assessment Type:</b> Multi Question Quiz</div>
                                            <div><b>Certification:</b> {course?.formData?.courseTitle || "Induction"} Certificate</div>
                                        </div>

                                        <div className="assessment-scroll">
                                            {(course?.formData?.assessment || []).map((q, i) => (
                                                <div className="assessment-q" key={q.id || i}>
                                                    <div className="assessment-q-title" style={{ marginTop: "10px" }}>
                                                        {i + 1}. {q.question}
                                                    </div>
                                                    <div className="assessment-options">
                                                        {(q.options || []).map((opt, oi) => {
                                                            const key = q.id || `idx_${i}`;
                                                            return (
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
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
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
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InductionViewPage;
