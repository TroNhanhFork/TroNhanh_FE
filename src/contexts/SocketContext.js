import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import useUser from "./UserContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useUser();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    // Create the socket once
    useEffect(() => {
        const SOCKET_URL =
            process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

        const s = io(SOCKET_URL, {
            autoConnect: false, // connect manually when user is ready
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
        });

        s.on("connect", () => {
            setIsConnected(true);
            console.log(`[SOCKET] Connected: ${s.id}`);
            // Back-compat if server still expects add-user
            if (user?._id) s.emit("add-user", user._id);
        });

        s.on("disconnect", (reason) => {
            setIsConnected(false);
            console.log(" >>>[SOCKET] Disconnected:", reason);
        });

        s.on("connect_error", (err) => {
            setIsConnected(false);
            console.error(" >>>[SOCKET] Connection error:", err?.message || err);
        });

        s.on("user-added", (data) => {
            console.log(" >>>[SOCKET] User added confirmation:", data);
        });

        socketRef.current = s;

        return () => {
            s.removeAllListeners();
            s.disconnect();
            socketRef.current = null;
        };
    }, []); // once

    // Connect/disconnect when user changes (no page refresh needed)
    useEffect(() => {
        const s = socketRef.current;
        if (!s) return;

        if (user?._id) {
            s.auth = { userId: user._id }; // send in handshake
            if (!s.connected) s.connect();
        } else {
            if (s.connected) s.disconnect();
            setIsConnected(false);
        }
    }, [user?._id]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
            {process.env.NODE_ENV === "development" && (
                <div
                    style={{
                        position: "fixed",
                        top: 10,
                        right: 10,
                        background: isConnected ? "green" : "red",
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        zIndex: 9999,
                    }}
                >
                    Socket: {isConnected ? "Connected" : "Disconnected"}
                </div>
            )}
        </SocketContext.Provider>
    );
};