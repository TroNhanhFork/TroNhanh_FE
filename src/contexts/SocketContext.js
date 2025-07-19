import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    setSocket(s);

    s.on("connect", () => {
      console.log("🔌 Connected to socket:", s.id);
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
    });

    return () => s.disconnect();
  }, []);




  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};