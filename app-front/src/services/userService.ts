import { api } from './api';
import { UserCreateData, UserResponse, UserUpdateData } from '../types/user';

export const userService = {
    // CREATE
    createUser: async (userData: UserCreateData): Promise<UserResponse> => {
        const response = await api.post<UserResponse>('/users/', userData);
        return response.data;
    },

    // READ
    getUsers: async (): Promise<UserResponse[]> => {
        const response = await api.get<UserResponse[]>('/users/');
        return response.data;
    },

    getUser: async (id: number): Promise<UserResponse> => {
        const response = await api.get<UserResponse>(`/users/${id}`);
        return response.data;
    },

    // UPDATE
    updateUser: async (id: number, userData: UserUpdateData): Promise<UserResponse> => {
        const response = await api.put<UserResponse>(`/users/${id}`, userData);
        return response.data;
    },

    // DELETE
    deleteUser: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    }
};