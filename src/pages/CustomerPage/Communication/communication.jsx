import React, { useEffect, useState } from "react";
import axios from "axios";
import { Input, Button, List, Typography } from "antd";
import { useLocation, useParams } from "react-router-dom";
import { useSocket } from "../../../contexts/SocketContext";
import useUser from "../../../contexts/UserContext";
import { getUserById } from "../../../services/userService";
const { TextArea } = Input;

const Communication = () => {
  const { id: userId } = useParams();
  const { user } = useUser(); // ✅ Use logged-in owner from context
  const socket = useSocket();

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await axios.post("http://localhost:5000/api/chats/get-or-create", {
          user1Id: user._id,
          user2Id: userId,
        });
        console.log("👤 Res from URL:", res);

        const chat = res.data;
        setChatId(chat._id);
        if (socket) {
          socket.emit("joinRoom", chat._id);
        }
        console.log("ChatID: ", chat._id)
        const msgRes = await axios.get(`http://localhost:5000/api/chats/${chat._id}/messages`);
        const rawMessages = msgRes.data;

        // Enrich sender info
        const enrichedMessages = await Promise.all(
          rawMessages.map(async (msg) => {
            if (!msg.senderId.name) {
              const user = await getUserById(msg.senderId); // senderId is just ID
              return { ...msg, senderId: user };
            }
            return msg;
          })
        );

        setMessages(enrichedMessages);
      } catch (error) {
        console.error("Error fetching chat:", error);
      }
    };
    if (userId && user?._id && socket) {
      fetchChat();
    }
  }, [userId, user, socket]);


  useEffect(() => {
    if (!socket) return;

    const handleIncoming = async (message) => {
      if (!message.senderId.name) {
        const user = await getUserById(message.senderId);
        message.senderId = user;
      }
      setMessages((prev) => [...prev, message]);
    };

    socket.on("newMessage", handleIncoming);
    return () => socket.off("newMessage", handleIncoming);
  }, [socket]);


  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      chatId,
      senderId: user._id,
      content: newMessage,
    };

    await axios.post("http://localhost:5000/api/chats/send", message);
    socket.emit("sendMessage", message);
    setNewMessage("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>💬 Chat</h2>

      <List
        bordered
        dataSource={messages}
        renderItem={(item) => (
          <List.Item>
            <Typography.Text strong>
              {item.senderId._id === user._id ? "You" : item.senderId.name}
            </Typography.Text>
            : {item.content}
          </List.Item>
        )}
        style={{ marginBottom: 20, maxHeight: 300, overflowY: "auto" }}
      />

      <TextArea
        rows={2}
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message..."
      />

      <Button
        type="primary"
        onClick={sendMessage}
        style={{ marginTop: 10, width: "100%" }}
      >
        Send
      </Button>
    </div>
  );
};

export default Communication;