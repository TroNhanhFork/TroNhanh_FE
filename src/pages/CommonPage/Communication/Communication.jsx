import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Input, Button, message as antMessage, Badge, Modal } from "antd";
import { IoVideocamOutline, IoSendOutline, IoChatbubblesOutline, IoEllipse, IoEllipseOutline } from "react-icons/io5";
import { useSocket } from "../../../contexts/SocketContext";
import useUser from "../../../contexts/UserContext";
import { getUserChatById } from "../../../services/userService";
import "./Communication.css";

const { Search } = Input;

const Communication = ({ role = "customer" }) => {
    const { id: initialOtherUserId } = useParams();
    const { user } = useUser();
    const { socket, onlineUsers } = useSocket();
    const chatBodyRef = useRef(null);

    const [chatList, setChatList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [connected, setConnected] = useState(false);
    const isUserOnline = Array.isArray(onlineUsers) && onlineUsers.includes(selectedUser?.userId);

    const [inCall, setInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callerId, setCallerId] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const [callEnded, setCallEnded] = useState(false);

    const typingTimeoutRef = useRef(null);
    const autoloadedRef = useRef(false);

    const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

    const filteredChats = chatList.filter((chat) =>
        chat.otherUser?.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    // cleanup on logout
    useEffect(() => {
        if (!user) {
            setChatList([]);
            setMessages([]);
            setSelectedUser(null);
            return;
        }
    }, [user]);

    useEffect(() => {
        if (!user?._id) {
            setChatList([]);  // clear chats when user logs out
            return;
        }

        const fetchChats = async () => {
            try {
                const data = await getUserChatById(user._id);
                console.log("Raw chats:", data);
                const transformed = (data || [])
                    .filter(chat => chat?.user1Id && chat?.user2Id && chat.user1Id?._id && chat.user2Id?._id)
                    .map(chat => {
                        const isUser1 = chat.user1Id._id === user?._id;
                        const otherUser = isUser1 ? chat.user2Id : chat.user1Id;
                        const otherUserId = otherUser?._id || "unknown";

                        return {
                            _id: chat._id,
                            otherUser: {
                                userId: otherUserId,
                                name: otherUser?.name || "Unknown",
                                avatar: otherUser?.avatar || "/default-avatar.png",
                            },
                            lastMessage: chat.lastMessage?.content || "",
                            updatedAt: chat.updatedAt,
                        };
                    });

                setChatList(transformed);

                // Auto-load if routed with ?id
                if (initialOtherUserId && !autoloadedRef.current) {
                    const targetChat = transformed.find(
                        (c) => c.otherUser.userId === initialOtherUserId
                    );
                    if (targetChat) {
                        loadChat(targetChat.otherUser);
                        autoloadedRef.current = true;
                    }
                }
            } catch (err) {
                console.error("Error loading chat list:", err);
            }
        };

        fetchChats();
    }, [user?._id, initialOtherUserId]);

    // SOCKET events
    useEffect(() => {
        if (!socket) return;

        setConnected(socket.connected);

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);
        const handleNewMessage = (msg) => {
            if (msg.roomId === chatId) {
                setMessages((prev) => [...prev, msg.message]);
                scrollToBottom();
            }
        };
        const handleTyping = ({ userId, isTyping: typing }) => {
            if (userId === selectedUser?.userId) setIsTyping(typing);
        };

        const handleWebRTCOffer = async ({ fromUserId, offer }) => {
            setCallerId(fromUserId);
            const caller = chatList.find(c => c.otherUser.userId === fromUserId)?.otherUser;
            if (caller) setSelectedUser(caller);
            setIncomingCall(true);

            peerConnectionRef.current = createPeerConnection();
            await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            // preload local camera so remote stream can be negotiated
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach((t) => peerConnectionRef.current.addTrack(t, stream));
        };

        const handleWebRTCAnswer = async ({ answer }) => {
            if (peerConnectionRef.current)
                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(answer)
                );
        };

        const handleICECandidate = async ({ candidate }) => {
            if (peerConnectionRef.current && candidate)
                await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );
        };

        const handleEndCall = ({ fromUserId }) => {
            console.log("📴 Call ended by", fromUserId);
            endCall(true); // remote end
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("newMessage", handleNewMessage);
        socket.on("typing", handleTyping);
        socket.on("webrtc-offer", handleWebRTCOffer);
        socket.on("webrtc-answer", handleWebRTCAnswer);
        socket.on("webrtc-ice-candidate", handleICECandidate);
        socket.on("end-call", handleEndCall);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("newMessage", handleNewMessage);
            socket.off("typing", handleTyping);
            socket.off("webrtc-offer", handleWebRTCOffer);
            socket.off("webrtc-answer", handleWebRTCAnswer);
            socket.off("webrtc-ice-candidate", handleICECandidate);
            socket.off("end-call", handleEndCall);
        };
    }, [socket, chatId, selectedUser?.userId]);

    const scrollToBottom = () => {
        chatBodyRef.current &&
            (chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight);
    };

    useEffect(() => scrollToBottom(), [messages]);

    // reset streams & connections when leaving chat
    useEffect(() => {
        return () => {
            if (peerConnectionRef.current) peerConnectionRef.current.close();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, [selectedUser]);

    const loadChat = async (otherUser) => {
        try {
            setSelectedUser(otherUser);
            const { data: chat } = await axios.post(`${API}/chats/get-or-create`, {
                user1Id: user._id,
                user2Id: otherUser.userId,
            });
            setChatId(chat._id);
            socket?.emit("joinRoom", chat._id);
            const { data: msgs } = await axios.get(`${API}/chats/${chat._id}/messages`);
            setMessages(msgs);
        } catch (err) {
            console.error(err);
            antMessage.error("Failed to load chat");
        }
    };

    // format relative time
    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return "";

        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return "Just now";
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
        if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
        // Over 24 hours → show actual time
        return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !chatId) return;
        try {
            const { data } = await axios.post(`${API}/chats/send`, {
                chatId,
                senderId: user._id,
                content: newMessage,
            });
            socket?.emit("sendMessage", { roomId: chatId, message: data });
            setNewMessage("");
            scrollToBottom();
        } catch {
            antMessage.error("Failed to send");
        }
    };

    const handleTyping = () => {
        if (!socket || !chatId) return;
        socket.emit("typing", { roomId: chatId, isTyping: true });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
            () => socket.emit("typing", { roomId: chatId, isTyping: false }),
            1000
        );
    };

    // WebRTC functions
    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && selectedUser) {
                socket.emit("webrtc-ice-candidate", {
                    toUserId: selectedUser.userId,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("📡 Remote track received:", event.streams);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        return pc;
    };

    const startCall = async () => {
        try {
            if (!selectedUser) {
                return antMessage.warning("Please select someone to call");
            }

            console.log("🎥 Starting call with:", selectedUser.name);

            // Create peer connection
            peerConnectionRef.current = createPeerConnection();

            // Request camera + mic permissions
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            // Show local stream in UI
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Add local tracks to peer connection
            stream.getTracks().forEach((track) => {
                peerConnectionRef.current.addTrack(track, stream);
            });

            // Create offer and set as local description
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);

            // Emit offer via socket to other user
            socket.emit("webrtc-offer", {
                toUserId: selectedUser.userId,
                roomId: chatId,
                offer,
            });

            // Show call modal
            setInCall(true);
        } catch (err) {
            console.error("❌ Error starting call:", err);
            antMessage.error("Failed to start call. Please allow camera/mic access.");
        }
    };

    const acceptCall = async () => {
        try {
            setIncomingCall(false);
            setInCall(true);

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            stream.getTracks().forEach((track) => {
                peerConnectionRef.current.addTrack(track, stream);
            });

            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);

            socket.emit("webrtc-answer", {
                toUserId: callerId,
                roomId: chatId,
                answer,
            });
        } catch (err) {
            console.error("❌ Error accepting call:", err);
        }
    };

    const rejectCall = () => {
        setIncomingCall(false);
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
    };

    const endCall = (fromRemote = false) => {
        if (callEnded) return; // prevent repeated execution
        setCallEnded(true);

        console.log("📴 Call ended", fromRemote ? "(remote)" : "(local)");

        setInCall(false);
        setIncomingCall(false);

        // stop both local and remote streams properly
        if (peerConnectionRef.current) {
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            localVideoRef.current.srcObject = null;
        }

        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            remoteVideoRef.current.srcObject = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }

        // Only emit if you are the one who ended the call manually
        if (!fromRemote && selectedUser?.userId) {
            socket.emit("end-call", { toUserId: selectedUser.userId, roomId: chatId });
        }
    };

    // === RENDER ===
    const otherLabel = role === "customer" ? "Owner" : "Customer";

    return (
        <div className="comm-container">
            {/* Incoming call modal */}
            <Modal
                title="Incoming Call"
                open={incomingCall}
                onOk={acceptCall}
                onCancel={rejectCall}
                okText="Accept"
                cancelText="Reject"
            >
                <p>
                    Incoming video call from <strong>{selectedUser?.name || otherLabel}</strong>
                </p>
            </Modal>

            {/* Video call modal */}
            <Modal
                title="Video Call"
                open={inCall}
                onCancel={endCall}
                footer={[
                    <Button key="end" danger onClick={endCall}>
                        End Call
                    </Button>,
                ]}
                width={800}
            >
                <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                        <p>You</p>
                        <video ref={localVideoRef} autoPlay muted style={{ width: "100%", borderRadius: "8px" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p>{otherLabel}</p>
                        <video ref={remoteVideoRef} autoPlay style={{ width: "100%", borderRadius: "8px" }} />
                    </div>
                </div>
            </Modal>

            {/* Sidebar */}
            <div className="comm-sidebar">
                <div style={{ padding: "10px", borderBottom: "1px solid #e8e8e8" }}>
                    <Search
                        placeholder={`Search ${otherLabel.toLowerCase()}...`}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                <div className="chat-list">
                    {filteredChats.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                            {searchText ? "No results found" : "No conversations yet"}
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <div
                                key={chat._id}
                                className={`chat-item ${selectedUser?.userId === chat.otherUser.userId ? "selected" : ""
                                    }`}
                                onClick={() => loadChat(chat.otherUser)}
                            >
                                <div className="chat-avatar">
                                    <img
                                        src={chat.otherUser?.avatar || "/default-avatar.png"}
                                        alt="avatar"
                                        style={{ width: 45, height: 45, borderRadius: "50%" }}
                                    />
                                </div>

                                <div className="chat-info">
                                    <div className="chat-top">
                                        <div className="chat-name">{chat.otherUser.name}</div>
                                        <div className="chat-time" style={{ fontSize: "0.75rem", color: "#999" }}>
                                            {formatRelativeTime(chat.updatedAt)}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            fontWeight: 500,
                                            color: onlineUsers?.includes(chat.otherUser.userId)
                                                ? "#52c41a" // green for online
                                                : "#ff4d4f", // red for offline
                                        }}
                                    >
                                        {onlineUsers?.includes(chat.otherUser.userId) ? "Online" : "Offline"}
                                    </div>

                                    <div className="chat-preview" style={{ color: "#666" }}>
                                        {chat.lastMessage || "No messages"}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat area */}
            <div className="comm-chat">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <img
                                    src={selectedUser.avatar || "/default-avatar.png"}
                                    alt="avatar"
                                    style={{ width: 40, height: 40, borderRadius: "50%" }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
                                    <div
                                        style={{
                                            fontSize: "0.85rem",
                                            color: isUserOnline ? "#52c41a" : "#ff0000",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                        }}
                                    >
                                        {isUserOnline ? (
                                            <>
                                                <IoEllipse color="#52c41a" size={10} /> Online
                                            </>
                                        ) : (
                                            <>
                                                <IoEllipseOutline color="#ff0000" size={10} /> Offline
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="primary"
                                onClick={startCall}
                                disabled={!connected || inCall}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <IoVideocamOutline size={26} />
                            </Button>
                        </div>

                        <div className="chat-body" ref={chatBodyRef}>
                            {messages.map((msg, idx) => {
                                const senderId = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
                                const isMe = senderId === user?._id;
                                return (
                                    <div key={idx} className={`message ${isMe ? "me" : "other"}`}>
                                        <div className="message-content">{msg.content}</div>
                                        <div className="message-time">{formatRelativeTime(msg.time)}</div>
                                    </div>
                                );
                            })}
                            {isTyping && (
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}
                        </div>

                        <div className="chat-input">
                            <input
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                placeholder="Type a message..."
                                disabled={!connected}
                            />
                            <button onClick={sendMessage} disabled={!connected || !newMessage.trim()}>
                                <IoSendOutline size={22} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div
                        className="empty-chat"
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#aaa", gap: "10px" }}
                    >
                        <IoChatbubblesOutline
                            size={80}
                            color="#aaa"
                        />
                        <div>Select a conversation to start chatting</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Communication;
