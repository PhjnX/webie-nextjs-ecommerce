export interface Product {
  id: number;
  name: string;
  list_price: number;
  description: string;
  iframe_url: string;
  image: string;
}

interface OdooProduct {
  id: number;
  name: string;
  list_price?: number;
  description_sale?: string | false | null;
  default_code?: string | false | null;
  image_1920?: string | false | null;
}

interface OdooProductsResponse {
  success?: boolean;
  data?: OdooProduct[];
}

export async function getVCardProducts(): Promise<Product[]> {
  try {
    const res = await fetch("http://localhost:3000/odoo/products", {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Backend API connection error");
    const result = (await res.json()) as OdooProductsResponse;

    if (!result.success || !result.data) return [];

    return result.data.map((item) => {
      let finalDescription =
        "Premium digital vCard template, luxury design, optimized display and full personalization for mobile.";
      if (item.description_sale && item.description_sale !== false) {
        finalDescription = item.description_sale;
      }

      return {
        id: item.id,
        name: item.name,
        list_price: item.list_price || 0,
        description: finalDescription,
        iframe_url: item.default_code || "https://vcard.webie.vn",
        image: item.image_1920
          ? `data:image/png;base64,${item.image_1920}`
          : "/placeholder.png",
      };
    });
  } catch (error) {
    console.error("Error fetching data from backend:", error);
    return [];
  }
}
