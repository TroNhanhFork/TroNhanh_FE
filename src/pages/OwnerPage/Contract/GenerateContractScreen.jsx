import React, { useState } from 'react';
import { View, TextInput, Button, Text, ScrollView, ActivityIndicator } from 'react-native';
import { apiPost } from '../../../utils/AIAssistant';

export default function GenerateContractScreen({ navigation }) {
    const [prompt, setPrompt] = useState('');
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const onPreview = async () => {
        setLoading(true);
        try {
            const res = await apiPost('/api/ai/generate-contract', { prompt });
            setPreview(res.description);
        } catch (err) {
            alert('Lỗi khi tạo mô tả');
        } finally {
            setLoading(false);
        }
    };

    const onSave = async () => {
        setLoading(true);
        try {
            const res = await apiPost('/api/ai/generate-contract/save', { prompt, title: 'Hợp đồng mẫu' });
            alert('Đã lưu mẫu hợp đồng');
        } catch (err) {
            alert('Lỗi khi lưu mẫu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text>Tóm tắt yêu cầu (ví dụ: 6 tháng, bao gồm điện nước, 2 người):</Text>
            <TextInput value={prompt} onChangeText={setPrompt} style={{ height: 100, borderWidth: 1, marginVertical: 8 }} multiline />
            <Button title="Xem trước hợp đồng" onPress={onPreview} />
            {loading && <ActivityIndicator />}
            {preview && (
                <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: 'bold' }}>Xem trước:</Text>
                    <Text>{preview}</Text>
                    <Button title="Lưu làm mẫu" onPress={onSave} />
                </View>
            )}
        </ScrollView>
    );
}