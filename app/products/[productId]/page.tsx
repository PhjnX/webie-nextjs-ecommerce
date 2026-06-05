import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Brush,
  Code2,
  FileText,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  ProductDetailActions,
  RelatedProductAddButton,
} from "@/app/components/products/ProductDetailActions";
import { getProductById, getProducts, type Product } from "@/services/product";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

// const featureCards = [
//   {
//     title: "Customizable",
//     description:
//       "Adjust colors, copy, sections, and brand details to match your business identity.",
//     icon: Brush,
//   },
//   {
//     title: "High Performance",
//     description:
//       "Built for fast loading, mobile-first browsing, and clear customer conversion paths.",
//     icon: Zap,
//   },
//   {
//     title: "Lifetime Updates",
//     description:
//       "Your digital product can keep improving with content, fixes, and feature revisions.",
//     icon: RefreshCcw,
//   },
// ];

const technicalFoundations = [
  "Responsive layout ready for mobile, tablet, and desktop",
  "Clean content structure for search and sharing",
  "Accessible color, spacing, and interaction patterns",
  "Optimized media delivery through the product catalog",
];

const packageIncludes = [
  "Product design preview",
  "Editable business information sections",
  "Contact and conversion-focused content blocks",
  "Commercial use for your brand or campaign",
];

function parseProductId(value: string) {
  const productId = Number(value);

  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

function getDescriptionParagraphs(description: string) {
  return description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getAvailabilityLabel(product: Product) {
  return product.stock > 0
    ? `${product.stock} available`
    : "Digital delivery";
}

async function getRelatedProducts(product: Product) {
  const categoryId = product.category.id > 0 ? product.category.id : null;

  if (!categoryId) {
    return [];
  }

  const categoryResult = await getProducts({
    offset: 0,
    limit: 100,
    categoryId,
  });

  return categoryResult.products.filter((item) => item.id !== product.id);
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { productId: productIdParam } = await params;
  const productId = parseProductId(productIdParam);

  if (!productId) {
    return {
      title: "Product Not Found | Webie",
    };
  }

  const product = await getProductById(productId);

  if (!product) {
    return {
      title: "Product Not Found | Webie",
    };
  }

  return {
    title: `${product.name} | Webie`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { productId: productIdParam } = await params;
  const productId = parseProductId(productIdParam);

  if (!productId) {
    notFound();
  }

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);
  const descriptionParagraphs = getDescriptionParagraphs(product.description);
  const specs = [
    ["Product ID", `#${product.id}`],
    ["Category", product.category.name],
    ["SKU", product.sku ?? "Not assigned"],
    ["Availability", getAvailabilityLabel(product)],
    ["Delivery", "Digital product"],
  ];

  return (
    <section className="bg-[#f7f7f5] pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <Link
          href="/products"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)] lg:items-start">
          <div className="relative overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
            <div className=" group relative aspect-[4/3] min-h-[360px] bg-stone-100">
              {/*<Image*/}
              {/*  src={product.image}*/}
              {/*  alt={product.name}*/}
              {/*  fill*/}
              {/*  priority*/}
              {/*  sizes="(max-width: 1024px) 100vw, 680px"*/}
              {/*  className="object-cover object-top"*/}
              {/*/>*/}
              <img
                  src="https://vcard.webie.com.vn/assets/img/templates/vcard24.png"
                  className="w-full object-top transition-transform duration-[6000ms] ease-linear group-hover:-translate-y-[65%]"
              />

            </div>
            {/*<div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 rounded-md bg-white/90 px-4 py-3 shadow-lg shadow-stone-300/40 backdrop-blur">*/}
            {/*  <div className="flex flex-wrap gap-2">*/}
            {/*    <span className="rounded bg-stone-950 px-2.5 py-1 text-[10px] font-bold uppercase text-white">*/}
            {/*      Desktop*/}
            {/*    </span>*/}
            {/*    <span className="rounded bg-stone-950 px-2.5 py-1 text-[10px] font-bold uppercase text-white">*/}
            {/*      Mobile*/}
            {/*    </span>*/}
            {/*    <span className="rounded bg-stone-950 px-2.5 py-1 text-[10px] font-bold uppercase text-white">*/}
            {/*      Tablet*/}
            {/*    </span>*/}
            {/*  </div>*/}
            {/*  <span className="text-xs font-medium text-stone-500">*/}
            {/*    Live product preview*/}
            {/*  </span>*/}
            {/*</div>*/}
          </div>

          <div>
            <span className="inline-flex rounded-full bg-[#f2bf35] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#5f4a0a]">
              {product.category.name}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-stone-950 md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 font-mono text-2xl font-bold text-[#6f4f00]">
              {priceFormatter.format(product.price)}
            </p>
            {/*<p className="mt-5 text-base leading-7 text-stone-600">*/}
            {/*  {product.description}*/}
            {/*</p>*/}

            <ul className="mt-6 space-y-3 text-sm text-stone-700">
              <li className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 flex-none text-[#dca91b]" />
                Responsive and mobile optimized
              </li>
              <li className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 flex-none text-[#dca91b]" />
                Search-friendly product content
              </li>
              <li className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 flex-none text-[#dca91b]" />
                Ready for brand customization
              </li>
            </ul>

            <div className="mt-8">
              <ProductDetailActions
                productId={product.id}
                productName={product.name}
              />
            </div>
          </div>
        </div>

        {/*<div className="mt-20 grid grid-cols-1 gap-7 md:grid-cols-3">*/}
        {/*  {featureCards.map(({ title, description, icon: Icon }) => (*/}
        {/*    <article*/}
        {/*      key={title}*/}
        {/*      className="rounded-lg border border-stone-200 border-t-[#f2bf35] border-t-2 bg-white p-7 shadow-sm shadow-stone-200/60"*/}
        {/*    >*/}
        {/*      <Icon className="h-7 w-7 text-stone-950" aria-hidden="true" />*/}
        {/*      <h2 className="mt-8 text-lg font-bold text-stone-950">*/}
        {/*        {title}*/}
        {/*      </h2>*/}
        {/*      <p className="mt-3 text-sm leading-6 text-stone-500">*/}
        {/*        {description}*/}
        {/*      </p>*/}
        {/*    </article>*/}
        {/*  ))}*/}
        {/*</div>*/}

        <div className="mt-20 grid grid-cols-1 gap-10 rounded-lg border border-stone-200 bg-white p-7 shadow-sm md:p-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h2 className="text-3xl font-extrabold text-stone-950 md:text-4xl">
              Product Description
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-stone-600">
              {descriptionParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-stone-950" />
                  <h3 className="text-lg font-bold text-stone-950">
                    Technical Foundations
                  </h3>
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                  {technicalFoundations.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-stone-950" />
                  <h3 className="text-lg font-bold text-stone-950">
                    Package Includes
                  </h3>
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                  {packageIncludes.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <aside className="rounded-lg bg-stone-100 p-6 lg:self-start">
            <h3 className="text-lg font-bold text-stone-950">
              Specifications
            </h3>
            <dl className="mt-5 divide-y divide-stone-200">
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[112px_1fr] gap-4 py-4 text-sm"
                >
                  <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    {label}
                  </dt>
                  <dd className="font-bold text-stone-950">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-stone-700">
              <ShieldCheck className="h-5 w-5 text-[#dca91b]" />
              Verified catalog product
            </div>
          </aside>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-stone-950 md:text-4xl">
                  Related Products
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Discover more digital products from the Webie catalog.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-bold text-stone-950 transition hover:text-[#6f4f00]"
              >
                View all products
                <FileText className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="overflow-hidden">
              <div className="related-scroll-track flex w-max gap-6">
                {[...relatedProducts, ...relatedProducts].map((relatedProduct, index) => (
                    <article
                        key={`${relatedProduct.id}-${index}`}
                        className="w-[260px] shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm shadow-stone-200/60"
                    >
                      <Link href={`/products/${relatedProduct.id}`}>
                        <div className="relative aspect-[4/3] bg-stone-100">
                          <Image
                              src={relatedProduct.image}
                              alt={relatedProduct.name}
                              fill
                              sizes="260px"
                              className="object-cover object-top"
                          />
                        </div>

                        <div className="p-4 pb-2">
                          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-stone-950">
                            {relatedProduct.name}
                          </h3>

                          <p className="mt-2 font-mono text-sm font-bold text-[#6f4f00]">
                            {priceFormatter.format(relatedProduct.price)}
                          </p>
                        </div>
                      </Link>

                      <div className="px-4 pb-4">
                        <RelatedProductAddButton productName={relatedProduct.name} />
                      </div>
                    </article>
                ))}
              </div>
            </div>
            {/*<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">*/}
            {/*  {relatedProducts.map((relatedProduct) => (*/}
            {/*    <article*/}
            {/*      key={relatedProduct.id}*/}
            {/*      className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm shadow-stone-200/60"*/}
            {/*    >*/}
            {/*      <Link href={`/products/${relatedProduct.id}`}>*/}
            {/*        <div className="relative aspect-[4/3] bg-stone-100">*/}
            {/*          <Image*/}
            {/*            src={relatedProduct.image}*/}
            {/*            alt={relatedProduct.name}*/}
            {/*            fill*/}
            {/*            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"*/}
            {/*            className="object-cover object-top"*/}
            {/*          />*/}
            {/*        </div>*/}
            {/*        <div className="p-4 pb-2">*/}
            {/*          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-stone-950">*/}
            {/*            {relatedProduct.name}*/}
            {/*          </h3>*/}
            {/*          <p className="mt-2 font-mono text-sm font-bold text-[#6f4f00]">*/}
            {/*            {priceFormatter.format(relatedProduct.price)}*/}
            {/*          </p>*/}
            {/*        </div>*/}
            {/*      </Link>*/}
            {/*      <div className="px-4 pb-4">*/}
            {/*        <RelatedProductAddButton*/}
            {/*          productName={relatedProduct.name}*/}
            {/*        />*/}
            {/*      </div>*/}
            {/*    </article>*/}
            {/*  ))}*/}
            {/*</div>*/}
          </section>
        ) : null}
      </div>
    </section>
  );
}
