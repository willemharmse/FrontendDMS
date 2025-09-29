import React, { useMemo, useEffect } from "react";

// --- helpers -------------------------------------------------
const parseDurationToMinutes = (raw) => {
    if (raw == null) return 0;
    const s = String(raw).trim();
    if (!s) return 0;

    // Support "H:MM"
    if (/^\d+:\d{1,2}$/.test(s)) {
        const [h, m] = s.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
    }
    // Support "1.5h", "2h", "90m", "45 min"
    const h = s.match(/^(\d+(\.\d+)?)\s*h/i);
    if (h) return Math.round(parseFloat(h[1]) * 60);

    const m = s.match(/^(\d+(\.\d+)?)\s*m(in)?/i);
    if (m) return Math.round(parseFloat(m[1]));

    // Plain number -> minutes
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : 0;
};

const formatMinutes = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
};

const getSlideMeta = (outline, slideId) =>
    (outline?.slideMeta && outline.slideMeta[slideId]) || { duration: "", description: "" };

const buildOutlineTable = (modules, outline) => {
    const rows = [];

    // Row 0 — Introduction
    rows.push({
        kind: "intro",
        nr: "0",
        topic: "Introduction",
        duration: outline?.introDuration || "",
        description: outline?.introDescription || "",
    });

    // Modules & slides
    modules.forEach((mod, mIdx) => {
        rows.push({
            kind: "module",
            moduleIndex: mIdx,
            text: `Module ${mIdx + 1}: ${mod.title || "Module Title"}`,
        });

        (mod.slides || []).forEach((slide, sIdx) => {
            const meta = getSlideMeta(outline, slide.id);
            rows.push({
                kind: "slide",
                moduleIndex: mIdx,
                slideIndex: sIdx,
                slideId: slide.id,
                nr: `${mIdx + 1}.${sIdx + 1}`,
                topic: slide.title || "Slide Title",
                duration: meta.duration || "",
                description: meta.description || "",
            });
        });
    });

    return rows;
};

const shallowEqualJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// -------------------------------------------------------------

const InductionOutline = ({ formData, setFormData }) => {
    const modules = formData?.courseModules || [];
    const outline = formData?.courseOutline || {};

    // minutes from Introduction + all slideMeta durations
    const totalMinutes = useMemo(() => {
        const introMin = parseDurationToMinutes(outline?.introDuration);
        let sum = introMin;

        for (const mod of modules) {
            for (const slide of mod.slides || []) {
                const meta = getSlideMeta(outline, slide.id);
                sum += parseDurationToMinutes(meta?.duration);
            }
        }
        return sum;
    }, [outline?.introDuration, outline?.slideMeta, modules]);

    const totalPretty = useMemo(() => formatMinutes(totalMinutes), [totalMinutes]);

    // Keep courseOutline.duration in sync (read-only UI)
    useEffect(() => {
        setFormData((prev) => {
            const prevOutline = prev?.courseOutline || {};
            if (prevOutline.duration === totalPretty) return prev;
            return {
                ...prev,
                courseOutline: { ...prevOutline, duration: totalPretty },
            };
        });
    }, [totalPretty, setFormData]);

    // Maintain a denormalized snapshot table under courseOutline.table
    useEffect(() => {
        const nextTable = buildOutlineTable(modules, outline);
        setFormData((prev) => {
            const prevOutline = prev?.courseOutline || {};
            if (shallowEqualJSON(prevOutline.table, nextTable)) return prev;
            return {
                ...prev,
                courseOutline: { ...prevOutline, table: nextTable },
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modules, outline?.introDuration, outline?.introDescription, outline?.slideMeta]);

    // ---- updaters that ONLY touch courseOutline ----
    const updateOutline = (patch) =>
        setFormData((prev) => ({
            ...prev,
            courseOutline: { ...(prev.courseOutline || {}), ...patch },
        }));

    const updateIntro = (field, value) =>
        updateOutline({ [field]: value });

    const updateSlideMeta = (slideId, field, value) =>
        setFormData((prev) => {
            const co = prev.courseOutline || {};
            const cur = (co.slideMeta && co.slideMeta[slideId]) || {};
            const nextSlideMeta = {
                ...(co.slideMeta || {}),
                [slideId]: { ...cur, [field]: value },
            };
            return { ...prev, courseOutline: { ...co, slideMeta: nextSlideMeta } };
        });

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">Outline</h3>

                {/* Top bar: Department + Auto Duration */}
                <div className="course-outline-row-split">
                    <div className="course-outline-type-split-1">
                        <h3 className="font-fam-labels">Department</h3>
                        <input
                            value={outline.department || ""}
                            onChange={(e) => updateOutline({ department: e.target.value })}
                            type="text"
                            autoComplete="off"
                            className="course-outline-input"
                            placeholder="Insert Department Name"
                        />
                    </div>

                    <div className="course-outline-type-split-2">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h3 className="font-fam-labels">Duration</h3>
                        </div>
                        <input
                            value={outline.duration || totalPretty}
                            readOnly
                            className="course-outline-input"
                            placeholder="Auto Calculated"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="course-outline-table-content table-borders">
                    <table>
                        <thead>
                            <tr>
                                <th className="col-num-course-outline-data">Nr</th>
                                <th className="col-topic-course-outline-data">Topic</th>
                                <th className="col-time-course-outline-data">Duration (Minutes)</th>
                                <th className="col-desc-course-outline-data">Description</th>
                            </tr>
                        </thead>

                        <tbody>
                            {/* 0 — Introduction */}
                            <tr>
                                <td className="col-um">0</td>
                                <td className="col-um" style={{ textAlign: "left" }}>
                                    Introduction
                                </td>
                                <td className="col-um" style={{ textAlign: "left" }}>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        value={outline.introDuration || ""}
                                        onChange={(e) => updateIntro("introDuration", e.target.value)}
                                        className="course-outline-input"
                                        placeholder="Insert Duration"
                                    />
                                </td>
                                <td className="col-um">
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        value={outline.introDescription || ""}
                                        onChange={(e) => updateIntro("introDescription", e.target.value)}
                                        className="course-outline-input"
                                        placeholder="Insert Topic Description"
                                    />
                                </td>
                            </tr>

                            {/* Modules */}
                            {modules.map((mod, mIdx) => (
                                <React.Fragment key={mod.id || mIdx}>
                                    {/* Module header row (merged) */}
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center", fontWeight: 600, backgroundColor: "#d6d6d6ff" }}>
                                            {`Module ${mIdx + 1}: ${mod.title || "Module Title"}`}
                                        </td>
                                    </tr>

                                    {/* Slides */}
                                    {(mod.slides || []).map((slide, sIdx) => {
                                        const meta = getSlideMeta(outline, slide.id);
                                        return (
                                            <tr key={slide.id || sIdx}>
                                                <td className="col-um">{`${mIdx + 1}.${sIdx + 1}`}</td>
                                                <td className="col-um" style={{ textAlign: "left" }}>
                                                    {slide.title || "Slide Title"}
                                                </td>
                                                <td className="col-um" style={{ textAlign: "left" }}>
                                                    <input
                                                        type="text"
                                                        autoComplete="off"
                                                        value={meta.duration || ""}
                                                        onChange={(e) => updateSlideMeta(slide.id, "duration", e.target.value)}
                                                        className="course-outline-input"
                                                        placeholder="Insert Duration"
                                                    />
                                                </td>
                                                <td className="col-um">
                                                    <input
                                                        type="text"
                                                        autoComplete="off"
                                                        value={meta.description || ""}
                                                        onChange={(e) =>
                                                            updateSlideMeta(slide.id, "description", e.target.value)
                                                        }
                                                        className="course-outline-input"
                                                        placeholder="Insert Topic Description"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default InductionOutline;
