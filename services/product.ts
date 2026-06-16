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
  parent?: number | string | null;
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
  image_base64?: string | null;
}

interface ProductsApiResponse {
  total?: number;
  limit?: number;
  offset?: number;
  data?: ApiProduct[];
}

interface ProductApiResponse {
  data?: ApiProduct | ApiProduct[];
  product?: ApiProduct | null;
}

interface ApiProductCategory {
  id?: number | string | null;
  name?: string | null;
  parent?: number | string | null;
}

type CategoriesApiResponse =
  | ApiProductCategory[]
  | {
      data?: ApiProductCategory[];
      categories?: ApiProductCategory[];
      results?: ApiProductCategory[];
    };

type ProductApiResponsePayload =
  | ProductsApiResponse
  | ProductApiResponse
  | ApiProduct[]
  | ApiProduct;

const PRODUCTS_API_URL =
  process.env.PRODUCTS_API_URL ??
  "https://coral-mouse-470858.hostingersite.com/odoo/products";
const PRODUCTS_API_BASE_URL = PRODUCTS_API_URL.replace(/\/+$/, "");
const PRODUCT_CATEGORIES_API_URL =
  process.env.PRODUCT_CATEGORIES_API_URL ??
  `${PRODUCTS_API_BASE_URL.replace(/\/products$/, "")}/categories`;

const FALLBACK_DESCRIPTION = "No description available yet.";
const FALLBACK_IMAGE = "/images/services/website-templates.png";
const FALLBACK_DEMO_URL = "https://vcard.webie.com.vn";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiProduct(value: unknown): value is ApiProduct {
  return isObject(value) && typeof value.id === "number";
}

function readCategoryId(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue > 0
      ? parsedValue
      : null;
  }

  return null;
}

function getProductsFromApiResponse(
  result: ProductApiResponsePayload,
): ApiProduct[] {
  if (Array.isArray(result)) {
    return result.filter(isApiProduct);
  }

  if (isApiProduct(result)) {
    return [result];
  }

  if (!isObject(result)) {
    return [];
  }

  if (Array.isArray(result.data)) {
    return result.data.filter(isApiProduct);
  }

  if (isApiProduct(result.data)) {
    return [result.data];
  }

  if (isApiProduct(result.product)) {
    return [result.product];
  }

  return [];
}

function getCategoriesFromApiResponse(result: CategoriesApiResponse) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.categories)) {
    return result.categories;
  }

  if (Array.isArray(result.results)) {
    return result.results;
  }

  return [];
}

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

function buildProductDetailUrl(productId: number) {
  return `${PRODUCTS_API_BASE_URL}/${encodeURIComponent(productId)}`;
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
    const products = getProductsFromApiResponse(result).map(mapProduct);

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

export async function getProductById(
  productId: number,
): Promise<Product | null> {
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  try {
    const res = await fetch(buildProductDetailUrl(productId), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const result = (await res.json()) as ProductApiResponsePayload;
      const product = getProductsFromApiResponse(result)
        .map(mapProduct)
        .find((item) => item.id === productId);

      if (product) {
        return product;
      }
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error fetching product detail:", error);
  }

  const result = await getProducts({ offset: 0, limit: 100 });

  return result.products.find((product) => product.id === productId) ?? null;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const res = await fetch(PRODUCT_CATEGORIES_API_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Categories API request failed with ${res.status}`);
    }

    const result = (await res.json()) as CategoriesApiResponse;
    const categories = new Map<number, ProductCategory>();

    for (const item of getCategoriesFromApiResponse(result)) {
      const id = readCategoryId(item.id);
      const name = item.name?.trim();

      if (id && name && !categories.has(id)) {
        categories.set(id, {
          id,
          name,
          parent: item.parent ?? null,
        });
      }
    }

    return Array.from(categories.values());
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error fetching product categories:", error);

    return [];
  }
}

export async function getVCardProducts(): Promise<Product[]> {
  const result = await getProducts();

  return result.products;
}
