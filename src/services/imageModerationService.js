/**
 * Image Moderation Service - Frontend
 * Handles communication with backend AI image moderation system
 */

import axiosInstance from './axiosInstance';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Validate images before upload using AI moderation
 * This should be called BEFORE sending images to the main API
 * 
 * @param {File[]} files - Array of File objects to validate
 * @returns {Promise<{valid: boolean, violations: Array, message: string}>}
 */
export const validateImages = async (files) => {
    try {
        if (!files || files.length === 0) {
            return { valid: true, violations: [], message: 'No images to validate' };
        }

        const formData = new FormData();
        
        // Append all files to FormData
        files.forEach((file) => {
            // Handle both File objects and Ant Design upload file objects
            const fileObj = file.originFileObj || file;
            formData.append('images', fileObj);
        });

        const response = await axiosInstance.post(
            `${API_BASE_URL}/test/image-moderation`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        );

        // Response structure: { success: true, results: [...] }
        const { results } = response.data;
        
        // Check if any image failed validation
        const failedImages = results.filter(r => !r.safe);
        
        if (failedImages.length > 0) {
            return {
                valid: false,
                violations: failedImages,
                message: buildValidationErrorMessage(failedImages)
            };
        }

        return {
            valid: true,
            violations: [],
            message: 'All images passed validation'
        };

    } catch (error) {
        console.error('Image validation error:', error);
        
        // If API is down or unreachable, we should allow upload but log the error
        // In production, you might want to fail closed instead
        if (error.response?.status === 500 || !error.response) {
            return {
                valid: true,
                violations: [],
                message: 'Validation service unavailable - proceeding with upload',
                warning: true
            };
        }

        throw error;
    }
};

/**
 * Build user-friendly error message from validation violations
 * 
 * @param {Array} failedImages - Array of failed validation results
 * @returns {string} User-friendly error message
 */
function buildValidationErrorMessage(failedImages) {
    const messages = [];
    
    failedImages.forEach((img, index) => {
        const violations = img.violations || [];
        const imageNum = index + 1;
        
        // Categorize violations for Vietnamese messages
        const safetyIssues = violations.filter(v => 
            ['adult_content', 'violent_content', 'racy_content', 'medical_content'].includes(v.category)
        );
        
        const contentIssues = violations.filter(v => 
            v.category === 'inappropriate_content'
        );

        if (safetyIssues.length > 0) {
            messages.push(`Ảnh ${imageNum}: Phát hiện nội dung không phù hợp (${getSafetyMessage(safetyIssues)})`);
        }
        
        if (contentIssues.length > 0) {
            const labels = contentIssues
                .flatMap(v => v.details?.forbiddenLabels || [])
                .slice(0, 3)
                .join(', ');
            messages.push(`Ảnh ${imageNum}: Nội dung không liên quan đến nhà trọ/phòng (${labels})`);
        }
    });

    return messages.join('\n') || 'Một số ảnh không phù hợp với quy định';
}

/**
 * Get Vietnamese safety message from violations
 */
function getSafetyMessage(violations) {
    const types = violations.map(v => v.category);
    
    if (types.includes('adult_content')) return 'nội dung người lớn';
    if (types.includes('racy_content')) return 'nội dung nhạy cảm';
    if (types.includes('violent_content')) return 'nội dung bạo lực';
    if (types.includes('medical_content')) return 'nội dung y tế';
    
    return 'nội dung không an toàn';
}

// ================================================================
// ADMIN FUNCTIONS - For reviewing flagged images
// ================================================================

/**
 * Get all flagged images (Admin only)
 * 
 * @param {Object} filters - { reviewStatus, severity, uploaderId, startDate, endDate, page, limit }
 * @returns {Promise<{flaggedImages: Array, pagination: Object}>}
 */
export const getFlaggedImages = async (filters = {}) => {
    try {
        const response = await axiosInstance.get(
            `${API_BASE_URL}/admin/flagged-images`,
            { params: filters }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching flagged images:', error);
        throw error;
    }
};

/**
 * Get statistics about flagged images (Admin only)
 * 
 * @returns {Promise<Object>} Statistics object
 */
export const getFlaggedImageStats = async () => {
    try {
        const response = await axiosInstance.get(
            `${API_BASE_URL}/admin/flagged-images/stats`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching flagged image stats:', error);
        throw error;
    }
};

/**
 * Approve a flagged image (Admin only)
 * 
 * @param {string} flaggedImageId - ID of the flagged image
 * @param {string} note - Optional approval note
 * @returns {Promise<Object>}
 */
export const approveFlaggedImage = async (flaggedImageId, note = '') => {
    try {
        const response = await axiosInstance.put(
            `${API_BASE_URL}/admin/flagged-images/${flaggedImageId}/approve`,
            { note }
        );
        return response.data;
    } catch (error) {
        console.error('Error approving flagged image:', error);
        throw error;
    }
};

/**
 * Reject a flagged image (Admin only)
 * 
 * @param {string} flaggedImageId - ID of the flagged image
 * @param {string} note - Optional rejection note
 * @returns {Promise<Object>}
 */
export const rejectFlaggedImage = async (flaggedImageId, note = '') => {
    try {
        const response = await axiosInstance.put(
            `${API_BASE_URL}/admin/flagged-images/${flaggedImageId}/reject`,
            { note }
        );
        return response.data;
    } catch (error) {
        console.error('Error rejecting flagged image:', error);
        throw error;
    }
};

/**
 * Batch approve multiple flagged images (Admin only)
 * 
 * @param {string[]} flaggedImageIds - Array of flagged image IDs
 * @param {string} note - Optional approval note
 * @returns {Promise<Object>}
 */
export const batchApproveFlaggedImages = async (flaggedImageIds, note = '') => {
    try {
        const response = await axiosInstance.post(
            `${API_BASE_URL}/admin/flagged-images/batch-approve`,
            { flaggedImageIds, note }
        );
        return response.data;
    } catch (error) {
        console.error('Error batch approving flagged images:', error);
        throw error;
    }
};

/**
 * Batch reject multiple flagged images (Admin only)
 * 
 * @param {string[]} flaggedImageIds - Array of flagged image IDs
 * @param {string} note - Optional rejection note
 * @returns {Promise<Object>}
 */
export const batchRejectFlaggedImages = async (flaggedImageIds, note = '') => {
    try {
        const response = await axiosInstance.post(
            `${API_BASE_URL}/admin/flagged-images/batch-reject`,
            { flaggedImageIds, note }
        );
        return response.data;
    } catch (error) {
        console.error('Error batch rejecting flagged images:', error);
        throw error;
    }
};

export default {
    validateImages,
    getFlaggedImages,
    getFlaggedImageStats,
    approveFlaggedImage,
    rejectFlaggedImage,
    batchApproveFlaggedImages,
    batchRejectFlaggedImages,
};
