import axios from "./axios";
import { ProductDetail } from "@/common/interface";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const getSimilarProducts = async (productId: number): Promise<ProductDetail[]> => {
    try {
        const response = await axios.get(`${apiUrl}/api/get-similar-products/${productId}`);
        if (response.data.res === 'success') {
            return response.data.products;
        }
        return [];
    } catch (error) {
        console.error('Error fetching similar products:', error);
        return [];
    }
};
