import { useEffect, useState } from "react";
import { Card, Avatar, Tag, List, Button, Spin, message } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import useUser from "../../../contexts/UserContext";
import { useSocket } from "../../../contexts/SocketContext";
import { getRoommatePosts } from "../../../services/roommateAPI";
import { getOrCreateChat } from "../../../services/chatService";

dayjs.extend(relativeTime);

const RoommateCommunity = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creatingChatFor, setCreatingChatFor] = useState(null);
    const navigate = useNavigate();
    const { user } = useUser();
    const { socket } = useSocket();

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await getRoommatePosts();
            setPosts(data || []);
        } catch (err) {
            console.error("Failed to load roommate posts", err);
            message.error("Không thể tải bài đăng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const handleMessage = async (post) => {
        if (!user?._id) {
            message.info("Vui lòng đăng nhập để nhắn tin.");
            return;
        }

        const postUserId = post.userId?._id || post.userId;
        setCreatingChatFor(postUserId);
        try {
            // create or get existing chat between current user and the post author
            const { data: chat } = await getOrCreateChat(user._id, postUserId);

            // join socket room (server should accept this event)
            try {
                // emit primitive id to match Communication's joinRoom usage
                socket?.emit?.("joinRoom", chat._id);
                console.log("Emitted joinRoom", chat._id);
            } catch (e) {
                console.warn("Socket joinRoom emit failed", e);
            }

            // navigate to communication page and pass chatId / otherUserId in state
            // include other user's name/avatar so Communication can show it immediately
            navigate("/customer/communication", {
                state: {
                    chatId: chat._id,
                    otherUserId: postUserId,
                    otherUserName: post.userId?.name,
                    otherUserAvatar: post.userId?.avatar,
                },
            });
        } catch (err) {
            console.error("Failed to create/get chat", err);
            message.error("Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại.");
        } finally {
            setCreatingChatFor(null);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Bảng tin tìm bạn trọ</h2>
            {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <Spin />
                </div>
            ) : (
                <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={posts}
                    locale={{ emptyText: "Chưa có bài đăng tìm bạn trọ" }}
                    renderItem={(post) => {
                        const postAuthorId = post.userId?._id || post.userId;
                        const isAuthor = user && postAuthorId === user._id;
                        return (
                        <List.Item key={post._id}>
                            <Card
                                hoverable
                                title={
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <Avatar
                                            src={post.userId?.avatar ? `http://localhost:5000${post.userId.avatar}` : undefined}
                                            style={{ backgroundColor: "#004d40" }}
                                        >
                                            {!post.userId?.avatar && post.userId?.name?.[0]?.toUpperCase()}
                                        </Avatar>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{post.userId?.name || "Người dùng ẩn danh"}</div>
                                            <div style={{ fontSize: 12, color: "#666" }}>{dayjs(post.createdAt).fromNow()}</div>
                                        </div>
                                    </div>
                                }
                            >
                                <p style={{ fontStyle: "italic" }}>{post.intro}</p>

                                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <Tag color="blue">{post.genderPreference === "male" ? "Nam" : post.genderPreference === "female" ? "Nữ" : "Không quan tâm"}</Tag>
                                    {post.habits?.map((h, idx) => (
                                        <Tag key={idx}>{h}</Tag>
                                    ))}
                                </div>

                                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                    {post.boardingHouseId && (
                                        <Button size="small" onClick={() => navigate(`/customer/property/${post.boardingHouseId}`)}>
                                            Xem nhà trọ
                                        </Button>
                                    )}
                                    {/* Hide message button for the author of the post */}
                                    {!isAuthor && (
                                        <Button
                                            type="primary"
                                            size="small"
                                            onClick={() => handleMessage(post)}
                                            loading={creatingChatFor === post.userId?._id}
                                        >
                                            Nhắn tin
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </List.Item>
                        );
                    }}
                />
            )}
        </div>
    );
};

export default RoommateCommunity;