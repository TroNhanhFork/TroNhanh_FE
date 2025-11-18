import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Spin, Card, Alert, Modal } from 'antd';
import { getOwnerContractTemplate, createOrUpdateContractTemplate } from '../../../services/boardingHouseAPI';
import api from '../../../services/api';
import useUser from '../../../contexts/UserContext';
import SignatureGenerator from './SignatureGenerator';
import './ContractManagement.css';

const { TextArea } = Input;

const ContractManagement = () => {
    const { user } = useUser();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);

    const [existingSignature, setExistingSignature] = useState(null);
    const [generatedSignature, setGeneratedSignature] = useState(null);

    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiResult, setAiResult] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const openAiModal = () => {
        const currentTitle = form.getFieldValue('title') || '';
        const currentContent = form.getFieldValue('content') || '';
        if (!aiPrompt) {
            const excerpt = currentContent ? currentContent.toString().slice(0, 200) : '';
            const prefill = `${currentTitle}${excerpt ? ' - ' + excerpt : ''}\nHãy tạo một hợp đồng thuê ngắn gọn, rõ ràng, với các placeholder như {{tenantName}}, {{roomNumber}}, {{roomPrice}}.`;
            console.debug('[AI] openAiModal prefill:', { currentTitle, excerpt, prefill });
            setAiPrompt(prefill);
        }
        setAiResult('');
        setAiModalOpen(true);
        console.debug('[AI] AI modal opened');
    };

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const template = await getOwnerContractTemplate();
                form.setFieldsValue({ title: template.title, content: template.content });
                if (template.signatureImage) {
                    setExistingSignature(`http://localhost:5000${template.signatureImage}`);
                }
            } catch (error) {
                console.log("Chưa có mẫu hợp đồng.");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [form]);

    const handleSaveTemplate = async (values) => {
        const payload = {
            title: values.title,
            content: values.content,
            signatureDataUrl: generatedSignature
        };

        try {
            await createOrUpdateContractTemplate(payload);
            message.success("Đã lưu mẫu hợp đồng thành công!");
        } catch (error) {
            message.error("Lỗi khi lưu mẫu hợp đồng.");
        }
    };

    // --------------- AI GENERATION FUNCTION --------------- //
    const handleGenerateAIContract = async () => {
        if (!aiPrompt.trim()) {
            return message.warning("Vui lòng nhập mô tả ngắn để AI tạo hợp đồng.");
        }

        try {
            setAiLoading(true);
            setAiResult("");
            const payload = { prompt: aiPrompt };
            console.debug('[AI] Sending generate-contract request via axios', payload);
            const response = await api.post('/ai/generate-contract', payload);
            console.debug('[AI] Axios response status', response.status);
            const data = response.data;
            console.debug('[AI] Axios response data', data);
            const resultText = data?.result || data?.description || "Không thể tạo hợp đồng.";
            console.debug('[AI] Final result text length', resultText?.length);
            setAiResult(resultText);
        } catch (err) {
            console.error('[AI] Error calling generate-contract', err);
            message.error("Lỗi khi gọi AI!");
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return <Spin tip="Đang tải..." size="large" style={{ display: 'block', marginTop: '50px' }} />;
    }

    return (
        <div className="contract-management-container">
            <Card
                title="Quản lý Mẫu Hợp đồng Thuê nhà"
                extra={
                    <Button type="primary" onClick={() => setAiModalOpen(true)}>
                        Tạo mẫu hợp đồng sử dụng AI
                    </Button>
                }
            >
                <Alert
                    message="Hướng dẫn sử dụng Biến Placeholder"
                    description={
                        <div>
                            <p>Sử dụng các biến dưới đây trong nội dung hợp đồng.</p>
                            <code>{'{{tenantName}}'}</code>,
                            <code>{'{{tenantEmail}}'}</code>,
                            <code>{'{{roomNumber}}'}</code>,
                            <code>{'{{roomPrice}}'}</code>,
                            <code>{'{{roomArea}}'}</code>,
                            <code>{'{{houseAddress}}'}</code>,
                            <code>{'{{ownerName}}'}</code>,
                            <code>{'{{currentDate}}'}</code>
                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Form form={form} layout="vertical" onFinish={handleSaveTemplate}>
                    <Form.Item
                        name="title"
                        label="Tiêu đề Hợp đồng"
                        rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                        initialValue="Hợp Đồng Thuê Phòng Trọ"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Nội dung Hợp đồng"
                        rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
                    >
                        <TextArea rows={20} />
                    </Form.Item>

                    <Form.Item label="Chữ ký Điện tử">
                        <p>Chữ ký sẽ được tự động tạo dựa trên tên của bạn.</p>
                        {user?.name && (
                            <SignatureGenerator
                                name={user.name}
                                onSignatureGenerated={setGeneratedSignature}
                            />
                        )}

                        {existingSignature && !generatedSignature && (
                            <div style={{ marginTop: 12 }}>
                                <p>Chữ ký hiện tại:</p>
                                <img
                                    src={existingSignature}
                                    alt="Chữ ký"
                                    style={{ maxHeight: "80px", border: "1px solid #d9d9d9", padding: "4px" }}
                                />
                            </div>
                        )}
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">Lưu Mẫu Hợp đồng</Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* ------------------- AI MODAL ------------------- */}
            <Modal
                title="Tạo mẫu hợp đồng bằng AI"
                open={aiModalOpen}
                onCancel={() => setAiModalOpen(false)}
                footer={null}
                width={800}
            >
                <p>Nhập mô tả ngắn để AI tạo hợp đồng:</p>
                <Input.TextArea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ví dụ: Hợp đồng thuê trọ 12 tháng cho sinh viên, giá phòng 3 triệu..."
                />

                <Button
                    type="primary"
                    style={{ marginTop: 12 }}
                    loading={aiLoading}
                    onClick={handleGenerateAIContract}
                >
                    Tạo Hợp đồng
                </Button>

                {aiResult && (
                    <>
                        <p style={{ marginTop: 20, fontWeight: 'bold' }}>Kết quả AI:</p>
                        <TextArea rows={12} value={aiResult} />

                        <Button
                            type="primary"
                            style={{ marginTop: 10 }}
                            onClick={() => {
                                console.debug('[AI] Applying AI result to form (length):', aiResult?.length);
                                form.setFieldsValue({ content: aiResult });
                                setAiModalOpen(false);
                                message.success("Đã đưa nội dung AI vào hợp đồng!");
                            }}
                        >
                            Dùng nội dung này
                        </Button>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default ContractManagement;
