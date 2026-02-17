"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookEquipment } from "@/app/actions/equipment";

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  source: string;
  priceYen: number;
  vendorName: string | null;
  description: string | null;
}

interface EquipmentSelectorProps {
  eventId: string;
  categories: Record<string, CatalogItem[]>;
}

export const EquipmentSelector = ({
  eventId,
  categories,
}: EquipmentSelectorProps) => {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuantity = (itemId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: qty };
    });
  };

  const allItems = Object.values(categories).flat();
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = allItems.find((i) => i.id === id);
    if (!item) return sum;
    return sum + (item.source === "MUNICIPAL" ? 0 : item.priceYen * qty);
  }, 0);

  const handleSubmit = async () => {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([catalogItemId, quantity]) => ({ catalogItemId, quantity }));
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      await bookEquipment(eventId, items);
      setCart({});
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryNames = Object.keys(categories).sort();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">備品カタログ</h2>

      {categoryNames.length === 0 && (
        <p className="text-sm text-gray-500">
          カタログにアイテムがありません。設定から登録してください。
        </p>
      )}

      {categoryNames.map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase">
            {cat}
          </h3>
          <div className="space-y-2">
            {categories[cat].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-800"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {item.source === "MUNICIPAL"
                      ? "自治体所有（無料）"
                      : `¥${item.priceYen.toLocaleString()}/個`}
                    {item.vendorName && ` · ${item.vendorName}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.id, (cart[item.id] ?? 0) - 1)
                    }
                    className="h-8 w-8 rounded border text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">
                    {cart[item.id] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.id, (cart[item.id] ?? 0) + 1)
                    }
                    className="h-8 w-8 rounded border text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(cart).length > 0 && (
        <div className="sticky bottom-4 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {Object.values(cart).reduce((a, b) => a + b, 0)} 点選択中
              </p>
              <p className="text-sm text-gray-500">
                合計: ¥{cartTotal.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isSubmitting ? "処理中..." : "予約する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
