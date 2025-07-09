import api from "./api";

export const createReport = (payload) => { return api.post("/reports",payload)}