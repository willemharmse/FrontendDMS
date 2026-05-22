export const getAutoAutoNavigationRoute = (row) => {
    if (row?._taskSource !== "autoAuto") return null;
    if (row?.closeStatus) return null; // No navigation for closed tasks

    const sourceSystem = String(row?.sourceSystem || "").toLowerCase();
    const sourceId = row?.sourceId;
    const fileType = row?.fileType ? String(row.fileType) : "";
    const assetId = row?.assetID;
    const assetType = row?.assetType ? String(row.assetType) : "";

    if (sourceSystem === "dms") {
        if (!fileType) return;
        return `/FrontendDMS/documentManage/${fileType}/${sourceId}`;
    }

    if (sourceSystem === "epams") {
        if (!assetType) return;
        return `/FrontendDMS/flameManageSub/${assetType}/${assetId}/${sourceId}`;
    };
}