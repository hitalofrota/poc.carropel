export interface ProductCreateData {
    name: string;
    code: string;
    description: string;
    unit_cost: number | null;
    unit_price: number | null;
    net_weight: number | null;
    gross_weight: number | null;
}

export interface ProductResponse {
    id: number;
    name: string;
    code: string;
    description: string | null;
    unit_cost: number | null;
    unit_price: number | null;
    net_weight: number | null;
    gross_weight: null;
}

export interface ApiError {
    detail: string | Array<{
        type: string;
        loc: string[];
        msg: string;
        input?: any;
    }>;
}