// app/products/page.tsx
import ProductStore from "@/app/components/products/ProductStore";
import { getProducts } from "@/services/product";

const PRODUCTS_PER_PAGE = 20;

function getPageValue(value: string | string[] | undefined) {
  const page = Array.isArray(value) ? value[0] : value;
  const parsedPage = Number(page);

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const currentPage = getPageValue((await searchParams).page);
  const productsResult = await getProducts({
    offset: (currentPage - 1) * PRODUCTS_PER_PAGE,
    limit: PRODUCTS_PER_PAGE,
  });

  return <ProductStore productsResult={productsResult} />;
}
