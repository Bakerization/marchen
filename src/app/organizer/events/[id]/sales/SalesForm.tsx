"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSalesRecord } from "@/app/actions/sales";

interface SalesFormProps {
  eventId: string;
  vendors: { name: string; profileId: string }[];
}

const PAYMENT_METHODS = ["現金", "PayPay", "クレジットカード", "電子マネー", "その他"];

export const SalesForm = ({ eventId, vendors }: SalesFormProps) => {
  const router = useRouter();
  const [vendorName, setVendorName] = useState(vendors[0]?.name ?? "");
  const [amountYen, setAmountYen] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !amountYen) return;

    setIsSubmitting(true);
    try {
      const vendor = vendors.find((v) => v.name === vendorName);
      await createSalesRecord({
        eventId,
        vendorName,
        vendorProfileId: vendor?.profileId,
        amountYen: parseInt(amountYen, 10),
        paymentMethod,
        note: note || undefined,
      });
      setAmountYen("");
      setNote("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 space-y-3"
    >
      <h2 className="text-lg font-semibold">売上を記録</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">出店者</label>
          <select
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {vendors.map((v) => (
              <option key={v.profileId} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">金額 (円)</label>
          <input
            type="number"
            value={amountYen}
            onChange={(e) => setAmountYen(e.target.value)}
            placeholder="10000"
            required
            min="0"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">支払い方法</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">メモ</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="備考"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {isSubmitting ? "記録中..." : "売上を記録"}
      </button>
    </form>
  );
};
