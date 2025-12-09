import axiosLib from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.zelton.co.in";

const axios = axiosLib.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    "Accept": "application/json",
  },
});

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axios;
