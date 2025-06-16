import { createContext, useContext, useState, useEffect } from "react";
import { getUserInfo } from "../services/profileServices";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Để kiểm tra trạng thái tải ban đầu

  const fetchUser = async () => {
    try {
      const res = await getUserInfo();
      setUser(res.data);
    } catch (err) {
      setUser(null); // Khi token không hợp lệ hoặc hết hạn
    } finally {
      setLoading(false); // Tải xong dù thành công hay thất bại
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false); 
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default useUser;
