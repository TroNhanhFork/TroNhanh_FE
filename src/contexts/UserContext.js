import { createContext, useContext, useEffect, useState } from "react";
import { getUserInfo } from "../services/profileServices";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({}); 
  const [loading, setLoading] = useState(true); 

  const fetchUser = async () => {
    try {
      const res = await getUserInfo();
      setUser(res.data);
    } catch (err) {
      setUser({});
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser({});
    document.cookie = "token=; Max-Age=0; path=/;"; // clear token nếu dùng cookie
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
