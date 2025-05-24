export const useLoginDialog = () => {
    return useState("loginDialog", () => false);
};
export const useResultDialog = () => {
    return useState("resultDialog", () => false);
};
export const useScreenshotDialog = () => {
    return useState("screenshotDialog", () => false);
};
export const useFileDialog = () => {
    return useState("fileDialog", () => false);
};
export const useFullScreen = () => {
    return useState("isFullScreen", () => false);
}
export const useSupportDialog = () => {
    return useState("supportDialog", () => false);
};