import axiosInstance from "./axios";

export interface DashboardStatistics {
    success: boolean;
    data: {
        overview: {
            total_users: number;
            total_products: number;
            total_orders: number;
            monthly_revenue: number;
            today_revenue: number;
            average_order_value: number;
            revenue_growth: number;
            new_users_this_month: number;
        };
        orders: {
            pending: number;
            processing: number;
            shipped: number;
            delivered: number;
            cancelled: number;
            status_distribution: Record<string, number>;
        };
        inventory: {
            low_stock: number;
            out_of_stock: number;
        };
        messages: {
            unread: number;
        };
        charts: {
            revenue_by_month: Array<{
                month: string;
                revenue: number;
                orders: number;
            }>;
            top_products: Array<{
                id: number;
                name: string;
                total_sold: number;
                total_revenue: number;
            }>;
        };
        latest_orders: Array<{
            id: number;
            order_id: string;
            customer_name: string;
            customer_email: string;
            total_amount: number;
            status: string;
            created_at: string;
        }>;
        recent_users: Array<{
            id: number;
            name: string;
            email: string;
            created_at: string;
        }>;
    };
}

export const getDashboardStatistics = async (): Promise<DashboardStatistics> => {
    const response = await axiosInstance.get('/api/admin/dashboard/statistics');
    return response.data;
};
