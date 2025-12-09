import axiosInstance from "./axios";

export interface ContactMessageData {
    name: string;
    email: string;
    phone_number: string;
    message: string;
}

export interface ContactMessage extends ContactMessageData {
    id: number;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContactMessageResponse {
    success: boolean;
    message: string;
    data?: ContactMessage;
    errors?: Record<string, string[]>;
}

export interface ContactMessagesListResponse {
    success: boolean;
    data: {
        data: ContactMessage[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

// Submit contact message (public)
export const submitContactMessage = async (data: ContactMessageData): Promise<ContactMessageResponse> => {
    const response = await axiosInstance.post('/api/contact-us', data);
    return response.data;
};

// Admin: Get all contact messages
export const getContactMessages = async (page: number = 1, search: string = ''): Promise<ContactMessagesListResponse> => {
    const response = await axiosInstance.get('/api/admin/contact-messages', {
        params: { page, search, per_page: 15 }
    });
    return response.data;
};

// Admin: Get single message
export const getContactMessage = async (id: number): Promise<ContactMessageResponse> => {
    const response = await axiosInstance.get(`/api/admin/contact-messages/${id}`);
    return response.data;
};

// Admin: Mark as read
export const markMessageAsRead = async (id: number): Promise<ContactMessageResponse> => {
    const response = await axiosInstance.patch(`/api/admin/contact-messages/${id}/mark-read`);
    return response.data;
};

// Admin: Delete message
export const deleteContactMessage = async (id: number): Promise<ContactMessageResponse> => {
    const response = await axiosInstance.delete(`/api/admin/contact-messages/${id}`);
    return response.data;
};
