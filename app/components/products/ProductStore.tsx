"use client";

// components/product/ProductStore.tsx
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ProductsResult } from "@/services/product";

interface ProductStoreProps {
  productsResult: ProductsResult;
}

const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export default function ProductStore({ productsResult }: ProductStoreProps) {
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
  const [selectedCategories, setSelectedCategories] = useState<string[] | null>(
    null,
  );
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryNames = useMemo(() => {
    return Array.from(
      new Set(products
          // .filter((product) => product.id !== 1)
          .map((product) => product.category.name)),
    );
  }, [products]);

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
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategories === null ||
        selectedCategories.includes(product.category.name);

      //const isNotHiddenProduct = product.id !== 1;

      const matchesPrice = product.price <= effectiveMaxPrice;
      const searchableText = [
        product.name,
        product.description,
        product.category.name,
        product.sku ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = query.length === 0 || searchableText.includes(query);

      return matchesCategory && matchesPrice && matchesSearch;
    });
  }, [effectiveMaxPrice, products, searchQuery, selectedCategories]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => {
      const currentSelection = current ?? categoryNames;
      const nextSelection = currentSelection.includes(category)
        ? currentSelection.filter((item) => item !== category)
        : [...currentSelection, category];

      return nextSelection.length === categoryNames.length ? null : nextSelection;
    });
  };

  const resetFilters = () => {
    setSelectedCategories(null);
    setMaxPrice(null);
    setSearchQuery("");
  };

  const handleAddToCart = (productName: string) => {
    alert(`Added to cart: ${productName}`);
  };

  const getPageHref = (page: number) => {
    return page === 1 ? "/products" : `/products?page=${page}`;
  };

  return (
    <section className="bg-white pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-[1500px] px-5 md:px-8">
        <div className="mb-10 border-b border-stone-200 pb-8">
          <div className="relative max-w-2xl">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products by name, category, or description..."
              className="w-full rounded-full border border-stone-300 bg-white px-6 py-4 pr-14 text-sm text-stone-800 outline-none transition focus:border-[#b39a42] focus:ring-2 focus:ring-[#b39a42]/20"
            />

            <button
              type="button"
              aria-label="Search products"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-stone-950 text-white transition hover:bg-[#b39a42]"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
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
                  {categoryNames.length === 0 ? (
                    <p className="text-sm text-stone-500">No categories found</p>
                  ) : (
                    categoryNames.map((category) => {
                      const checked =
                        selectedCategories === null ||
                        selectedCategories.includes(category);

                      return (
                        <label
                          key={category}
                          className="flex cursor-pointer items-center gap-3 text-base text-stone-700"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(category)}
                            className="peer sr-only"
                          />
                          <span className="flex h-5 w-5 items-center justify-center border border-stone-400 bg-white text-white peer-checked:border-[#c9b879] peer-checked:bg-[#c9b879]">
                            {checked ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span>{category}</span>
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
                Showing {filteredProducts.length} of {products.length} loaded
                products
                {productsResult.total > products.length
                  ? ` (${productsResult.total} total)`
                  : ""}
              </span>

              {totalPages > 1 ? (
                <nav
                  aria-label="Product pagination"
                  className="flex items-center gap-3"
                >
                  {hasPreviousPage ? (
                    <Link
                      href={getPageHref(currentPage - 1)}
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
                        href={getPageHref(page)}
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
                      href={getPageHref(currentPage + 1)}
                      aria-label="Next page"
                      className="flex h-9 w-9 items-center justify-center text-stone-950 transition hover:text-[#b39a42]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </div>

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
                    className="group flex min-h-full flex-col border border-stone-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-200/60"
                  >
                    <div className="relative aspect-square overflow-hidden bg-stone-100">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 360px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-1 flex-col pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b39a42]">
                            {product.category.name}
                          </p>
                          <h2 className="mt-2 text-2xl font-bold leading-tight text-stone-950">
                            {product.name}
                          </h2>
                        </div>
                        <p className="whitespace-nowrap font-mono text-base font-bold text-blue-700">
                          {priceFormatter.format(product.price)}
                        </p>
                      </div>

                      <p className="mt-5 line-clamp-4 flex-1 text-base leading-relaxed text-stone-600">
                        {product.description}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product.name)}
                        className="mt-7 border border-stone-950 bg-[#efe3b6] px-5 py-4 text-sm font-bold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
                      >
                        Add to cart
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
  );
}
