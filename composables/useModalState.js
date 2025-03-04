export const useLoginDialog = () => {
    return useState("loginDialog", () => false);
};
export const useQueueDialog = () => {
    return useState("queueDialog", () => false);
};
