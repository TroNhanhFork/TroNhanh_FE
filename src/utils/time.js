import moment from "moment";

export const formatTimeAgo = (timestamp) => {
    return moment(timestamp).fromNow();
};
