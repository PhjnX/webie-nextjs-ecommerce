// app/products/page.tsx
import ProductStore from "@/app/components/products/ProductStore";
import { getProductCategories, getProducts } from "@/services/product";

const PRODUCTS_PER_PAGE = 20;

function getPositiveIntegerValue(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
}

function getStringValue(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue?.trim() || "";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = getPositiveIntegerValue(resolvedSearchParams.page) ?? 1;
  const selectedKeyword = getStringValue(resolvedSearchParams.keyword);
  const selectedCategoryId = getPositiveIntegerValue(
    resolvedSearchParams.categoryId,
  );
  const [productsResult, categories] = await Promise.all([
    getProducts({
      offset: (currentPage - 1) * PRODUCTS_PER_PAGE,
      limit: PRODUCTS_PER_PAGE,
      categoryId: selectedCategoryId,
      keyword: selectedKeyword,
    }),
    getProductCategories(),
  ]);

  return (
    <ProductStore
      key={`${selectedKeyword}:${selectedKeyword ? "search" : selectedCategoryId ?? "all"}`}
      productsResult={productsResult}
      categories={categories}
      selectedCategoryId= {selectedCategoryId}
      selectedKeyword={selectedKeyword}
    />
  );
}
