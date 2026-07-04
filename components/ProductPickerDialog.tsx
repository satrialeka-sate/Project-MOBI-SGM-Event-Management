"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Package } from "lucide-react";
import { useProductList } from "@/hooks/use-products";
import type { ProductItem } from "@/lib/api/product";

interface ProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: ProductItem) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: ProductPickerDialogProps) {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProductList(open);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;

    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.gimmick.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-11 pl-10"
            autoFocus
          />
        </div>

        <div className="mt-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <Package className="mb-2 h-8 w-8" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  onClick={() => {
                    onSelect(product);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sgm-red-light">
                    <Package className="h-5 w-5 text-sgm-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs font-medium text-gray-600">
                      {product.package}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {product.gimmick}
                    </p>
                    <p className="text-xs font-medium text-gray-700 mt-0.5">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
