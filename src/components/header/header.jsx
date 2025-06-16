import { Layout, Menu, Button, Dropdown, Avatar, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
  PlusOutlined,
  TransactionOutlined,
  MailOutlined,
  MessageOutlined,
  HomeOutlined,
  HeartOutlined,
  SettingOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import useUser from "../../hooks/useUser"; 
import "./header.css";

const { Header } = Layout;

const HeaderComponent = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { user, logout } = useUser(); 

  const handleLogout = async () => {
    await messageApi.success("Logout successfully", 2);
    logout(); // gọi hàm trong context
    navigate("/");
  };

  const getUserMenuItems = (userRoles) => {
    const hasRole = (roleName) => userRoles?.some((r) => r.name === roleName);
    const items = [];

    if (hasRole("CUSTOMER")) {
      items.push(
        {
          key: "my-room",
          label: "My Room",
          icon: <HomeOutlined />,
          onClick: () => navigate("/customer/my-room"),
        },
        {
          key: "favourite",
          label: "Favourite",
          icon: <HeartOutlined />,
          onClick: () => navigate("/customer/favourite"),
        }
      );
    }

    if (hasRole("OWNER")) {
      items.push(
        {
          key: "manage-room",
          label: "Manage Room",
          icon: <SettingOutlined />,
          onClick: () => navigate("/owner/manage-room"),
        },
        {
          key: "transaction",
          label: "Transaction",
          icon: <TransactionOutlined />,
          onClick: () => navigate("/owner/transaction"),
        }
      );
    }

    if (hasRole("ADMIN")) {
      items.push({
        key: "dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        onClick: () => navigate("/admin/dashboard"),
      });
    }

    items.push(
      {
        key: "profile",
        label: "Profile",
        icon: <UserOutlined />,
        onClick: () => navigate("/customer/profile/personal-info"),
      },
      {
        key: "contact",
        label: "Contact & Reports",
        icon: <MailOutlined />,
        onClick: () => navigate("/contact"),
      },
      {
        key: "chat",
        label: "Chat",
        icon: <MessageOutlined />,
        onClick: () => navigate("/chat"),
      },
      {
        key: "logout",
        label: "Logout",
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      }
    );

    return items;
  };

  return (
    <>
      {contextHolder}
      <Header className="header">
        <div className="logo">
          <Link to={"/"}>
            <img src="/" alt="Logo" className="logo-image" />
            <span className="logo-text">Tro Nhanh</span>
          </Link>
        </div>

        <Menu mode="horizontal" className="nav-menu">
          <Menu.Item key="about">
            <Link to="/about-us">About Us</Link>
          </Menu.Item>
          {user.roles?.some(role => role.name === "USER") && (
            <Menu.Item key="bookings">
              <Link to="/user/rent-room">Rent Room</Link>
            </Menu.Item>
          )}
          <Menu.Item key="contact">
            <Link to="/contact">Contact & Reports</Link>
          </Menu.Item>
          <Menu.Item key="chat">
            <Link to="/chat">Chat</Link>
          </Menu.Item>
          <Menu.Item key="profile">
            <Link to="/customer/profile/personal-info">Profile</Link>
          </Menu.Item>
          {user.roles?.some(role => role.name === "CUSTOMER") && (
            <Menu.Item key="room">
              <Link to="/customer/room">My Room</Link>
            </Menu.Item>
          )}
          {user.roles?.some(role => role.name === "OWNER") && (
            <Menu.Item key="owner">
              <Link to="/owners/calendar">Room Owner</Link>
            </Menu.Item>
          )}
          {user.roles?.some(role => role.name === "ADMIN") && (
            <Menu.Item key="admin-page">
              <Link to="/admin/dashboard">Dashboard</Link>
            </Menu.Item>
          )}
        </Menu>

        <div className="user-menu">
          <Dropdown
            menu={{ items: getUserMenuItems(user.roles || []) }}
            placement="bottomRight"
            trigger={["click"]}
            overlayClassName="user-dropdown"
          >
            <div className="user-info">
              <Avatar src={user.avatar || null} className="user-avatar" size={40}>
                {!user.avatar && user.name?.charAt(0)}
              </Avatar>
              <span className="user-name">{user.name || user.email}</span>
              <DownOutlined className="dropdown-icon" />
            </div>
          </Dropdown>
        </div>
      </Header>
    </>
  );
};

export default HeaderComponent;
