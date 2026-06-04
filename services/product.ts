import { unstable_rethrow } from "next/navigation";

export interface Product {
  id: number;
  name: string;
  price: number;
  list_price: number;
  description: string;
  category: {
    id: number;
    name: string;
  };
  sku: string | null;
  stock: number;
  iframe_url: string;
  image: string;
  image_url: string;
}

export interface ProductsResult {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProductCategory {
  id: number;
  name: string;
}

interface ApiProduct {
  id: number;
  name: string;
  price?: number | null;
  description?: string | null;
  category?: {
    id?: number | null;
    name?: string | null;
  } | null;
  sku?: string | null;
  stock?: number | null;
  image_url?: string | null;
}

interface ProductsApiResponse {
  total?: number;
  limit?: number;
  offset?: number;
  data?: ApiProduct[];
}

const PRODUCTS_API_URL =
  process.env.PRODUCTS_API_URL ??
  "https://coral-mouse-470858.hostingersite.com/odoo/products";
const PRODUCTS_API_BASE_URL = PRODUCTS_API_URL.replace(/\/+$/, "");

const FALLBACK_DESCRIPTION = "No description available yet.";
const FALLBACK_IMAGE = "/images/services/website-templates.png";
const FALLBACK_DEMO_URL = "https://vcard.webie.com.vn";

function buildProductsUrl({
  offset,
  limit,
  categoryId,
  keyword,
}: {
  offset: number;
  limit: number;
  categoryId?: number | null;
  keyword?: string | null;
}) {
  const trimmedKeyword = keyword?.trim();
  const url = new URL(
    trimmedKeyword
      ? `${PRODUCTS_API_BASE_URL}/search`
      : categoryId
        ? `${PRODUCTS_API_BASE_URL}/category/${encodeURIComponent(categoryId)}`
        : PRODUCTS_API_BASE_URL,
  );

  if (trimmedKeyword) {
    url.searchParams.set("keyword", trimmedKeyword);
    if (offset > 0) {
      url.searchParams.set("offset", String(offset));
    }
  } else {
    url.searchParams.set("offset", String(offset));
  }

  url.searchParams.set("limit", String(limit));

  return url.toString();
}

function mapProduct(item: ApiProduct): Product {
  const category = item.category ?? {};
  const price = item.price ?? 0;
  const imageUrl = item.image_url?.trim() || FALLBACK_IMAGE;

  return {
    id: item.id,
    name: item.name,
    price,
    list_price: price,
    description: item.description?.trim() || FALLBACK_DESCRIPTION,
    category: {
      id: category.id ?? 0,
      name: category.name?.trim() || "Uncategorized",
    },
    sku: item.sku ?? null,
    stock: item.stock ?? 0,
    iframe_url: FALLBACK_DEMO_URL,
    image: imageUrl,
    image_url: imageUrl,
  };
}

export async function getProducts({
  offset = 0,
  limit = 20,
  categoryId = null,
  keyword = null,
}: {
  offset?: number;
  limit?: number;
  categoryId?: number | null;
  keyword?: string | null;
} = {}): Promise<ProductsResult> {
  try {
    const res = await fetch(
      buildProductsUrl({ offset, limit, categoryId, keyword }),
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Products API request failed with ${res.status}`);
    }

    const result = (await res.json()) as ProductsApiResponse | ApiProduct[];
    const productsData = Array.isArray(result) ? result : result.data;
    const products = Array.isArray(productsData)
      ? productsData.map(mapProduct)
      : [];

    return {
      products,
      total: Array.isArray(result)
        ? products.length
        : result.total ?? products.length,
      limit: Array.isArray(result) ? limit : result.limit ?? limit,
      offset: Array.isArray(result) ? offset : result.offset ?? offset,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error fetching products:", error);

    return {
      products: [],
      total: 0,
      limit,
      offset,
    };
  }
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const result = await getProducts({ offset: 0, limit: 20 });
  const categories = new Map<number, string>();

  for (const product of result.products) {
    if (product.category.id > 0 && !categories.has(product.category.id)) {
      categories.set(product.category.id, product.category.name);
    }
  }

  return Array.from(categories, ([id, name]) => ({ id, name }));
}

export async function getVCardProducts(): Promise<Product[]> {
  const result = await getProducts();

  return result.products;
}
