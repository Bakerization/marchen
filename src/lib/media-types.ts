export const EVENT_PHOTO_TYPE_OPTIONS = [
  "HERO",
  "VENUE",
  "MAP",
  "POSTER",
  "GALLERY",
] as const;

export const VENDOR_PHOTO_TYPE_OPTIONS = [
  "LOGO",
  "SHOP",
  "PRODUCT",
  "MENU",
  "OTHER",
] as const;

export const EVENT_PHOTO_LABEL: Record<(typeof EVENT_PHOTO_TYPE_OPTIONS)[number], string> = {
  HERO: "ヒーロー画像",
  VENUE: "会場写真",
  MAP: "マップ画像",
  POSTER: "ポスター",
  GALLERY: "ギャラリー",
};

export const VENDOR_PHOTO_LABEL: Record<(typeof VENDOR_PHOTO_TYPE_OPTIONS)[number], string> = {
  LOGO: "ロゴ",
  SHOP: "店舗外観",
  PRODUCT: "商品写真",
  MENU: "メニュー",
  OTHER: "その他",
};

