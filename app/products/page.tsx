// app/products/page.tsx
import ProductStore from "@/app/components/products/ProductStore";
import { getProducts } from "@/services/product";

export default async function ProductsPage() {
  const productsResult = await getProducts({ offset: 0, limit: 20 });

  return <ProductStore productsResult={productsResult} />;
}
