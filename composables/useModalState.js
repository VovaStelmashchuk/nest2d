export const useLoginDialog = () => {
    return useState("loginDialog", () => false);
};
export const useResultDialog = () => {
    return useState("resultDialog", () => false);
};
