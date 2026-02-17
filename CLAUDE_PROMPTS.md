# Claude実行プロンプト集 — Marchen完成用

各プロンプトは独立して実行可能。Phase順に実行すること。
プロジェクトのCLAUDE.mdを必ず参照させること。

---

## Prompt 1: チャットベース・ワークフローエンジン基盤

```
プロジェクト: /Users/hatanakakenji/Documents/panlab/marchen
CLAUDE.mdの規約に厳密に従うこと。

### タスク
パンマルシェ開催の全ワークフローをチャットで完結できるAIアシスタント機能を実装せよ。

### 要件

1. **スキーマ追加** (`prisma/schema.prisma`):
   - `ChatThread` モデル: id, eventId(Event関連), messages[], createdAt, updatedAt
   - `ChatMessage` モデル: id, threadId, role("user"|"assistant"|"system"), content, metadata(Json?), createdAt
   - Eventモデルに `chatThreads ChatThread[]` リレーション追加
   - マイグレーションSQL生成

2. **AI統合** (`src/lib/ai.ts`):
   - Vercel AI SDK (`ai` + `@ai-sdk/openai`) を使用
   - パンマルシェ開催アシスタントのシステムプロンプトを定義
   - ワークフローステップ: ①企画構想 → ②パン屋選定 → ③面談日程調整 → ④開催日決定 → ⑤備品手配 → ⑥人員計画 → ⑦告知作成 → ⑧当日運営 → ⑨事後報告
   - 各ステップを「ツール」としてAIに公開（tool calling）

3. **サーバーアクション** (`src/app/actions/chat.ts`):
   - `getOrCreateThread(eventId)` — ORGANIZER認証必須
   - `sendMessage(threadId, content)` — ユーザーメッセージ送信 + AI応答取得
   - `getMessages(threadId)` — メッセージ履歴取得

4. **チャットUI**:
   - `src/components/Chat.tsx` — "use client"、メッセージ一覧 + テキスト入力 + 送信ボタン
   - `src/components/ChatSidebar.tsx` — ワークフロー進捗（現在のステップをハイライト）
   - `src/app/organizer/events/[id]/chat/page.tsx` — チャットページ（ORGANIZER認証）

5. **ナビゲーション更新**:
   - オーガナイザーのイベント詳細からチャットページへのリンク追加

### 制約
- Server Componentデフォルト。"use client"は最小限
- 全アクションでRBAC認証
- 監査ログ記録
- pnpm使用
- `pnpm build` と `pnpm test` が通ること
```

---

## Prompt 2: ベンダー面談日程調整の完成

```
プロジェクト: /Users/hatanakakenji/Documents/panlab/marchen
CLAUDE.mdの規約に厳密に従うこと。

### 背景
既存実装:
- MeetingSlot, VendorTargetモデルは定義済み
- Google Calendar OAuth2連携済み（src/lib/google.ts）
- 面談スロット手動作成・自然言語入力済み（src/app/actions/meetings.ts）
- FreeBusyPanel, MeetingManager UIあり

### タスク
ベンダー（パン屋）側が面談候補日を選べるUI + AI日程最適化を実装せよ。

### 要件

1. **スキーマ追加**:
   - `MeetingInvite` モデル: id, vendorTargetId, token(unique, cuid), slots(MeetingSlot[]), expiresAt, respondedAt, createdAt
   - VendorTargetに `meetingInvites MeetingInvite[]` リレーション追加

2. **面談招待フロー** (`src/app/actions/meetings.ts` に追加):
   - `createMeetingInvite(vendorTargetId, slotIds[])` — 候補スロットを含む招待トークン生成
   - `getMeetingInviteByToken(token)` — トークンから招待情報取得（認証不要）
   - `respondToInvite(token, selectedSlotId)` — ベンダーがスロットを選択（認証不要）

3. **ベンダー向け公開ページ**:
   - `src/app/meeting/[token]/page.tsx` — ログイン不要、トークンベースアクセス
   - スマホ対応のカレンダーUI（候補日が視覚的にわかる）
   - 選択→確認ボタン→MeetingSlotステータス更新
   - 有効期限切れ表示

4. **独自カレンダーコンポーネント**:
   - `src/components/AvailabilityCalendar.tsx` — "use client"
   - 月表示、候補スロットをハイライト
   - タップで選択
   - react-day-pickerまたは自作

5. **AI日程最適化** (`src/lib/schedule-optimizer.ts`):
   - 入力: 全VendorTargetの面談結果（各ベンダーの空き日情報）
   - 出力: 最大参加可能な開催候補日リスト（スコア付き）
   - 「MUST_HAVEベンダー全員参加可能」を最優先制約

6. **通知連携**:
   - 招待作成時 → メールまたはInstagram DM文面生成
   - ベンダー承認時 → オーガナイザーに通知
   - `src/app/actions/notifications.ts` — sendEmail, generateInstagramDM

### 制約
- 面談選択ページはログイン不要（トークンベース）
- スマホファーストUI
- 全アクションで監査ログ
- `pnpm build` が通ること
```

---

## Prompt 3: アメニティ・備品管理

```
プロジェクト: /Users/hatanakakenji/Documents/panlab/marchen
CLAUDE.mdの規約に厳密に従うこと。

### 背景
EquipmentBookingモデル（itemName, quantity, source, status, costYen, vendorName, notes, neededDate）は既存。
EquipmentSource enum（MUNICIPAL, PARTNER_VENDOR, PURCHASE）は既存。

### タスク
業務用貸出業者の備品カタログ + 自治体所有備品の管理 + 発注フローを実装せよ。

### 要件

1. **スキーマ追加**:
   - `EquipmentCatalog` モデル: id, name, category, source(EquipmentSource), priceYen, vendorName?, description?, imageUrl?, isActive(default true), createdAt
   - EquipmentBookingに `catalogItemId` リレーション追加（optional）

2. **備品カタログ管理** (`src/app/actions/equipment.ts`):
   - `listCatalogItems(source?)` — カタログ一覧（フィルター可）
   - `createCatalogItem(data)` — ADMIN/ORGANIZER認証
   - `updateCatalogItem(id, data)` — ADMIN/ORGANIZER認証
   - `bookEquipment(eventId, items[])` — イベントへの備品予約
   - `getEventEquipment(eventId)` — イベントの予約済み備品一覧

3. **UI**:
   - `src/app/organizer/events/[id]/equipment/page.tsx` — 備品選択画面
   - カタログをカテゴリ別に表示（テント、テーブル、椅子、電源、看板など）
   - 数量指定 + 合計金額表示
   - 「購入・予約」ボタン → EquipmentBooking作成
   - 自治体所有（MUNICIPAL）は無料表示

4. **備品カタログ設定ページ**:
   - `src/app/organizer/settings/equipment/page.tsx` — 自治体の備品登録・編集
   - 提携業者の備品もここで登録

5. **シードデータ追加**:
   - テント(3000円/日), テーブル(1000円/日), 椅子(500円/日), 電源タップ(自治体所有・無料) などの初期データ

### 制約
- MVP: 実際の決済は行わない。「発注する」ボタンで注文確認メール送信のみ
- 全アクションでRBAC + 監査ログ
- `pnpm build` が通ること
```

---

## Prompt 4: 人員計画・ボランティア管理

```
プロジェクト: /Users/hatanakakenji/Documents/panlab/marchen
CLAUDE.mdの規約に厳密に従うこと。

### 背景
StaffingPlan（role, headcount, start, end, notes）とVolunteerInvite（email, name, status, notes）モデルは既存。
VolunteerStatus enum（INVITED, CONFIRMED, DECLINED, CANCELLED）は既存。

### タスク
AI人員算出 + ボランティア招待・リマインドメール機能を実装せよ。

### 要件

1. **AI人員算出** (`src/lib/staffing-calculator.ts`):
   - 入力: maxVendors, 会場面積(m²)?, 想定来場者数?, 開催時間(hours)
   - 出力: 役割別推奨人数（受付, 誘導, 設営/撤収, 駐車場, 本部, 救護）
   - 計算ロジック: ベンダー数 × 係数ベースの簡易アルゴリズム
   - チャット（Phase 1）からも呼び出し可能にする

2. **人員計画UI** (`src/app/organizer/events/[id]/staffing/page.tsx`):
   - AI提案表示 + 手動調整
   - StaffingPlan作成・編集

3. **ボランティア管理UI** (`src/app/organizer/events/[id]/volunteers/page.tsx`):
   - メールアドレス + 名前入力フォーム（複数一括登録可）
   - 招待メール送信ボタン
   - ステータス一覧表示（INVITED/CONFIRMED/DECLINED/CANCELLED）

4. **メール送信基盤** (`src/lib/mailer.ts`):
   - Resendパッケージ使用
   - `sendEmail(to, subject, html)` — 汎用送信関数
   - `sendVolunteerInvite(invite)` — ボランティア招待テンプレート
   - `sendReminder(invite)` — リマインドメール（前日 + 当日朝）
   - 環境変数: RESEND_API_KEY, EMAIL_FROM

5. **サーバーアクション** (`src/app/actions/volunteers.ts`):
   - `inviteVolunteers(eventId, volunteers[])` — 一括招待 + メール送信
   - `getVolunteers(eventId)` — 一覧取得
   - `updateVolunteerStatus(id, status)` — ステータス更新

6. **リマインドスケジュール**:
   - MVP: `src/app/api/cron/reminders/route.ts` — Vercel Cron対応APIルート
   - 前日18:00と当日07:00にリマインドメール送信

### 制約
- 全アクションでRBAC + 監査ログ
- メール送信失敗時はNotificationテーブルにエラー記録
- `pnpm build` が通ること
```

---

## Prompt 5: イベント告知・仕様書自動生成

```
プロジェクト: /Users/hatanakakenji/Documents/panlab/marchen
CLAUDE.mdの規約に厳密に従うこと。

### タスク
公開イベントページ + デザイナー向け仕様書自動生成を実装せよ。

### 要件

1. **公開イベントページの強化** (`src/app/events/[id]/page.tsx` 改修):
   - 既存ページを拡張: 出店者一覧（ACCEPTED申請のショップ名・カテゴリ）表示
   - ボランティア応募フォーム埋め込み（メール + 名前 → VolunteerInvite作成）
   - OGP metadataタグ設定（SNSシェア用）

2. **仕様書自動生成** (`src/app/actions/spec-generator.ts`):
   - `generateEventSpec(eventId)` — ORGANIZER認証
   - イベント情報 + 出店者 + 日時場所 + 想定規模をMarkdown形式で出力
   - コピペ可能なテキスト出力
   - チャット（Phase 1）から「告知用の仕様書を作って」で呼び出し可能

3. **仕様書プレビューUI**:
   - `src/app/organizer/events/[id]/spec/page.tsx`
   - Markdownプレビュー + クリップボードコピーボタン
   - AI（Phase 1のチャット機能）で内容を調整可能

4. **OGP・シェア機能**:
   - `src/app/events/[id]/opengraph-image.tsx` — Next.js動的OGP画像生成
   - Twitterカード・Facebook対応

### 制約
- ボランティア応募は認証不要（メールアドレスのみ）
- `pnpm build` が通ること
```

---

## Prompt 6: 当日運営（売上・天気・決済）

```
プロジェクト: /Users/hatanakakenji/Documents/panlab/marchen
CLAUDE.mdの規約に厳密に従うこと。

### 背景
SalesRecord（vendorName, amountYen, paymentMethod, note）とWeatherAlert（summary, riskLevel, source, capturedAt）モデルは既存。

### タスク
当日の売上入力 + 天気アラート + 決済リンク機能を実装せよ。

### 要件

1. **売上入力UI** (`src/app/organizer/events/[id]/sales/page.tsx`):
   - 出店者別の売上入力フォーム（金額 + 支払い方法 + メモ）
   - ACCEPTEDベンダー一覧を自動表示
   - リアルタイム合計表示
   - SalesRecordに保存

2. **天気アラート** (`src/lib/weather.ts`):
   - OpenWeatherMap API連携
   - `checkWeather(lat, lng, date)` — 天気予報取得
   - 降水確率 > 50% → riskLevel: "HIGH"
   - `src/app/api/cron/weather/route.ts` — 毎日チェック、イベント前日に通知

3. **天気表示**:
   - イベント詳細ページに天気バッジ表示（晴れ/曇り/雨リスク）
   - 雨リスクの場合はオーガナイザーにメール通知

4. **PayPay連携（MVP）**:
   - paymentMethodに"PAYPAY"オプション追加
   - MVP: PayPayリンク（手動設定したQRコードURL）を表示
   - 将来: PayPay API統合の拡張ポイントをコメントで記載

### 制約
- 全アクションでRBAC + 監査ログ
- 天気API失敗時はgraceful degradation
- `pnpm build` が通ること
```

---

## Prompt 7: レポート・感想シェア

```
プロジェクト: /Users/hatanakakenji/Documents/panlab/marchen
CLAUDE.mdの規約に厳密に従うこと。

### タスク
地方公共団体向け会計報告・活動報告の自動生成 + 感想シェア機能を実装せよ。

### 要件

1. **スキーマ追加**:
   - `Feedback` モデル: id, eventId, authorId?, authorName?, content, rating(1-5)?, isPublic(default false), createdAt
   - Eventに `feedbacks Feedback[]` リレーション追加

2. **レポート生成** (`src/app/actions/report-generator.ts`):
   - `generateAccountingReport(eventId)` — 会計報告書
     - 予算（Budget）vs 実績、備品費用（EquipmentBooking）、売上合計（SalesRecord）
     - Markdown + CSV出力
   - `generateActivityReport(eventId)` — 活動報告書
     - イベント概要、出店者数、来場者数（入力値）、ボランティア数、売上サマリー
     - 地方公共団体の報告書フォーマット
   - チャットから「会計報告書を作って」で呼び出し可能

3. **レポートUI**:
   - `src/app/organizer/events/[id]/reports/page.tsx`
   - 会計報告 / 活動報告のタブ切り替え
   - プレビュー + ダウンロード（Markdown/CSV）
   - AI（チャット）で内容を修正可能

4. **感想シェア**:
   - `src/app/events/[id]/feedback/page.tsx` — 公開フォーム（認証不要）
   - 名前（任意）+ 感想テキスト + 評価（星1-5）
   - 公開フラグ（オーガナイザーが承認後に公開）
   - `src/app/events/[id]/page.tsx` に公開済み感想を表示

5. **サーバーアクション** (`src/app/actions/feedback.ts`):
   - `submitFeedback(eventId, data)` — 認証不要
   - `getFeedbacks(eventId, publicOnly?)` — 一覧取得
   - `toggleFeedbackPublic(id)` — ORGANIZER認証

### 制約
- 感想投稿は認証不要（スパム対策: rate limiting）
- レポートはチャットからも生成可能にする
- `pnpm build` が通ること
```

---

## 実行順序チェックリスト

```
□ Phase 1: Prompt 1 実行 → pnpm build 確認 → git commit
□ Phase 2: Prompt 2 実行 → pnpm build 確認 → git commit
□ Phase 3: Prompt 3 実行 → pnpm build 確認 → git commit
□ Phase 4: Prompt 4 実行 → pnpm build 確認 → git commit
□ Phase 5: Prompt 5 実行 → pnpm build 確認 → git commit
□ Phase 6: Prompt 6 実行 → pnpm build 確認 → git commit
□ Phase 7: Prompt 7 実行 → pnpm build 確認 → git commit
□ 結合テスト → 全ワークフロー動作確認
□ シードデータ更新 → デモ可能な状態に
```

## 追加パッケージインストール（Phase 1前に実行）

```bash
pnpm add ai @ai-sdk/openai resend date-fns react-day-picker
```
