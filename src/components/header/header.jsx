
import { Layout, Menu, Dropdown, Avatar, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
  BarChartOutlined,
  MailOutlined,
  MessageOutlined,
  HomeOutlined,
  HeartOutlined,
  SettingOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import useUser from "../../contexts/UserContext";
import "./header.css";

const { Header } = Layout;

const HeaderComponent = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { user, logout, loading } = useUser();


  if (loading) return null;

  const handleLogout = async () => {
    await messageApi.success("Logout successfully", 2);
    logout();
    navigate("/homepage");
  };

  const getUserMenuItems = (role) => {
    const items = [];

    if (role === "customer") {
      items.push(
        {
          key: "my-room",
          label: "My Booking Request",
          icon: <HomeOutlined />,
          onClick: () => {
            navigate("/customer/my-bookings");
          },
        },
        {
          key: "favourite",
          label: "Favourite",
          icon: <HeartOutlined />,
          onClick: () => {
            navigate("/customer/favourite");
          },
        },
        {
          key: "contact",
          label: "Contact & Reports",
          icon: <MailOutlined />,
          onClick: () => {
            navigate("/customer/reports");
          },
        },

      );
    }

    if (role === "owner") {
      items.push(
        {
          key: "manage-room",
          label: "Manage Room",
          icon: <SettingOutlined />,
          onClick: () => {
            navigate("/owner/boarding-house");
          },
        },
        {
          key: "statistics",
          label: "Statistics",
          icon: <BarChartOutlined />,
          onClick: () => navigate("/owner/statistics"),
        }
      );
    }

    if (role === "admin") {
      items.push({
        key: "dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        onClick: () => {
          navigate("/admin/dashboard");
        },
      });
    }

    // COMMON
    items.push(
      {
        key: "profile",
        label: "Profile",
        icon: <UserOutlined />,
        onClick: () => {
          if (role === "customer") navigate("/customer/profile/personal-info");
          else if (role === "owner") navigate("/customer/profile/personal-info");
          else navigate("/profile");
        },
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
          <Link to={"/homepage"}>
            <img src="/Logo_TrọNhanh.png" alt="Logo" className="logo-image" />
          </Link>
        </div>

        <Menu mode="horizontal" className="nav-menu">
          <Menu.Item key="about">
            <Link to="/about" onClick={() => console.log("Menu: /about")}>About Us</Link>
          </Menu.Item>
          {user?.role === "customer" && (
            <>
              <Menu.Item key="chat">
                <Link to="/customer/communication" onClick={() => console.log("Menu: /customer/communication")}>Chat</Link>
              </Menu.Item>
              <Menu.Item key="contact">
                <Link to="/customer/reports" onClick={() => console.log("Menu: /customer/reports")}>Contact & Reports</Link>
              </Menu.Item>
            </>
          )}

          {user?.role === "owner" && (
            <>
              <Menu.Item key="manage-room">
                <Link to="/owner/boarding-house" onClick={() => console.log("Menu: /owner/accommodation")}>Manage Room</Link>
              </Menu.Item>
              <Menu.Item key="chat">
                <Link to="/owner/communication" onClick={() => console.log("Menu: /owner/communication")}>Chat</Link>
              </Menu.Item>
            </>
          )}

          {user?.role === "admin" && (
            <Menu.Item key="admin-page">
              <Link to="/admin/dashboard" onClick={() => console.log("Menu: /admin/dashboard")}>Dashboard</Link>
            </Menu.Item>
          )}
          <Menu.Item key="profile">
            <Link to="/customer/profile/personal-info" onClick={() => console.log("Menu: /customer/profile/personal-info")}>Profile</Link>
          </Menu.Item>
          <Menu.Item key="room">
            <Link to="/customer/search" onClick={() => console.log("Menu: /customer/search")}>Room</Link>
          </Menu.Item>
        </Menu>

        <div className="user-menu">
          {user ? (
            <Dropdown
              menu={{ items: getUserMenuItems(user.role) }}
              placement="bottomRight"
              trigger={["click"]}
              overlayClassName="user-dropdown"
            >
              <div className="user-info">
                <Avatar
                  src={user.avatar || null}
                  className="user-avatar"
                  size={40}
                >
                  {!user.avatar && user.name?.charAt(0)}
                </Avatar>
                <span className="user-name">{user.name || user.email}</span>
                <DownOutlined className="dropdown-icon" />
              </div>
            </Dropdown>
          ) : (
            <div className="auth-buttons">
              <Link to="/login">
                <button className="login-button">Login</button>
              </Link>
              <Link to="/register">
                <button className="register-button">Register</button>
              </Link>
            </div>
          )}
        </div>
      </Header>
    </>
  );
};

export default HeaderComponent;