import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import { Input, Button, message as antMessage, Modal, Avatar } from "antd";
import { IoVideocamOutline, IoSendOutline, IoChatbubblesOutline, IoEllipse, IoEllipseOutline } from "react-icons/io5";
import { useSocket } from "../../../contexts/SocketContext";
import useUser from "../../../contexts/UserContext";
import { getUserChatById } from "../../../services/userService";
import "./Communication.css";

const { Search } = Input;

const Communication = ({ role = "customer" }) => {
    const { id: initialOtherUserId } = useParams();
    const location = useLocation();
    const { user } = useUser();
    const { socket, onlineUsers } = useSocket();
    const chatBodyRef = useRef(null);

    const name = user?.name || "Tên Owner";

    const [chatList, setChatList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [connected, setConnected] = useState(false);
    const isUserOnline = Array.isArray(onlineUsers) && onlineUsers.includes(selectedUser?.userId);

    // --- WebRTC State & Refs ---
    const [inCall, setInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callerId, setCallerId] = useState(null);
    const [callEnded, setCallEnded] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    
    // FIX: Thêm hàng đợi ICE Candidate để tránh mất gói tin khi chưa connect xong
    const iceCandidatesQueue = useRef([]); 
    const incomingOfferRef = useRef(null);

    const typingTimeoutRef = useRef(null);
    const autoloadedRef = useRef(false);

    const API = process.env.REACT_APP_API_URL || "https://tronhanh-be.onrender.com/api";

    const filteredChats = chatList.filter((chat) =>
        chat.otherUser?.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    // --- 1. CLEANUP & INITIAL LOAD ---
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
            setChatList([]); 
            return;
        }

        const fetchChats = async () => {
            try {
                const data = await getUserChatById(user._id);
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

                if (!autoloadedRef.current) {
                    const stateOther = location?.state?.otherUserId;
                    const stateChatId = location?.state?.chatId;

                    if (stateOther) {
                        const otherUserObj = {
                            userId: stateOther,
                            name: location?.state?.otherUserName,
                            avatar: location?.state?.otherUserAvatar,
                        };
                        await loadChat(otherUserObj);
                        autoloadedRef.current = true;
                    } else if (initialOtherUserId) {
                        const targetChat = transformed.find((c) => c.otherUser.userId === initialOtherUserId);
                        if (targetChat) {
                            await loadChat(targetChat.otherUser);
                            autoloadedRef.current = true;
                        }
                    } else if (stateChatId) {
                        const targetChat = transformed.find((c) => c._id === stateChatId);
                        if (targetChat) {
                            await loadChat(targetChat.otherUser);
                            autoloadedRef.current = true;
                        } else {
                            try {
                                setChatId(stateChatId);
                                socket?.emit?.("joinRoom", stateChatId);
                                const { data: msgs } = await axios.get(`${API}/chats/${stateChatId}/messages`);
                                setMessages(msgs);
                                autoloadedRef.current = true;
                            } catch (e) {
                                console.warn('Failed to load chat by id from state', e);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading chat list:", err);
            }
        };

        fetchChats();
    }, [user?._id, initialOtherUserId, location?.state]);

    // --- 2. SOCKET EVENTS ---
    useEffect(() => {
        if (!socket) return;

        setConnected(socket.connected);

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);
        
        const handleNewMessage = (msg) => {
            const roomId = msg.roomId;
            const incomingMsg = msg.message || msg;

            setChatList((prev) => {
                const idx = prev.findIndex((c) => c._id === roomId);
                const updatedAt = incomingMsg.time || new Date().toISOString();
                const lastMessageText = incomingMsg.content || incomingMsg.text || "";

                if (idx === -1) {
                    return [
                        {
                            _id: roomId,
                            otherUser: { userId: null, name: "Unknown" },
                            lastMessage: lastMessageText,
                            updatedAt,
                        },
                        ...prev,
                    ];
                }

                const updated = { ...prev[idx], lastMessage: lastMessageText, updatedAt };
                const others = prev.slice(0, idx).concat(prev.slice(idx + 1));
                return [updated, ...others];
            });

            if (roomId === chatId) {
                setMessages((prev) => [...prev, incomingMsg]);
                scrollToBottom();
            }
        };

        const handleTyping = ({ userId, isTyping: typing }) => {
            if (userId === selectedUser?.userId) setIsTyping(typing);
        };

        const handleEndCall = ({ fromUserId }) => {
            console.log("📴 Call ended by", fromUserId);
            endCall(true);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("newMessage", handleNewMessage);
        socket.on("typing", handleTyping);
        socket.on("end-call", handleEndCall);

        // Forwarded WebRTC events
        const onOffer = (e) => handleWebRTCOfferLocal(e.detail || {});
        const onAnswer = (e) => handleWebRTCAnswerLocal(e.detail || {});
        const onIce = (e) => handleICECandidateLocal(e.detail || {});

        window.addEventListener("webrtc-offer", onOffer);
        window.addEventListener("webrtc-answer", onAnswer);
        window.addEventListener("webrtc-ice-candidate", onIce);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("newMessage", handleNewMessage);
            socket.off("typing", handleTyping);
            socket.off("end-call", handleEndCall);

            window.removeEventListener("webrtc-offer", onOffer);
            window.removeEventListener("webrtc-answer", onAnswer);
            window.removeEventListener("webrtc-ice-candidate", onIce);
        };
    }, [socket, chatId, selectedUser?.userId]);

    const scrollToBottom = () => {
        chatBodyRef.current &&
            (chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight);
    };

    useEffect(() => scrollToBottom(), [messages]);

    // --- 3. WEBRTC LOGIC (FIXED) ---

    // Reset cleanup when leaving chat or component unmounts
    useEffect(() => {
        return () => {
            if (peerConnectionRef.current) peerConnectionRef.current.close();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            iceCandidatesQueue.current = []; // Clear queue
        };
    }, [selectedUser]);

    // Attach local stream to video element
    useEffect(() => {
        if (inCall && localStreamRef.current) {
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        }
        return () => {
            if (!inCall && localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
        };
    }, [inCall]);

    // Helper: Process queued ICE candidates
    const processIceQueue = async () => {
        if (!peerConnectionRef.current) return;
        while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            try {
                console.log("🧊 Processing queued ICE candidate");
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.warn("Failed to add queued ICE candidate:", err);
            }
        }
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const targetId = callerId || selectedUser?.userId;
                if (targetId) {
                    socket?.emit?.("webrtc-ice-candidate", {
                        toUserId: targetId,
                        candidate: event.candidate,
                    });
                }
            }
        };

        pc.ontrack = (event) => {
            console.log("📡 Remote track received:", event.streams);
            // FIX: Use streams[0] or create new stream from track
            const remoteStream = event.streams[0] || new MediaStream([event.track]);
            
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                // Attempt to play if autoplay is blocked
                remoteVideoRef.current.play().catch(e => console.error("Autoplay error:", e));
            }
        };

        return pc;
    };

    // --- START CALL (Caller) ---
    const startCall = async () => {
        try {
            if (!selectedUser) return antMessage.warning("Please select someone to call");
            
            setCallEnded(false);
            iceCandidatesQueue.current = []; // Reset queue for new call

            peerConnectionRef.current = createPeerConnection();

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach((t) => peerConnectionRef.current.addTrack(t, stream));

            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);

            socket?.emit?.("webrtc-offer", {
                toUserId: selectedUser.userId,
                roomId: chatId,
                offer,
            });

            setInCall(true);
        } catch (err) {
            console.error("❌ Error starting call:", err);
            antMessage.error("Failed to start call. Check camera permissions.");
        }
    };

    // --- INCOMING CALL (Receiver) ---
    const handleWebRTCOfferLocal = async ({ fromUserId, offer }) => {
        console.log("📞 Incoming offer from:", fromUserId);
        const callerFromList = chatList.find((c) => c.otherUser?.userId === fromUserId);
        const callerName = callerFromList?.otherUser?.name || "Caller";
        
        setSelectedUser({ userId: fromUserId, name: callerName });
        setCallerId(fromUserId);
        incomingOfferRef.current = offer;
        iceCandidatesQueue.current = []; // Reset queue for incoming call
        setIncomingCall(true);
    };

    // --- ACCEPT CALL (Receiver) ---
    const acceptCall = async () => {
        try {
            setIncomingCall(false);
            setCallEnded(false);
            setInCall(true);

            peerConnectionRef.current = createPeerConnection();

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach((t) => peerConnectionRef.current.addTrack(t, stream));

            if (incomingOfferRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
                // FIX: Process any ICE candidates that arrived while waiting
                processIceQueue();
            }

            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);

            socket?.emit?.("webrtc-answer", {
                toUserId: callerId,
                roomId: chatId,
                answer,
            });

            incomingOfferRef.current = null;
        } catch (err) {
            console.error("❌ Error accepting call:", err);
        }
    };

    const rejectCall = () => {
        setIncomingCall(false);
        incomingOfferRef.current = null;
        iceCandidatesQueue.current = [];
    };

    // --- HANDLE ANSWER (Caller) ---
    const handleWebRTCAnswerLocal = async ({ answer }) => {
        console.log("📞 Received answer");
        if (peerConnectionRef.current && answer) {
            if (!peerConnectionRef.current.currentRemoteDescription) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                // FIX: Process ICE queue now that remote description is set
                processIceQueue();
            }
        }
    };

    // --- HANDLE ICE CANDIDATE (Both) ---
    const handleICECandidateLocal = async ({ candidate }) => {
        if (candidate) {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                // Connection ready -> Add immediately
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.warn("Failed to add remote ICE candidate:", err);
                }
            } else {
                // Connection NOT ready -> Queue it
                console.log("🧊 Queueing ICE candidate (RemoteDesc not set yet)");
                iceCandidatesQueue.current.push(candidate);
            }
        }
    };

    const endCall = (fromRemote = false) => {
        if (callEnded) return;
        setCallEnded(true);
        setInCall(false);
        setIncomingCall(false);

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

        if (remoteVideoRef.current) {
            if (remoteVideoRef.current.srcObject) {
                remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            }
            remoteVideoRef.current.srcObject = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }

        iceCandidatesQueue.current = [];

        if (!fromRemote && selectedUser?.userId) {
            socket?.emit?.("end-call", { toUserId: selectedUser.userId, roomId: chatId });
        }
    };

    // --- API & UTILS ---
    const loadChat = async (otherUser) => {
        try {
            const otherUserId = typeof otherUser === "string" ? otherUser : otherUser?.userId;
            const otherUserName = typeof otherUser === "string" ? undefined : otherUser?.name;

            if (!otherUserId) {
                antMessage.error("Invalid user to open chat");
                return;
            }

            setSelectedUser({ userId: otherUserId, name: otherUserName || "Unknown" });

            const { data: chat } = await axios.post(`${API}/chats/get-or-create`, {
                user1Id: user._id,
                user2Id: otherUserId,
            });

            setChatId(chat._id);
            socket?.emit?.("joinRoom", chat._id);

            const { data: msgs } = await axios.get(`${API}/chats/${chat._id}/messages`);
            setMessages(msgs);
        } catch (err) {
            console.error(err);
            antMessage.error("Failed to load chat");
        }
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
            
            setChatList((prev) => {
                const idx = prev.findIndex((c) => c._id === chatId);
                const updatedAt = data.time || new Date().toISOString();
                const lastMessageText = data.content || data.text || newMessage;

                if (idx === -1) {
                    return [
                        {
                            _id: chatId,
                            otherUser: selectedUser || { userId: null, name: "Unknown" },
                            lastMessage: lastMessageText,
                            updatedAt,
                        },
                        ...prev,
                    ];
                }

                const updated = { ...prev[idx], lastMessage: lastMessageText, updatedAt };
                const others = prev.slice(0, idx).concat(prev.slice(idx + 1));
                return [updated, ...others];
            });
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

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return "";
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        
        if (diffSec < 60) return "Just now";
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
        if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
        return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const [timeTick, setTimeTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTimeTick(t => t + 1), 10000);
        return () => clearInterval(interval);
    }, []);

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
                <p>Incoming video call from <strong>{selectedUser?.name || otherLabel}</strong></p>
            </Modal>

            {/* Video call modal */}
            <Modal
                title="Video Call"
                open={inCall}
                onCancel={() => endCall(false)}
                footer={[
                    <Button key="end" danger onClick={() => endCall(false)}>
                        End Call
                    </Button>,
                ]}
                width={800}
            >
                <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                        <p>You</p>
                        <video ref={localVideoRef} autoPlay muted style={{ width: "100%", borderRadius: "8px", background: "#000" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p>{otherLabel}</p>
                        <video ref={remoteVideoRef} autoPlay style={{ width: "100%", borderRadius: "8px", background: "#000" }} />
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
                                className={`chat-item ${selectedUser?.userId === chat.otherUser.userId ? "selected" : ""}`}
                                onClick={() => loadChat(chat.otherUser)}
                            >
                                <div className="chat-avatar">
                                    <Avatar
                                        size={39}
                                        src={chat.otherUser.avatar}
                                        style={{
                                            fontSize: 19,
                                            color: "white",
                                            background: chat.otherUser.avatar ? "transparent" : "linear-gradient(to right, #064749, #c4f7d8)",
                                            border: "2px solid white",
                                            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                                        }}
                                    >
                                        {!chat.otherUser.avatar && chat.otherUser.name?.charAt(0)}
                                    </Avatar>
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
                                            color: onlineUsers?.includes(chat.otherUser.userId) ? "#52c41a" : "#ff4d4f",
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
                                <div>
                                    <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
                                    <div style={{ fontSize: "0.85rem", color: isUserOnline ? "#52c41a" : "#ff0000", display: "flex", alignItems: "center", gap: "4px" }}>
                                        {isUserOnline ? <><IoEllipse color="#52c41a" size={10} /> Online</> : <><IoEllipseOutline color="#ff0000" size={10} /> Offline</>}
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
                                    <span></span><span></span><span></span>
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
                    <div className="empty-chat" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#aaa", gap: "10px" }}>
                        <IoChatbubblesOutline size={80} color="#aaa" />
                        <div>Select a conversation to start chatting</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Communication;