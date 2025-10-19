import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import useUser from "./UserContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, loading } = useUser();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    // Create the socket instance once
    useEffect(() => {
        const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

        console.log("🔧 [SOCKET] Initializing socket instance...");

        const s = io(SOCKET_URL, {
            autoConnect: false,
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
        });

        s.on("connect", () => {
            setIsConnected(true);
            console.log(`✅ [SOCKET] Connected: ${s.id}`);
        });

        s.on("disconnect", (reason) => {
            setIsConnected(false);
            console.log(`❌ [SOCKET] Disconnected: ${reason}`);
        });

        s.on("connect_error", (err) => {
            setIsConnected(false);
            console.error(`⚠️ [SOCKET] Connection error:`, err?.message || err);
        });

        s.on("user-added", (data) => {
            console.log("👤 [SOCKET] User added confirmation:", data);
        });

        // Chat events
        s.on("newMessage", (message) => {
            console.log("💬 [SOCKET] New message:", message);
        });

        s.on("typing", ({ userId, roomId, isTyping }) => {
            console.log(
                `⌨️ [SOCKET] User ${userId} is ${isTyping ? "typing" : "stopped typing"
                } in room ${roomId}`
            );
        });

        s.on("user-joined", ({ userId, roomId }) => {
            console.log(`👋 [SOCKET] User ${userId} joined room ${roomId}`);
        });

        s.on("user-left", ({ userId, roomId }) => {
            console.log(`👋 [SOCKET] User ${userId} left room ${roomId}`);
        });

        // WebRTC events
        s.on("webrtc-offer", ({ fromUserId, offer }) => {
            console.log(`📞 [SOCKET] Received offer from ${fromUserId}`);
        });

        s.on("webrtc-answer", ({ fromUserId, answer }) => {
            console.log(`📞 [SOCKET] Received answer from ${fromUserId}`);
        });

        s.on("webrtc-ice-candidate", ({ fromUserId, candidate }) => {
            console.log(`🧊 [SOCKET] Received ICE candidate from ${fromUserId}`);
        });

        s.on("end-call", ({ fromUserId }) => {
            console.log(`📴 [SOCKET] Call ended by ${fromUserId}`);
        });

        s.on("user-offline", ({ toUserId }) => {
            console.log(`🔴 [SOCKET] User ${toUserId} is offline`);
        });

        socketRef.current = s;

        return () => {
            console.log("🧹 [SOCKET] Cleaning up socket instance");
            s.removeAllListeners();
            s.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Connect/disconnect when user changes (wait for loading to finish)
    useEffect(() => {
        if (loading) {
            console.log("⏳ [SOCKET] Waiting for user to load...");
            return;
        }

        const s = socketRef.current;
        if (!s) {
            console.log("⚠️ [SOCKET] Socket instance not ready");
            return;
        }

        console.log("🔍 [SOCKET] User state changed:", user?._id || "no user");

        if (user?._id) {
            s.auth = { userId: user._id };

            if (!s.connected) {
                console.log(`🔌 [SOCKET] Connecting for user ${user._id}...`);
                s.connect();
            } else {
                console.log(
                    `🔌 [SOCKET] Already connected, emitting add-user for ${user._id}`
                );
                s.emit("add-user", user._id);
            }
        } else {
            if (s.connected) {
                console.log(`🔌 [SOCKET] Disconnecting (no user)...`);
                s.disconnect();
            }
            setIsConnected(false);
        }
    }, [user?._id, loading]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
            {process.env.NODE_ENV === "development" && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 10,
                        right: 10,
                        background: isConnected ? "#22c55e" : "#ef4444",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        zIndex: 9999,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                >
                    Socket: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                </div>
            )}
        </SocketContext.Provider>
    );
};