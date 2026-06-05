"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

interface ProductDetailActionsProps {
  productId: number;
  productName: string;
}

export function ProductDetailActions({
  productId,
  productName,
}: ProductDetailActionsProps) {
  const handleAddToCart = () => {
    alert(`Added to cart: ${productName}`);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleAddToCart}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#f2bf35] px-5 text-base font-bold text-[#191815] transition hover:bg-[#dca91b]"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        Add to Cart
      </button>
      <Link
        href={`/payment?productId=${productId}`}
        className="flex h-14 w-full items-center justify-center rounded-lg bg-[#191815] px-5 text-base font-bold text-white transition hover:bg-stone-700"
      >
        Buy Now
      </Link>
    </div>
  );
}

export function RelatedProductAddButton({
  productName,
}: {
  productName: string;
}) {
  const handleAddToCart = () => {
    alert(`Added to cart: ${productName}`);
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="mt-3 h-9 w-full rounded bg-[#f2bf35] px-3 text-xs font-bold text-[#5f4a0a] transition hover:bg-stone-950 hover:text-white"
    >
      Add to Cart
    </button>
  );
}
