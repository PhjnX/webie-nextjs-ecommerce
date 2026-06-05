"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import AuthDialog from "@/app/components/auth/AuthDialog";
import { useStoredAuthSession } from "@/app/components/auth/useStoredAuthSession";
import { type AuthSession } from "@/services/auth";
import { addCartItem, CartApiError } from "@/services/cart";

interface ProductDetailActionsProps {
  productId: number;
  productName: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected cart error.";
}

function useProductCartAction({
  productId,
  productName,
}: ProductDetailActionsProps) {
  const router = useRouter();
  const { authSession, clearSession, persistSession } = useStoredAuthSession();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [redirectAfterAdd, setRedirectAfterAdd] = useState(false);

  const addCurrentProductToCart = async (goToPayment: boolean) => {
    if (adding) {
      return;
    }

    setAdding(true);
    setMessage("");
    setErrorMessage("");

    try {
      await addCartItem(productId);
      setMessage(`${productName} added to cart.`);
      window.setTimeout(() => setMessage(""), 2500);

      if (goToPayment) {
        router.push("/payment");
      }
    } catch (error) {
      if (error instanceof CartApiError && error.status === 401) {
        clearSession();
        setRedirectAfterAdd(goToPayment);
        setAuthDialogOpen(true);
      } else {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      setAdding(false);
    }
  };

  const requestAddToCart = (goToPayment = false) => {
    setRedirectAfterAdd(goToPayment);

    if (!authSession) {
      setAuthDialogOpen(true);
      return;
    }

    void addCurrentProductToCart(goToPayment);
  };

  const handleAuthenticated = (session: AuthSession) => {
    persistSession(session);
    void addCurrentProductToCart(redirectAfterAdd);
  };

  const authDialog = (
    <AuthDialog
      open={authDialogOpen}
      session={authSession}
      onClose={() => setAuthDialogOpen(false)}
      onAuthenticated={handleAuthenticated}
      onLogout={clearSession}
    />
  );

  return {
    adding,
    authDialog,
    errorMessage,
    message,
    requestAddToCart,
  };
}

export function ProductDetailActions({
  productId,
  productName,
}: ProductDetailActionsProps) {
  const { adding, authDialog, errorMessage, message, requestAddToCart } =
    useProductCartAction({ productId, productName });

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => requestAddToCart(false)}
        disabled={adding}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#f2bf35] px-5 text-base font-bold text-[#191815] transition hover:bg-[#dca91b]"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {adding ? "Adding..." : "Add to Cart"}
      </button>
      <button
        type="button"
        onClick={() => requestAddToCart(true)}
        disabled={adding}
        className="flex h-14 w-full items-center justify-center rounded-lg bg-[#191815] px-5 text-base font-bold text-white transition hover:bg-stone-700"
      >
        Buy Now
      </button>
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {authDialog}
    </div>
  );
}

export function RelatedProductAddButton({
                                          productId,
                                          productName,
                                        }: ProductDetailActionsProps) {
  const { adding, authDialog, errorMessage, message, requestAddToCart } =
      useProductCartAction({ productId, productName });

  return (
    <>
      <button
          type="button"
          onClick={() => requestAddToCart(false)}
          disabled={adding}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#f2bf35] px-5 text-base font-bold text-[#191815] transition hover:bg-[#dca91b]"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {adding ? "Adding..." : "Add to Cart"}
      </button>
      {message ? (
        <p className="mt-2 text-xs font-medium text-emerald-700">{message}</p>
      ) : null}
      {errorMessage ? (
        <p className="mt-2 text-xs font-medium text-red-700">{errorMessage}</p>
      ) : null}
      {authDialog}
    </>
  );
}
