"use client";

// components/product/ProductStore.tsx
import Link from "next/link";
import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import AuthDialog from "@/app/components/auth/AuthDialog";
import { useStoredAuthSession } from "@/app/components/auth/useStoredAuthSession";
import { addCartItem, CartApiError } from "@/services/cart";
import { type AuthSession } from "@/services/auth";
import type { ProductCategory, ProductsResult } from "@/services/product";

interface ProductStoreProps {
  productsResult: ProductsResult;
  categories: ProductCategory[];
  selectedCategoryId: number | null;
  selectedKeyword: string;
}

const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const Categories = [
  { id: 8, name: "Digital Vcard" },
  { id: 6, name: "Website Template" },
  { id: 10, name: "Greeting Card" },
];

type PendingCartProduct = {
  id: number;
  name: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected cart error.";
}

export default function ProductStore({
  productsResult,
  selectedCategoryId,
  selectedKeyword,
}: ProductStoreProps) {
  const router = useRouter();
  const { authSession, clearSession, persistSession } = useStoredAuthSession();
  const [isPending, startTransition] = useTransition();
  const products = productsResult.products;
  const pageSize = productsResult.limit > 0 ? productsResult.limit : 20;
  const totalPages = Math.max(1, Math.ceil(productsResult.total / pageSize));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Math.floor(productsResult.offset / pageSize) + 1),
  );
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(selectedKeyword);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] =
    useState<PendingCartProduct | null>(null);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  // const categoryOptions = useMemo(() => {
  //   const options = new Map<number, string>();
  //
  //   for (const category of categories) {
  //     if (category.id > 0 && !options.has(category.id)) {
  //       options.set(category.id, category.name);
  //     }
  //   }
  //
  //   for (const product of products) {
  //     if (product.category.id > 0 && !options.has(product.category.id)) {
  //       options.set(product.category.id, product.category.name);
  //     }
  //   }
  //
  //   return Array.from(options, ([id, name]) => ({ id, name }));
  // }, [categories, products]);

  const categoryOptions = Categories;

  const minCatalogPrice = useMemo(() => {
    return products.length
      ? Math.min(...products.map((product) => product.price))
      : 0;
  }, [products]);

  const maxCatalogPrice = useMemo(() => {
    return products.length
      ? Math.max(...products.map((product) => product.price))
      : 0;
  }, [products]);

  const effectiveMaxPrice = maxPrice ?? maxCatalogPrice;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      return product.price <= effectiveMaxPrice;
    });
  }, [effectiveMaxPrice, products]);

  const getProductsHref = ({
    page = 1,
    categoryId = selectedCategoryId,
    keyword = selectedKeyword,
  }: {
    page?: number;
    categoryId?: number | null;
    keyword?: string;
  } = {}) => {
    const params = new URLSearchParams();
    const trimmedKeyword = keyword.trim();

    if (trimmedKeyword) {
      params.set("keyword", trimmedKeyword);
    } else if (categoryId) {
      params.set("categoryId", String(categoryId));
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();

    return queryString ? `/products?${queryString}` : "/products";
  };

  const toggleCategory = (categoryId: number) => {
    const nextCategoryId =
      selectedCategoryId === categoryId ? null : categoryId;

    startTransition(() => {
      router.push(
        getProductsHref({ categoryId: nextCategoryId, keyword: "" }),
      );
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      router.push(
        getProductsHref({
          categoryId: null,
          keyword: searchQuery.trim(),
        }),
      );
    });
  };

  const resetFilters = () => {
    setMaxPrice(null);
    setSearchQuery("");
    startTransition(() => {
      router.push("/products");
    });
  };

  const addProductToCart = async (product: PendingCartProduct) => {
    if (addingProductId === product.id) {
      return;
    }

    setAddingProductId(product.id);
    setCartError("");
    setCartMessage("");

    try {
      await addCartItem(product.id);
      setPendingProduct(null);
      setCartMessage(`${product.name} added to cart.`);
      window.setTimeout(() => setCartMessage(""), 2500);
    } catch (error) {
      if (error instanceof CartApiError && error.status === 401) {
        clearSession();
        setPendingProduct(product);
        setAuthDialogOpen(true);
      } else {
        setCartError(getErrorMessage(error));
      }
    } finally {
      setAddingProductId(null);
    }
  };

  const handleAddToCart = (product: PendingCartProduct) => {
    if (!authSession) {
      setPendingProduct(product);
      setCartError("");
      setAuthDialogOpen(true);
      return;
    }

    void addProductToCart(product);
  };

  const handleAuthenticated = (session: AuthSession) => {
    persistSession(session);

    if (pendingProduct) {
      void addProductToCart(pendingProduct);
    }
  };

  return (
    <>
    <section className="bg-white pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-[1500px] px-5 md:px-8">
        <div className="mb-10 border-b border-stone-200 pb-8">
          <form className="relative max-w-2xl" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products by name..."
              className="w-full rounded-full border border-stone-300 bg-white px-6 py-4 pr-14 text-sm text-stone-800 outline-none transition focus:border-[#b39a42] focus:ring-2 focus:ring-[#b39a42]/20"
            />

            <button
              type="submit"
              aria-label="Search products"
              disabled={isPending}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-stone-950 text-white transition hover:bg-[#b39a42]"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-950">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold uppercase tracking-wider text-stone-400 transition hover:text-stone-950"
                >
                  Reset
                </button>
              </div>

              <div className="border-b border-stone-200 py-7">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b39a42]">
                  Product type
                </h3>
                <div className="mt-5 space-y-4">
                  {categoryOptions.length === 0 ? (
                    <p className="text-sm text-stone-500">No categories found</p>
                  ) : (
                    categoryOptions.map((category) => {
                      const checked = selectedCategoryId === category.id;

                      return (
                        <label
                          key={category.id}
                          className="flex cursor-pointer items-center gap-3 text-base text-stone-700"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isPending}
                            onChange={() => toggleCategory(category.id)}
                            className="peer sr-only"
                          />
                          <span className="flex h-5 w-5 items-center justify-center border border-stone-400 bg-white text-white peer-checked:border-[#c9b879] peer-checked:bg-[#c9b879]">
                            {checked ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span>{category.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="py-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b39a42]">
                    Price
                  </h3>
                  <span className="text-sm font-semibold text-stone-950">
                    Up to {priceFormatter.format(effectiveMaxPrice)}
                  </span>
                </div>
                {products.length > 0 && minCatalogPrice < maxCatalogPrice ? (
                  <>
                    <input
                      type="range"
                      min={minCatalogPrice}
                      max={maxCatalogPrice}
                      value={effectiveMaxPrice}
                      onChange={(event) =>
                        setMaxPrice(Number(event.target.value))
                      }
                      className="mt-6 h-1 w-full accent-[#c9b879]"
                      aria-label="Maximum price"
                    />
                    <div className="mt-4 flex items-center justify-between font-mono text-sm text-stone-500">
                      <span>{priceFormatter.format(minCatalogPrice)}</span>
                      <span>{priceFormatter.format(maxCatalogPrice)}</span>
                    </div>
                  </>
                ) : (
                  <p className="mt-5 text-sm text-stone-500">
                    {products.length > 0
                      ? priceFormatter.format(maxCatalogPrice)
                      : "No price data"}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500">
              <span>
                Showing {filteredProducts.length} of {productsResult.total}
              </span>

              {totalPages > 1 ? (
                <nav
                  aria-label="Product pagination"
                  className="flex items-center gap-3"
                >
                  {hasPreviousPage ? (
                    <Link
                      href={getProductsHref({ page: currentPage - 1 })}
                      aria-label="Previous page"
                      className="flex h-9 w-9 items-center justify-center text-stone-950 transition hover:text-[#b39a42]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Link>
                  ) : null}

                  {pageNumbers.map((page) => {
                    const isCurrentPage = page === currentPage;

                    return (
                      <Link
                        key={page}
                        href={getProductsHref({ page })}
                        aria-current={isCurrentPage ? "page" : undefined}
                        className={
                          isCurrentPage
                            ? "flex h-9 w-9 items-center justify-center bg-[#c9b879] text-sm font-bold text-white"
                            : "flex h-9 w-9 items-center justify-center text-sm font-bold text-stone-950 transition hover:text-[#b39a42]"
                        }
                      >
                        {page}
                      </Link>
                    );
                  })}

                  {hasNextPage ? (
                    <Link
                      href={getProductsHref({ page: currentPage + 1 })}
                      aria-label="Next page"
                      className="flex h-9 w-9 items-center justify-center text-stone-950 transition hover:text-[#b39a42]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </div>

            {cartMessage ? (
              <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                {cartMessage}
              </div>
            ) : null}

            {cartError ? (
              <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {cartError}
              </div>
            ) : null}

            {filteredProducts.length === 0 ? (
              <div className="border border-stone-200 bg-stone-50 p-12 text-center">
                <h2 className="text-2xl font-semibold text-stone-950">
                  No products match these filters
                </h2>
                <p className="mt-3 text-stone-500">
                  Reset filters or increase the price limit to browse more
                  products.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="group flex min-h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm shadow-stone-200/50 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-200/70"
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2bf35] focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                        <span className="absolute left-5 top-5 z-10 max-w-[calc(100%-2.5rem)] truncate rounded-full bg-[#f2bf35] px-4 py-2 text-xs font-bold text-[#5f4a0a] shadow-sm">
                          {product.category.name}
                        </span>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full object-top transition-transform duration-[6000ms] ease-linear group-hover:-translate-y-[65%]"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-7 pb-5">
                        <h2 className="text-2xl font-bold leading-tight text-stone-950 transition group-hover:text-[#6f4f00]">
                          {product.name}
                        </h2>
                        <p className="mt-2 font-mono text-lg font-bold text-[#6f4f00]">
                          {priceFormatter.format(product.price)}
                        </p>
                      </div>
                    </Link>

                    <div className="px-7 pb-7">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart({
                            id: product.id,
                            name: product.name,
                          })
                        }
                        disabled={addingProductId === product.id}
                        className="w-full rounded-lg bg-[#f2bf35] px-5 py-4 text-sm font-bold text-[#5f4a0a] transition hover:bg-stone-950 hover:text-white"
                      >
                        {addingProductId === product.id
                          ? "Adding..."
                          : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
    <AuthDialog
      open={authDialogOpen}
      session={authSession}
      onClose={() => setAuthDialogOpen(false)}
      onAuthenticated={handleAuthenticated}
      onLogout={clearSession}
    />
    </>
  );
}
