export const getAutoManualNavigationRoute = (row) => {
    if (row?._taskSource !== "autoManual") return null;
    if (row?.closeStatus) return null; // No navigation for closed tasks

    const sourceType = String(row?.sourceType || "").toLowerCase();
    const sourceSystem = String(row?.sourceSystem || "").toLowerCase();
    const systemType = String(row?.systemType || "").toLowerCase();
    const sourceId = row?.sourceId;
    const sourceCourseId = row?.sourceCourseId || row?.courseId || row?.courseID || sourceId;
    const studentId = row?.studentId;

    console.log("getAutoManualNavigationRoute debug:", {
        sourceType,
        sourceSystem,
        systemType,
        sourceId,
        sourceCourseId,
        studentId,
    });

    if (sourceType === "mark") {
        if (!sourceCourseId || !studentId) return null;
        return `/FrontendDMS/gradeSubmission/${studentId}/${sourceCourseId}`;
    }

    if (sourceType === "draft") {
        if (!sourceId) return null;
        if (!sourceSystem) return null;

        if (sourceSystem === "tms") {
            if (systemType === "course") {
                return `/FrontendDMS/onlineCreateCourse/${sourceId}`;
            } else if (systemType === "visitor") {
                return `/FrontendDMS/inductionCreation/${sourceId}`;
            }
        }
        else if (sourceSystem === "dds") {
            if (systemType === "procedure") {
                return `/FrontendDMS/documentCreateProc/Procedure/${sourceId}`;
            } else if (systemType === "standard") {
                return `/FrontendDMS/documentCreateStand/Standard/${sourceId}`;
            }
        }
        else if (sourceSystem === "rms") {
            if (systemType === "ibra") {
                return `/FrontendDMS/riskIBRA/IBRA/${sourceId}`;
            } else if (systemType === "blra") {
                return `/FrontendDMS/riskBLRA/BLRA/${sourceId}`;
            } else if (systemType === "jra") {
                return `/FrontendDMS/riskJRA/JRA/${sourceId}`;
            }
        }
    }

    if (sourceType === "published") {
        if (!sourceId) return null;
        if (!sourceSystem) return null;

        if (sourceSystem === "tms") {
            if (systemType === "course") {
                return `/FrontendDMS/onlineReviewCourse/${sourceId}`;
            } else if (systemType === "visitor") {
                return `/FrontendDMS/inductionReview/${sourceId}`;
            }
        }
        else if (sourceSystem === "dds") {
            if (systemType === "procedure") {
                return `/FrontendDMS/review/${sourceId}`;
            } else if (systemType === "standard") {
                return `/FrontendDMS/reviewStandard/${sourceId}/standard`;
            }
        }
        else if (sourceSystem === "rms") {
            if (systemType === "ibra") {
                return `/FrontendDMS/reviewIBRA/${sourceId}/IBRA`;
            } else if (systemType === "blra") {
                return `/FrontendDMS/reviewBLRA/${sourceId}/BLRA`;
            } else if (systemType === "jra") {
                return `/FrontendDMS/reviewJRA/${sourceId}/JRA`;
            }
        }
    }

    return null;
};