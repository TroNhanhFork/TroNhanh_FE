/**
 * Admin Page - Flagged Images Management
 * Review and moderate flagged images from AI moderation system
 */

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Tag,
    Modal,
    Image,
    Space,
    Input,
    Select,
    Badge,
    Card,
    Statistic,
    Row,
    Col,
    message,
    Popconfirm,
    Tooltip,
    Typography
} from 'antd';
import {
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined,
    FilterOutlined
} from '@ant-design/icons';
import {
    getFlaggedImages,
    getFlaggedImageStats,
    approveFlaggedImage,
    rejectFlaggedImage,
    batchApproveFlaggedImages,
    batchRejectFlaggedImages
} from '../../../services/imageModerationService';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const FlaggedImagesPage = () => {
    const [loading, setLoading] = useState(false);
    const [flaggedImages, setFlaggedImages] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    
    // Filters
    const [filters, setFilters] = useState({
        reviewStatus: 'pending',
        severity: undefined,
    });
    
    // Modal states
    const [previewImage, setPreviewImage] = useState(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [reviewingImage, setReviewingImage] = useState(null);
    const [reviewNote, setReviewNote] = useState('');

    useEffect(() => {
        fetchFlaggedImages();
        fetchStats();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchFlaggedImages = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: pagination.current,
                limit: pagination.pageSize
            };
            
            const response = await getFlaggedImages(params);
            
            setFlaggedImages(response.flaggedImages || []);
            setPagination({
                ...pagination,
                total: response.pagination?.total || 0
            });
        } catch (error) {
            console.error('Error fetching flagged images:', error);
            message.error('Không thể tải danh sách ảnh bị gắn cờ');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const statsData = await getFlaggedImageStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleApprove = async (imageId, note = '') => {
        try {
            await approveFlaggedImage(imageId, note);
            message.success('Đã duyệt ảnh');
            fetchFlaggedImages();
            fetchStats();
            setReviewModalVisible(false);
            setReviewNote('');
        } catch (error) {
            console.error('Error approving image:', error);
            message.error('Lỗi khi duyệt ảnh');
        }
    };

    const handleReject = async (imageId, note = '') => {
        try {
            await rejectFlaggedImage(imageId, note);
            message.success('Đã từ chối ảnh');
            fetchFlaggedImages();
            fetchStats();
            setReviewModalVisible(false);
            setReviewNote('');
        } catch (error) {
            console.error('Error rejecting image:', error);
            message.error('Lỗi khi từ chối ảnh');
        }
    };

    const handleBatchApprove = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một ảnh');
            return;
        }

        try {
            await batchApproveFlaggedImages(selectedRowKeys);
            message.success(`Đã duyệt ${selectedRowKeys.length} ảnh`);
            setSelectedRowKeys([]);
            fetchFlaggedImages();
            fetchStats();
        } catch (error) {
            console.error('Error batch approving:', error);
            message.error('Lỗi khi duyệt hàng loạt');
        }
    };

    const handleBatchReject = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một ảnh');
            return;
        }

        try {
            await batchRejectFlaggedImages(selectedRowKeys);
            message.success(`Đã từ chối ${selectedRowKeys.length} ảnh`);
            setSelectedRowKeys([]);
            fetchFlaggedImages();
            fetchStats();
        } catch (error) {
            console.error('Error batch rejecting:', error);
            message.error('Lỗi khi từ chối hàng loạt');
        }
    };

    const openReviewModal = (record) => {
        setReviewingImage(record);
        setReviewModalVisible(true);
        setReviewNote('');
    };

    const getSeverityColor = (severity) => {
        const colors = {
            low: 'green',
            medium: 'orange',
            high: 'red',
            critical: 'purple'
        };
        return colors[severity] || 'default';
    };

    const getViolationDisplay = (violations) => {
        if (!violations || violations.length === 0) return 'Không có';
        
        return violations.map((v, idx) => (
            <Tag key={idx} color="red">
                {v.category}: {v.confidence}
                {v.details?.forbiddenLabels && ` (${v.details.forbiddenLabels.slice(0, 3).join(', ')})`}
            </Tag>
        ));
    };

    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'imagePath',
            key: 'image',
            width: 120,
            render: (path, record) => (
                <Image
                    width={80}
                    height={80}
                    src={`http://localhost:5000/${path}`}
                    fallback="data:image/png;base64,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"
                    preview={{
                        visible: false,
                        onVisibleChange: () => setPreviewImage(`http://localhost:5000/${path}`)
                    }}
                    style={{ objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setPreviewImage(`http://localhost:5000/${path}`)}
                />
            )
        },
        {
            title: 'Vi phạm',
            dataIndex: ['moderationResult', 'violations'],
            key: 'violations',
            render: getViolationDisplay
        },
        {
            title: 'Mức độ',
            dataIndex: 'severity',
            key: 'severity',
            width: 100,
            render: (severity) => (
                <Tag color={getSeverityColor(severity)}>
                    {severity?.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Người tải lên',
            dataIndex: ['uploaderId', 'name'],
            key: 'uploader',
            render: (name, record) => record.uploaderId?.name || 'N/A'
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('vi-VN')
        },
        {
            title: 'Trạng thái',
            dataIndex: 'reviewStatus',
            key: 'reviewStatus',
            render: (status) => {
                const statusConfig = {
                    pending: { color: 'orange', text: 'Chờ duyệt' },
                    approved: { color: 'green', text: 'Đã duyệt' },
                    rejected: { color: 'red', text: 'Từ chối' },
                    deleted: { color: 'gray', text: 'Đã xóa' }
                };
                const config = statusConfig[status] || statusConfig.pending;
                return <Tag color={config.color}>{config.text}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 180,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => openReviewModal(record)}
                        />
                    </Tooltip>
                    {record.reviewStatus === 'pending' && (
                        <>
                            <Popconfirm
                                title="Duyệt ảnh này?"
                                onConfirm={() => handleApprove(record._id)}
                                okText="Có"
                                cancelText="Không"
                            >
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                />
                            </Popconfirm>
                            <Popconfirm
                                title="Từ chối ảnh này?"
                                onConfirm={() => handleReject(record._id)}
                                okText="Có"
                                cancelText="Không"
                            >
                                <Button
                                    size="small"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            )
        }
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
        getCheckboxProps: (record) => ({
            disabled: record.reviewStatus !== 'pending'
        })
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>
                <ExclamationCircleOutlined /> Quản lý ảnh được gắn cờ
            </Title>

            {/* Statistics Cards */}
            {stats && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng số ảnh"
                                value={stats.total || 0}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Chờ duyệt"
                                value={stats.pending || 0}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đã duyệt"
                                value={stats.approved || 0}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Từ chối"
                                value={stats.rejected || 0}
                                valueStyle={{ color: '#f5222d' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
                <Space>
                    <FilterOutlined />
                    <Select
                        style={{ width: 150 }}
                        placeholder="Trạng thái"
                        value={filters.reviewStatus}
                        onChange={(value) => setFilters({ ...filters, reviewStatus: value })}
                    >
                        <Option value="">Tất cả</Option>
                        <Option value="pending">Chờ duyệt</Option>
                        <Option value="approved">Đã duyệt</Option>
                        <Option value="rejected">Từ chối</Option>
                    </Select>

                    <Select
                        style={{ width: 150 }}
                        placeholder="Mức độ"
                        value={filters.severity}
                        onChange={(value) => setFilters({ ...filters, severity: value })}
                        allowClear
                    >
                        <Option value="low">Thấp</Option>
                        <Option value="medium">Trung bình</Option>
                        <Option value="high">Cao</Option>
                        <Option value="critical">Nghiêm trọng</Option>
                    </Select>

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchFlaggedImages}
                    >
                        Làm mới
                    </Button>
                </Space>
            </Card>

            {/* Batch Actions */}
            {selectedRowKeys.length > 0 && (
                <Card style={{ marginBottom: 16 }}>
                    <Space>
                        <Badge count={selectedRowKeys.length}>
                            <Text strong>Đã chọn:</Text>
                        </Badge>
                        <Popconfirm
                            title={`Duyệt ${selectedRowKeys.length} ảnh?`}
                            onConfirm={handleBatchApprove}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button type="primary" icon={<CheckCircleOutlined />}>
                                Duyệt hàng loạt
                            </Button>
                        </Popconfirm>
                        <Popconfirm
                            title={`Từ chối ${selectedRowKeys.length} ảnh?`}
                            onConfirm={handleBatchReject}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button danger icon={<CloseCircleOutlined />}>
                                Từ chối hàng loạt
                            </Button>
                        </Popconfirm>
                    </Space>
                </Card>
            )}

            {/* Table */}
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={flaggedImages}
                rowKey="_id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} ảnh`
                }}
                onChange={(newPagination) => {
                    setPagination(newPagination);
                }}
            />

            {/* Image Preview Modal */}
            <Modal
                visible={!!previewImage}
                footer={null}
                onCancel={() => setPreviewImage(null)}
                width={800}
            >
                <img src={previewImage} alt="Preview" style={{ width: '100%' }} />
            </Modal>

            {/* Review Modal */}
            <Modal
                title="Chi tiết đánh giá ảnh"
                visible={reviewModalVisible}
                onCancel={() => {
                    setReviewModalVisible(false);
                    setReviewNote('');
                }}
                footer={
                    reviewingImage?.reviewStatus === 'pending' ? [
                        <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
                            Hủy
                        </Button>,
                        <Button
                            key="reject"
                            danger
                            onClick={() => handleReject(reviewingImage._id, reviewNote)}
                        >
                            Từ chối
                        </Button>,
                        <Button
                            key="approve"
                            type="primary"
                            onClick={() => handleApprove(reviewingImage._id, reviewNote)}
                        >
                            Duyệt
                        </Button>
                    ] : null
                }
                width={800}
            >
                {reviewingImage && (
                    <div>
                        <Image
                            src={`http://localhost:5000/${reviewingImage.imagePath}`}
                            style={{ width: '100%', marginBottom: 16 }}
                        />
                        
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div>
                                <Text strong>Vi phạm phát hiện:</Text>
                                <div style={{ marginTop: 8 }}>
                                    {getViolationDisplay(reviewingImage.moderationResult?.violations)}
                                </div>
                            </div>

                            <div>
                                <Text strong>Mức độ nghiêm trọng:</Text>
                                <div style={{ marginTop: 8 }}>
                                    <Tag color={getSeverityColor(reviewingImage.severity)}>
                                        {reviewingImage.severity?.toUpperCase()}
                                    </Tag>
                                </div>
                            </div>

                            {reviewingImage.reviewStatus === 'pending' && (
                                <div>
                                    <Text strong>Ghi chú (tùy chọn):</Text>
                                    <TextArea
                                        rows={3}
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                        placeholder="Nhập ghi chú cho quyết định này..."
                                        style={{ marginTop: 8 }}
                                    />
                                </div>
                            )}
                        </Space>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FlaggedImagesPage;
