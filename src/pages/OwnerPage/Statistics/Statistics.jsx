
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, message } from 'antd';
import {
  HomeOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import useUser from '../../../contexts/UserContext';
import './Statistics.css';

const Statistics = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalAccommodations: 0,
    availableAccommodations: 0,
    bookedAccommodations: 0,
    unavailableAccommodations: 0,
    totalRevenue: 0,
    totalBookings: 0,
    monthlyRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [topAccommodations, setTopAccommodations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchStatistics();
      fetchRecentBookings();
      fetchTopAccommodations();
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      // Fetch accommodations
      const accommodationsRes = await axios.get(`http://localhost:5000/api/accommodation?ownerId=${user._id}`);
      const accommodations = accommodationsRes.data;

      const totalAccommodations = accommodations.length;
      const availableAccommodations = accommodations.filter(acc => acc.status === 'Available').length;
      const bookedAccommodations = accommodations.filter(acc => acc.status === 'Booked').length;
      const unavailableAccommodations = accommodations.filter(acc => acc.status === 'Unavailable').length;

      // Calculate revenue (mock data for now)
      const totalRevenue = bookedAccommodations * 2500000; // Example calculation
      const monthlyRevenue = totalRevenue * 0.3; // 30% of total for this month

      setStats({
        totalAccommodations,
        availableAccommodations,
        bookedAccommodations,
        unavailableAccommodations,
        totalRevenue,
        totalBookings: bookedAccommodations,
        monthlyRevenue
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      messageApi.error('Unable to load statistics!');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      // Mock data for recent bookings
      const mockBookings = [
        {
          key: '1',
          customerName: 'John Doe',
          accommodationTitle: 'Ocean View Studio',
          bookingDate: '2024-01-15',
          amount: 2500000,
          status: 'paid'
        },
        {
          key: '2',
          customerName: 'Jane Smith',
          accommodationTitle: '2BR Downtown Apartment',
          bookingDate: '2024-01-14',
          amount: 3200000,
          status: 'pending'
        },
        {
          key: '3',
          customerName: 'Mike Johnson',
          accommodationTitle: 'Beachside Homestay',
          bookingDate: '2024-01-13',
          amount: 1800000,
          status: 'paid'
        }
      ];
      setRecentBookings(mockBookings);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const fetchTopAccommodations = async () => {
    try {
      // Mock data for top accommodations
      const mockTopAccommodations = [
        {
          key: '1',
          title: 'Ocean View Studio',
          bookings: 15,
          revenue: 37500000,
          rating: 4.8
        },
        {
          key: '2',
          title: '2BR Downtown Apartment',
          bookings: 12,
          revenue: 38400000,
          rating: 4.6
        },
        {
          key: '3',
          title: 'Beachside Homestay',
          bookings: 8,
          revenue: 14400000,
          rating: 4.9
        }
      ];
      setTopAccommodations(mockTopAccommodations);
    } catch (error) {
      console.error('Error fetching top accommodations:', error);
    }
  };

  const recentBookingsColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Accommodation',
      dataIndex: 'accommodationTitle',
      key: 'accommodationTitle',
    },
    {
      title: 'Booking Date',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => new Date(date).toLocaleDateString('en-US'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount.toLocaleString()} VND`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>
          {status === 'paid' ? 'Paid' : 'Pending'}
        </Tag>
      ),
    },
  ];

  const topAccommodationsColumns = [
    {
      title: 'Accommodation',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Bookings Count',
      dataIndex: 'bookings',
      key: 'bookings',
      render: (bookings) => `${bookings} bookings`,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => `${revenue.toLocaleString()} VND`,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <div className="rating-display">
          <TrophyOutlined style={{ color: '#49735A', marginRight: '4px' }} />
          {rating}/5
        </div>
      ),
    },
  ];

  const occupancyRate = stats.totalAccommodations > 0 
    ? Math.round((stats.bookedAccommodations / stats.totalAccommodations) * 100) 
    : 0;

  // Chart data with all 3 statuses
  const occupancyData = [
    {
      type: 'Booked',
      value: stats.bookedAccommodations,
    },
    {
      type: 'Available', 
      value: stats.availableAccommodations,
    },
    {
      type: 'Unavailable',
      value: stats.unavailableAccommodations,
    }
  ].filter(item => item.value > 0); // Only show statuses that have values

  const pieConfig = {
    data: occupancyData,
    angleField: 'value',
    colorField: 'type',
    color: ['#1890ff', '#52c41a', '#ff4d4f'], // Blue, Green, Red
    radius: 0.8,
    innerRadius: 0.4,
    legend: false,
    autoFit: true,
    statistic: {
      title: {
        style: {
          fontSize: '14px',
          color: '#666',
        },
        content: 'Total',
      },
      content: {
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
        },
        content: `${stats.totalAccommodations}`,
      },
    },
  };

  return (
    <>
      {contextHolder}
      <div className="statistics-wrapper">
        <h2 className="page-title">Statistics Dashboard</h2>
        
        {/* Overview Cards */}
        <Row gutter={[24, 24]} className="stats-cards">
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Accommodations"
                value={stats.totalAccommodations}
                prefix={<HomeOutlined className="stat-icon" />}
                valueStyle={{ color: '#49735A' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Booked"
                value={stats.bookedAccommodations}
                prefix={<UserOutlined className="stat-icon" />}
                valueStyle={{ color: '#49735A' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Monthly Revenue"
                value={stats.monthlyRevenue}
                prefix={<DollarOutlined className="stat-icon" />}
                formatter={(value) => `${value.toLocaleString()} VND`}
                valueStyle={{ color: '#49735A' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Revenue"
                value={stats.totalRevenue}
                prefix={<DollarOutlined className="stat-icon" />}
                formatter={(value) => `${value.toLocaleString()} VND`}
                valueStyle={{ color: '#49735A' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Occupancy Rate */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={12}>
            <Card className="chart-card" title={
              <div className="card-title">
                <CalendarOutlined /> Occupancy Rate
              </div>
            }>
              <div className="occupancy-container">
                {stats.totalAccommodations > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <div style={{ flex: '0 0 auto', textAlign: 'center', position: 'relative' }}>
                      <svg width="160" height="160" viewBox="0 0 160 160">
                        <defs>
                          <circle
                            id="circle"
                            cx="80"
                            cy="80"
                            r="70"
                            fill="none"
                            strokeWidth="12"
                          />
                        </defs>
                        
                        {/* Background circle */}
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="#f0f0f0"
                          strokeWidth="12"
                        />
                        
                        {/* Booked segment */}
                        {stats.bookedAccommodations > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="none"
                            stroke="#1890ff"
                            strokeWidth="12"
                            strokeDasharray={`${(stats.bookedAccommodations / stats.totalAccommodations) * 440} 440`}
                            strokeDashoffset="0"
                            transform="rotate(-90 80 80)"
                          />
                        )}
                        
                        {/* Available segment */}
                        {stats.availableAccommodations > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="none"
                            stroke="#52c41a"
                            strokeWidth="12"
                            strokeDasharray={`${(stats.availableAccommodations / stats.totalAccommodations) * 440} 440`}
                            strokeDashoffset={`-${(stats.bookedAccommodations / stats.totalAccommodations) * 440}`}
                            transform="rotate(-90 80 80)"
                          />
                        )}
                        
                        {/* Unavailable segment */}
                        {stats.unavailableAccommodations > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="none"
                            stroke="#ff4d4f"
                            strokeWidth="12"
                            strokeDasharray={`${(stats.unavailableAccommodations / stats.totalAccommodations) * 440} 440`}
                            strokeDashoffset={`-${((stats.bookedAccommodations + stats.availableAccommodations) / stats.totalAccommodations) * 440}`}
                            transform="rotate(-90 80 80)"
                          />
                        )}
                      </svg>
                      
                      {/* Center text */}
                      <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center' 
                      }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>Total</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                          {stats.totalAccommodations}
                        </div>
                      </div>
                    </div>
                    <div className="occupancy-summary" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          backgroundColor: '#1890ff', 
                          borderRadius: '50%', 
                          marginRight: '8px' 
                        }}></span>
                        <span style={{ fontSize: '14px', color: '#666' }}>Booked ({stats.bookedAccommodations})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          backgroundColor: '#52c41a', 
                          borderRadius: '50%', 
                          marginRight: '8px' 
                        }}></span>
                        <span style={{ fontSize: '14px', color: '#666' }}>Available ({stats.availableAccommodations})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          backgroundColor: '#ff4d4f', 
                          borderRadius: '50%', 
                          marginRight: '8px' 
                        }}></span>
                        <span style={{ fontSize: '14px', color: '#666' }}>Unavailable ({stats.unavailableAccommodations})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No accommodation data available</p>
                  </div>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="chart-card" title={
              <div className="card-title">
                <TrophyOutlined /> Top Accommodations
              </div>
            }>
              <Table
                dataSource={topAccommodations}
                columns={topAccommodationsColumns}
                pagination={false}
                size="small"
                className="mini-table"
              />
            </Card>
          </Col>
        </Row>

        {/* Recent Bookings */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card className="chart-card" title={
              <div className="card-title">
                <EyeOutlined /> Recent Bookings
              </div>
            }>
              <Table
                dataSource={recentBookings}
                columns={recentBookingsColumns}
                pagination={false}
                loading={loading}
                className="bookings-table"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Statistics;
