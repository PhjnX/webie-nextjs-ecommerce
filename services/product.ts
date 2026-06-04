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

const FALLBACK_DESCRIPTION = "No description available yet.";
const FALLBACK_IMAGE = "/images/services/website-templates.png";
const FALLBACK_DEMO_URL = "https://vcard.webie.vn";

function buildProductsUrl(offset: number, limit: number) {
  const url = new URL(PRODUCTS_API_URL);
  url.searchParams.set("offset", String(offset));
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
}: {
  offset?: number;
  limit?: number;
} = {}): Promise<ProductsResult> {
  try {
    const res = await fetch(buildProductsUrl(offset, limit), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Products API request failed with ${res.status}`);
    }

    const result = (await res.json()) as ProductsApiResponse;
    const products = Array.isArray(result.data)
      ? result.data.map(mapProduct)
      : [];

    return {
      products,
      total: result.total ?? products.length,
      limit: result.limit ?? limit,
      offset: result.offset ?? offset,
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

export async function getVCardProducts(): Promise<Product[]> {
  const result = await getProducts();

  return result.products;
}
