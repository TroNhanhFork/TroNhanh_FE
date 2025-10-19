// services/roommateAPI.js
import axiosInstance from './axiosInstance';

export const createRoommatePost = async (data) => {
  const res = await axiosInstance.post('/roommates', data);
  return res.data;
};

export const getRoommatePosts = async (boardingHouseId) => {
  const res = await axiosInstance.get(`/roommates/${boardingHouseId}`);
  return res.data.posts;
};
