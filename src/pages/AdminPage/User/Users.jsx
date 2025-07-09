import React, { useState, useEffect } from 'react';
import { Table, Tag, Avatar, Space, Button, Modal, message, Input } from 'antd';
import { UserOutlined, EyeOutlined, EditOutlined, LockOutlined, UnlockOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import UserStatsDashboard from './UserStatsDashboard';
import UserDetailsModal from './UserDetailsModal';
import UserEditModal from './UserEditModal';
import UserSearch from "./UserSearch";
import { getAllUsers, lockUnlockUser, editUserInfo, deleteUser, isAuthenticated } from './services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    fullName: "",
    email: "",
    gender: undefined,
    role: undefined,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | null
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users from API
  const fetchUsers = async (page = 1, pageSize = 10, searchFilters = {}) => {
    try {
      setLoading(true);
      
      // Filter out empty values from search filters
      const cleanFilters = {};
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key] !== undefined && searchFilters[key] !== null && searchFilters[key] !== '') {
          cleanFilters[key] = searchFilters[key];
        }
      });
      
      const params = {
        page: page - 1, // API uses 0-based pagination
        size: pageSize,
        ...cleanFilters
      };

      const response = await getAllUsers(params);

      // Handle the actual API response structure
      let users = [];
      let total = 0;

      if (response.success && response.data && response.data.users) {
        // Standard API response structure
        users = response.data.users;
        total = response.data.pagination?.totalUsers || response.data.users.length;
      } else if (Array.isArray(response)) {
        // Fallback: Direct array response
        users = response;
        total = response.length;
        
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: Response wrapped in data property
        users = response.data;
        total = response.data.length;
        console.log('Array in data property detected');
      } else {
        console.log('Unknown response structure:', response);
      }


      // Transform data to match frontend expectations
      const transformedUsers = users.map(user => {
        // Handle isMembership field - could be boolean or string
        let isMembership = false;
        if (user.isMembership === true || user.isMembership === 'active') {
          isMembership = true;
        } else if (user.isMembership === false || user.isMembership === 'none' || user.isMembership === null || user.isMembership === undefined) {
          isMembership = false;
        }

        return {
          id: user._id || user.id,
          fullName: user.name || user.fullName,
          email: user.email,
          phoneNumber: user.phone || user.phoneNumber,
          gender: user.gender?.toLowerCase() || 'unknown',
          avatarUrl: user.avatar || user.avatarUrl || '',
          isLocked: user.status === 'banned' || user.status === 'inactive' || user.isLocked || false,
          roles: user.role ? [{ id: 1, name: user.role.charAt(0).toUpperCase() + user.role.slice(1) }] : (user.roles || []),
          membership: user.status === 'active' ? 'active' : 'none',
          isMembership: isMembership, // Use processed boolean value
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          status: user.status,
          isDeleted: user.isDeleted || false
        };
      });

      setUsers(transformedUsers);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: total,
        pageSize,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });

      if (error.message === 'Authentication failed. Please login again.') {
        message.error('Your session has expired. Please login again.');
      } else {
        message.error(error.message || 'Failed to fetch users. Please try again.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeComponent = async () => {
      console.log('Initializing Users component...');

      // Check if token exists
      if (!isAuthenticated()) {
        Object.keys(localStorage).forEach(key => {
        });

        // Check for common token key names
        const commonTokenKeys = ['accessToken', 'access_token', 'token', 'authToken', 'jwt', 'bearerToken'];
        commonTokenKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            console.log(`Found token with key "${key}":`, value.substring(0, 50) + '...');
          }
        });

        message.error('No authentication token found');
        // Commented out redirect for debugging
        // window.location.href = '/login';
        return;
      }

      // Try to fetch data - if token is invalid, the interceptor will handle it
      try {
        await fetchUsers();
      } catch (error) {
        // Error is already handled by the interceptor and fetchUsers function
      }
    };

    initializeComponent();
  }, []);

  // Handle pagination change
  const handleTableChange = (pagination) => {
    fetchUsers(pagination.current, pagination.pageSize, filters);
  };

  // Handle search/filter
  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
    fetchUsers(1, pagination.pageSize, searchFilters);
  };

  // Handle view user details
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setModalType('view');
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalType('edit');
  };

  // Handle lock/unlock user
  const handleToggleLock = async (user) => {
    try {
      await lockUnlockUser(user.id, {
        isLocked: !user.isLocked,
        reason: `${!user.isLocked ? 'Lock' : 'Unlock'} user account`
      });

      message.success(`User ${!user.isLocked ? 'locked' : 'unlocked'} successfully`);
      // Refresh the current page data
      fetchUsers(pagination.current, pagination.pageSize, filters);
    } catch (error) {
      console.error('Error toggling user lock:', error);
      if (error.message === 'Authentication failed. Please login again.') {
        message.error('Your session has expired. Please login again.');
      } else {
        message.error(error.message || 'Failed to update user status. Please try again.');
      }
    }
  };

  // Handle save user (edit)
  const handleSaveUser = async (updatedUser) => {
    try {
      await editUserInfo(updatedUser.id, updatedUser);
      message.success('User updated successfully');
      // Refresh the current page data
      fetchUsers(pagination.current, pagination.pageSize, filters);
      setModalType(null);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.message === 'Authentication failed. Please login again.') {
        message.error('Your session has expired. Please login again.');
      } else {
        message.error(error.message || 'Failed to update user. Please try again.');
      }
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  // Handle delete user - show confirmation modal
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteModalVisible(true);
    setDeleteConfirmText('');
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      message.error('Please type "DELETE" to confirm deletion');
      return;
    }

    try {
      await deleteUser(userToDelete.id);
      message.success('User deleted successfully');
      // Refresh the current page data
      fetchUsers(pagination.current, pagination.pageSize, filters);
      setDeleteModalVisible(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.message === 'Authentication failed. Please login again.') {
        message.error('Your session has expired. Please login again.');
      } else {
        message.error(error.message || 'Failed to delete user. Please try again.');
      }
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setUserToDelete(null);
    setDeleteConfirmText('');
  };

  // Debug function to check authentication
  const debugAuth = () => {
    const token = localStorage.getItem('token'); // Use correct key

    if (token) {

      // Try to decode JWT payload (if it's a JWT)
      try {
      } catch (e) {
      }
    }
  };

  // Add debug button in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugAuth = debugAuth;
    }
  }, []);

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      render: (avatarUrl) => (
        <Avatar src={avatarUrl} icon={<UserOutlined />} />
      ),
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => {
        let color = 'default';
        if (gender === 'male') color = 'blue';
        else if (gender === 'female') color = 'magenta';
        else if (gender === 'other') color = 'purple';
        return <Tag color={color}>{gender?.charAt(0).toUpperCase() + gender?.slice(1) || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <Space>
          {roles?.map(role => (
            <Tag key={role.id} color={role.name === 'Owner' ? 'purple' : 'blue'}>
              {role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.isLocked ? 'red' : 'green'}>
            {record.isLocked ? 'Locked' : 'Active'}
          </Tag>
          {/* Show membership status only for User and Owner roles */}
          {record.roles?.some(role => role.name === 'Owner' || role.name === 'User') && (
            <Tag color={record.isMembership ? 'green' : 'orange'}>
              Membership: {record.isMembership ? 'Active' : 'None'}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            style={{ border: 'none', display: 'inline-block' }}
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            title="View Details"
          />
          <Button
            style={{ border: 'none', display: 'inline-block' }}
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            title="Edit User"
          />
          <Button
            style={{ border: 'none', display: 'inline-block' }}
            icon={!record.isLocked ? <UnlockOutlined /> : <LockOutlined style={{ color: "blue" }} />}
            title={!record.isLocked ? "Lock Account" : "Unlock Account"}
            danger={!record.isLocked}
            onClick={() => handleToggleLock(record)}
          />
          <Button
            style={{ border: 'none', display: 'inline-block' }}
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteUser(record)}
            title="Delete User"
          />
        </Space>
      ),
    }
  ];

  const roleOptions = ["Admin", "Owner", "Customer"];

  return (
    <div >
      <h1 style={{ marginBottom: 24 }}>Users Management</h1>

      <UserStatsDashboard />

      <div style={{
        marginBottom: '16px',
        padding: '16px 24px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <UserSearch
          filters={filters}
          setFilters={handleSearch}
          roleOptions={roleOptions}
        />
      </div>

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
            style: { padding: '16px 24px' }
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: loading ? 'Loading...' : 'No users found'
          }}
          style={{ borderRadius: '8px' }}
        />
      </div>

      <Modal
        open={modalType === 'view'}
        onCancel={handleCloseModal}
        footer={null}
        title="User Profile Details"
        width={600}
        style={{ borderRadius: '8px' }}
      >
        <UserDetailsModal user={selectedUser} />
      </Modal>

      <Modal
        open={modalType === 'edit'}
        onCancel={handleCloseModal}
        footer={null}
        title="Edit User"
        width={600}
      >
        <UserEditModal
          user={selectedUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f' }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Delete User Account
          </div>
        }
        open={deleteModalVisible}
        onCancel={handleCancelDelete}
        footer={[
          <Button key="cancel" onClick={handleCancelDelete}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleConfirmDelete}
            disabled={deleteConfirmText !== 'DELETE'}
          >
            Delete User
          </Button>,
        ]}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 16, color: '#262626' }}>
            <strong>Warning:</strong> This action cannot be undone. This will permanently delete the user account and all associated data.
          </p>
          <p style={{ marginBottom: 16, color: '#262626' }}>
            <strong>User to delete:</strong> {userToDelete?.fullName} ({userToDelete?.email})
          </p>
          <p style={{ marginBottom: 8, color: '#262626' }}>
            Please type <strong style={{ color: '#ff4d4f' }}>DELETE</strong> to confirm:
          </p>
          <Input
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleConfirmDelete}
            style={{ marginBottom: 16 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Users;