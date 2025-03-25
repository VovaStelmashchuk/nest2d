export const useLoginDialog = () => {
    return useState("loginDialog", () => false);
};
export const useResultDialog = () => {
    return useState("resultDialog", () => false);
};
export const useFileDialog = () => {
    return useState("fileDialog", () => false);
};
export const useFullScreen = () => {
    return useState("isFullScreen", () => false);
}