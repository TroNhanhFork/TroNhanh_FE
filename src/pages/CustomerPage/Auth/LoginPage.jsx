// file: LoginPage.jsx
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  message as antMessage
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { login, saveAccessToken } from '../../../services/authService';
import { initAutoLogout } from '../../../services/autoLogout';
import useUser from '../../../contexts/UserContext';
import styles from './LoginPage.module.css';

const { Title } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { fetchUser } = useUser();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = antMessage.useMessage();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);
      saveAccessToken(res.data.accessToken, 30 * 60 * 1000, res.data.refreshToken);
      await fetchUser();
      initAutoLogout();

      const role = res.data.user.role?.toLowerCase();
      if (['admin', 'owner', 'customer'].includes(role)) {
        navigate('/homepage');
      } else {
        messageApi.error('Role không hợp lệ hoặc chưa được phân quyền!');
        return;
      }
      messageApi.success('Login successful!');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors)) {
        form.setFields(errors.map(error => ({
          name: error.param,
          errors: [error.msg],
        })));
      } else {
        messageApi.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      {/* Left Video Banner */}
      <div className={styles.leftPane}>
        <video
          className={styles.video}
          src={require('../../../assets/images/Login.mp4')}
          autoPlay
          loop
          muted
        />
      </div>

      {/* Right Form */}
      <div className={styles.rightPane}>
        {contextHolder}
        <Form layout="vertical" form={form} onFinish={onFinish} className={styles.formBox}>
  <Title level={2} className={styles.title}>Welcome Back 👋</Title>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please enter your email!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#49735A' }} />}
              placeholder="Enter your email"
              type="email"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#49735A' }} />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className={styles.submitButton}
            >
              <LoginOutlined />
              Login
            </Button>
          </Form.Item>

          <Form.Item>
            <p className={styles.login}>
              Don't have an account? <a href="/register">Register</a>
            </p>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;

