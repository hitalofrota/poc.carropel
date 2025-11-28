export interface UserCreateData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'viewer';
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
    created_at?: string;
}

export interface UserUpdateData {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'manager' | 'viewer';
}