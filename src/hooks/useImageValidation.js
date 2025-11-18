/**
 * Custom React Hook for Image Upload Validation
 * Uses AI moderation to validate images before upload
 */

import { useState } from 'react';
import { message } from 'antd';
import { validateImages } from '../services/imageModerationService';

/**
 * Hook for validating images with AI moderation
 * 
 * @returns {Object} { validateFiles, isValidating, validationError }
 */
export const useImageValidation = () => {
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState(null);

    /**
     * Validate files before upload
     * 
     * @param {Array} fileList - Array of files or Ant Design file objects
     * @param {Object} options - { showSuccessMessage: boolean, silentValidation: boolean }
     * @returns {Promise<boolean>} True if valid, false if invalid
     */
    const validateFiles = async (fileList, options = {}) => {
        const {
            showSuccessMessage = false,
            silentValidation = false
        } = options;

        // Reset previous errors
        setValidationError(null);

        // If no files, consider it valid (empty upload)
        if (!fileList || fileList.length === 0) {
            return true;
        }

        setIsValidating(true);

        try {
            const result = await validateImages(fileList);

            if (result.valid) {
                if (showSuccessMessage && !silentValidation) {
                    message.success('Tất cả ảnh đã được kiểm tra và hợp lệ ✓');
                }
                return true;
            } else {
                // Images failed validation
                const errorMessage = result.message || 'Một số ảnh không hợp lệ';
                setValidationError(errorMessage);

                if (!silentValidation) {
                    // Show detailed error message
                    message.error({
                        content: (
                            <div>
                                <strong>Ảnh không hợp lệ</strong>
                                <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                                    {errorMessage}
                                </div>
                            </div>
                        ),
                        duration: 6,
                    });
                }

                return false;
            }

        } catch (error) {
            console.error('Validation error:', error);
            
            if (!silentValidation) {
                message.error('Lỗi khi kiểm tra ảnh. Vui lòng thử lại.');
            }
            
            setValidationError('Lỗi hệ thống khi kiểm tra ảnh');
            return false;

        } finally {
            setIsValidating(false);
        }
    };

    /**
     * Validate files with custom error handler
     * Useful for showing validation results in modals or custom UI
     */
    const validateFilesWithCallback = async (fileList, onSuccess, onError) => {
        setValidationError(null);
        setIsValidating(true);

        try {
            const result = await validateImages(fileList);

            if (result.valid) {
                if (onSuccess) onSuccess(result);
                return true;
            } else {
                if (onError) onError(result);
                setValidationError(result.message);
                return false;
            }

        } catch (error) {
            console.error('Validation error:', error);
            if (onError) {
                onError({ 
                    valid: false, 
                    message: 'Lỗi hệ thống khi kiểm tra ảnh',
                    error 
                });
            }
            return false;

        } finally {
            setIsValidating(false);
        }
    };

    /**
     * Clear validation error
     */
    const clearError = () => {
        setValidationError(null);
    };

    return {
        validateFiles,
        validateFilesWithCallback,
        isValidating,
        validationError,
        clearError
    };
};

/**
 * Hook for handling Ant Design Upload beforeUpload validation
 * This prevents invalid files from being added to the upload list
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} { beforeUpload, isValidating }
 */
export const useUploadValidation = (options = {}) => {
    const { onValidationSuccess, onValidationError } = options;
    const [isValidating, setIsValidating] = useState(false);

    const beforeUpload = async (file, fileList) => {
        setIsValidating(true);

        try {
            const result = await validateImages([file]);

            if (result.valid) {
                if (onValidationSuccess) onValidationSuccess(file, result);
                return true;
            } else {
                const errorMsg = result.message || 'Ảnh không hợp lệ';
                
                message.error({
                    content: errorMsg,
                    duration: 5,
                });

                if (onValidationError) onValidationError(file, result);
                
                // Return Upload.LIST_IGNORE to prevent file from being added
                return false;
            }

        } catch (error) {
            console.error('Upload validation error:', error);
            message.error('Lỗi khi kiểm tra ảnh');
            return false;

        } finally {
            setIsValidating(false);
        }
    };

    return {
        beforeUpload,
        isValidating
    };
};

export default useImageValidation;
