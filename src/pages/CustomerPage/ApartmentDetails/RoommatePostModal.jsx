// components/RoommatePostModal.jsx
import { Modal, Form, Input, Select, Checkbox, Button, message, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { createRoommatePost } from '../../../services/roommateAPI';

const HABIT_OPTIONS = [
  "Ngăn nắp, sạch sẽ",
  "Yên tĩnh",
  "Hút thuốc",
  "Thường thức khuya",
  "Nấu ăn tại nhà",
  "Có thú cưng",
  "Thích giao lưu",
  "Học tập/làm việc tại nhà"
];

const RoommatePostModal = ({ visible, onClose, boardingHouseId, roomId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const handleFinish = async (values) => {
    if (!roomId) {
      message.error('Không tìm thấy thông tin phòng!');
      return;
    }

    setLoading(true);
    try {
      console.log('[RoommatePostModal] submit payload:', { ...values, boardingHouseId, roomId, files: fileList });

      // Build FormData to include files
      const formData = new FormData();
      formData.append('boardingHouseId', boardingHouseId);
      formData.append('roomId', roomId);
      formData.append('intro', values.intro || '');
      formData.append('genderPreference', values.genderPreference || 'other');
      formData.append('note', values.note || '');

      // append habits - send multiple fields with same name so multer can parse into array
      if (values.habits && Array.isArray(values.habits)) {
        values.habits.forEach((h) => formData.append('habits', h));
      }

      // append image files
      (fileList || []).forEach((file) => {
        // file.originFileObj is the actual File object from input
        if (file && file.originFileObj) formData.append('images', file.originFileObj);
      });

      const newPost = await createRoommatePost(formData);
      message.success('Đăng bài thành công!');
      form.resetFields();
      setFileList([]);
      onSuccess?.(newPost); // Trả về dữ liệu bài đăng mới
    } catch (error) {
      console.error("Failed to post roommate", error);
      // normalize error message with nested checks for validation errors
      let errMsg = 'Đăng bài thất bại, vui lòng thử lại!';
      if (!error) {
        errMsg = 'Không nhận được phản hồi từ server.';
      } else if (typeof error === 'string') {
        errMsg = error;
      } else if (error.message) {
        errMsg = error.message;
      }
      // some server responses include an `error` object with more details
      if (error.error && error.error.message) {
        errMsg = error.error.message;
      }
      // mongoose validation errors
      if (error.error && error.error.errors) {
        const details = Object.values(error.error.errors).map(e => e.message).join('; ');
        if (details) errMsg = details;
      }
      // if server returned data.message
      if (error.data && error.data.message) {
        errMsg = error.data.message;
      }
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ cho phép hình ảnh.');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Ảnh phải nhỏ hơn 5MB!');
    }
    // Prevent auto upload by returning false
    return isImage && isLt5M ? false : Upload.LIST_IGNORE;
  };

  const handleChange = ({ fileList: nextList }) => {
    // limit to 6 files
    setFileList(nextList.slice(0, 6));
  };

  return (
    <Modal
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      title="Đăng bài tìm bạn trọ"
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
            genderPreference: 'other',
            habits: []
          }}
      >
        <Form.Item
          name="intro"
          label="Giới thiệu bản thân"
          rules={[{ required: true, message: 'Vui lòng giới thiệu về bản thân!' }]}
        >
          <Input.TextArea
            placeholder="Giới thiệu ngắn gọn về bản thân, thói quen sinh hoạt, công việc/học tập..."
            rows={4}
          />
        </Form.Item>

        <Form.Item
          name="genderPreference"
          label="Giới tính mong muốn"
          rules={[{ required: true, message: 'Vui lòng chọn giới tính mong muốn!' }]}
        >
          <Select>
            <Select.Option value="other">Không quan trọng</Select.Option>
            <Select.Option value="male">Nam</Select.Option>
            <Select.Option value="female">Nữ</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="habits"
          label="Thói quen sinh hoạt"
          extra="Chọn những thói quen phù hợp với bạn"
        >
          <Checkbox.Group options={HABIT_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="note"
          label="Ghi chú thêm"
        >
          <Input.TextArea
            placeholder="Những yêu cầu hoặc thông tin khác muốn chia sẻ..."
            rows={3}
          />
        </Form.Item>

        <Form.Item label="Hình ảnh (tùy chọn)">
          <Upload
            multiple
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onPreview={async (file) => {
              let src = file.url;
              if (!src) {
                src = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file.originFileObj);
                  reader.onload = () => resolve(reader.result);
                });
              }
              const imgWindow = window.open(src);
              imgWindow?.document.write(`<img src="${src}" style="max-width:100%">`);
            }}
          >
            {fileList.length >= 6 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Đăng bài
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RoommatePostModal;
