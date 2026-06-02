export interface Product {
  id: number;
  name: string;
  list_price: number;
  description: string;
  iframe_url: string;
  image: string;
}

export async function getVCardProducts(): Promise<Product[]> {
  try {
    const res = await fetch("http://localhost:3000/odoo/products", {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Lỗi kết nối API Backend");
    const result = await res.json();

    if (!result.success || !result.data) return [];

    return result.data.map((item: any) => {
      let finalDescription =
        "Mẫu danh thiếp điện tử (Digital vCard) cao cấp, thiết kế luxury, tối ưu hóa hiển thị và tính năng cá nhân hóa hoàn hảo trên di động.";
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
    console.error("Lỗi fetch data từ NextJS sang NestJS:", error);
    return [];
  }
}
