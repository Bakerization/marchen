import "dotenv/config";
import { hashSync } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "password123";
const HASH = hashSync(PASSWORD, 10);

type EventSeed = {
  title: string;
  description: string;
  location: string;
  eventDate: string; // ISO
  deadline: string; // ISO
  maxVendors: number;
};

type BakerySeed = {
  shopName: string;
  area: string;
  url?: string;
};

// 10 real-world market / bread events around Tokyo in 2026
const events: EventSeed[] = [
  {
    title: "世田谷パン祭り 2026",
    description: "全国の人気ベーカリーが集まる世田谷公園の恒例パンフェス。",
    location: "世田谷公園",
    eventDate: "2026-10-05T01:00:00Z",
    deadline: "2026-09-10T14:59:59Z",
    maxVendors: 120,
  },
  {
    title: "青山パン祭り 2026 春",
    description: "国連大学前中庭で行われる青山パン祭りの春開催。",
    location: "渋谷区神宮前 国連大学前中庭",
    eventDate: "2026-05-17T01:00:00Z",
    deadline: "2026-04-20T14:59:59Z",
    maxVendors: 90,
  },
  {
    title: "太陽のマルシェ 2026 初夏",
    description: "勝どき駅前の都市型ファーマーズマーケット。",
    location: "中央区勝どき 太陽のマルシェ特設会場",
    eventDate: "2026-06-08T01:00:00Z",
    deadline: "2026-05-10T14:59:59Z",
    maxVendors: 80,
  },
  {
    title: "青山ファーマーズマーケット 2026 梅雨前",
    description: "食材とパンが集まる国連大学前の定期マーケット特別回。",
    location: "国連大学前広場 (Farmer's Market @ UNU)",
    eventDate: "2026-04-26T01:00:00Z",
    deadline: "2026-04-05T14:59:59Z",
    maxVendors: 70,
  },
  {
    title: "二子玉川ライズ マルシェ 2026 GW",
    description: "多摩川沿いの屋外マルシェ。パンとローカル食材が中心。",
    location: "二子玉川ライズ 中央広場",
    eventDate: "2026-05-04T01:00:00Z",
    deadline: "2026-04-10T14:59:59Z",
    maxVendors: 60,
  },
  {
    title: "有明ガーデン パン＆グルメマルシェ 2026",
    description: "湾岸エリアで開催されるパンとグルメの屋外市。",
    location: "江東区 有明ガーデン",
    eventDate: "2026-07-12T01:00:00Z",
    deadline: "2026-06-15T14:59:59Z",
    maxVendors: 70,
  },
  {
    title: "日比谷公園 マルシェ 2026 秋",
    description: "日比谷公園噴水広場で行われる秋のマルシェ。",
    location: "千代田区 日比谷公園 噴水広場",
    eventDate: "2026-09-14T01:00:00Z",
    deadline: "2026-08-20T14:59:59Z",
    maxVendors: 80,
  },
  {
    title: "吉祥寺キラリナ パンフェス 2026",
    description: "井の頭線直結の商業施設で行われるパン特化フェス。",
    location: "キラリナ京王吉祥寺 1F コンコース",
    eventDate: "2026-08-23T01:00:00Z",
    deadline: "2026-07-31T14:59:59Z",
    maxVendors: 50,
  },
  {
    title: "豊洲シーサイドマルシェ 2026",
    description: "海沿いの公園で開催される屋外マルシェ。パンとシーフードが集合。",
    location: "江東区 豊洲ぐるり公園",
    eventDate: "2026-06-21T01:00:00Z",
    deadline: "2026-05-25T14:59:59Z",
    maxVendors: 70,
  },
  {
    title: "上野マルイ パンまつり 2026",
    description: "駅直結の上野マルイで行われるパン物産展。",
    location: "上野マルイ 1F イベントスペース",
    eventDate: "2026-11-15T01:00:00Z",
    deadline: "2026-10-20T14:59:59Z",
    maxVendors: 60,
  },
];

// 100 real bakeries / chains in and around Tokyo (names as of 2025)
const bakeries: BakerySeed[] = [
  { shopName: "Levain ルヴァン", area: "渋谷区 富ヶ谷" },
  { shopName: "VIRON 渋谷店", area: "渋谷区 道玄坂" },
  { shopName: "VIRON 丸の内店", area: "千代田区 丸の内" },
  { shopName: "365日", area: "渋谷区 代々木公園" },
  { shopName: "365日と日本橋", area: "中央区 日本橋" },
  { shopName: "Gontran Cherrier 新宿サザンテラス", area: "渋谷区 代々木" },
  { shopName: "Maison Kayser 丸の内", area: "千代田区 丸の内" },
  { shopName: "Maison Kayser 池袋東武", area: "豊島区 西池袋" },
  { shopName: "Maison Kayser 日本橋高島屋", area: "中央区 日本橋" },
  { shopName: "Signifiant Signifié", area: "世田谷区 太子堂" },
  { shopName: "Le Pain Quotidien 芝公園", area: "港区 芝公園" },
  { shopName: "Le Pain Quotidien 東京ミッドタウン", area: "港区 六本木" },
  { shopName: "Boulangerie Bonheur 成城", area: "世田谷区 成城" },
  { shopName: "Boulangerie Bonheur 三軒茶屋", area: "世田谷区 太子堂" },
  { shopName: "Boulangerie Bonheur 用賀", area: "世田谷区 用賀" },
  { shopName: "ANDERSEN 青山", area: "港区 北青山" },
  { shopName: "ANDERSEN 池袋西武", area: "豊島区 南池袋" },
  { shopName: "DONQ 銀座三越", area: "中央区 銀座" },
  { shopName: "DONQ 新宿小田急", area: "新宿区 西新宿" },
  { shopName: "DONQ 池袋西武", area: "豊島区 南池袋" },
  { shopName: "Vie de France 新宿西口", area: "新宿区 西新宿" },
  { shopName: "Vie de France 東京駅八重洲", area: "中央区 八重洲" },
  { shopName: "Vie de France 品川", area: "港区 港南" },
  { shopName: "Little Mermaid 有楽町", area: "千代田区 有楽町" },
  { shopName: "Little Mermaid 吉祥寺", area: "武蔵野市 吉祥寺" },
  { shopName: "Little Mermaid 町田", area: "町田市 原町田" },
  { shopName: "PAUL 六本木", area: "港区 六本木" },
  { shopName: "PAUL 大丸東京", area: "千代田区 丸の内" },
  { shopName: "PAUL 渋谷ヒカリエ", area: "渋谷区 渋谷" },
  { shopName: "Dominique Ansel Bakery 銀座", area: "中央区 銀座" },
  { shopName: "BOUL'ANGE 渋谷", area: "渋谷区 渋谷" },
  { shopName: "BOUL'ANGE 新宿", area: "新宿区 新宿" },
  { shopName: "BOUL'ANGE 日本橋", area: "中央区 日本橋" },
  { shopName: "R Baker ららぽーと豊洲", area: "江東区 豊洲" },
  { shopName: "R Baker 亀戸", area: "江東区 亀戸" },
  { shopName: "ÉCHIRÉ Maison du Beurre 丸の内", area: "千代田区 丸の内" },
  { shopName: "TRUFFLE Bakery 三軒茶屋", area: "世田谷区 太子堂" },
  { shopName: "TRUFFLE Bakery 広尾", area: "港区 南麻布" },
  { shopName: "TRUFFLE Bakery 学芸大学", area: "目黒区 鷹番" },
  { shopName: "BRICOLAGE bread & co.", area: "港区 六本木" },
  { shopName: "PATH", area: "渋谷区 富ヶ谷" },
  { shopName: "パンとエスプレッソと 表参道", area: "渋谷区 神宮前" },
  { shopName: "パンとエスプレッソと自由形 二子玉川", area: "世田谷区 玉川" },
  { shopName: "カタネベーカリー", area: "渋谷区 西原" },
  { shopName: "タルイベーカリー", area: "世田谷区 代沢" },
  { shopName: "ダンディゾン", area: "武蔵野市 吉祥寺" },
  { shopName: "メゾン イチ 代官山", area: "渋谷区 代官山町" },
  { shopName: "木村屋總本店 銀座本店", area: "中央区 銀座" },
  { shopName: "銀座木村家 グランスタ東京", area: "千代田区 丸の内" },
  { shopName: "HOKUO 新宿西口", area: "新宿区 西新宿" },
  { shopName: "HOKUO 経堂", area: "世田谷区 宮坂" },
  { shopName: "神戸屋キッチン 新宿西口", area: "新宿区 西新宿" },
  { shopName: "神戸屋キッチン 大手町", area: "千代田区 大手町" },
  { shopName: "神戸屋キッチン 品川", area: "港区 港南" },
  { shopName: "JOHAN 大丸東京", area: "千代田区 丸の内" },
  { shopName: "JOHAN 池袋西武", area: "豊島区 南池袋" },
  { shopName: "BURDIGALA EXPRESS グランスタ東京", area: "千代田区 丸の内" },
  { shopName: "BURDIGALA MARUNOUCHI", area: "千代田区 丸の内" },
  { shopName: "Le Grenier à Pain 麻布十番", area: "港区 麻布十番" },
  { shopName: "EPEE", area: "武蔵野市 吉祥寺" },
  { shopName: "パリ セヴェイユ", area: "目黒区 自由が丘" },
  { shopName: "モンタボー 自由が丘", area: "目黒区 自由が丘" },
  { shopName: "モンタボー 赤坂", area: "港区 赤坂" },
  { shopName: "ANDERSEN 渋谷東急フードショー", area: "渋谷区 道玄坂" },
  { shopName: "Boulangerie La Terre", area: "世田谷区 三宿" },
  { shopName: "ペリカン", area: "台東区 寿" },
  { shopName: "マルイチベーグル", area: "港区 白金" },
  { shopName: "GARDEN HOUSE CRAFTS 代官山", area: "渋谷区 代官山町" },
  { shopName: "GARDEN HOUSE CRAFTS 新宿", area: "新宿区 新宿" },
  { shopName: "HIGU BAGEL", area: "新宿区 高田馬場" },
  { shopName: "ベッカライ徳多朗 たまプラーザ", area: "横浜市 青葉区" },
  { shopName: "Zopf ツオップ", area: "松戸市 小金原" },
  { shopName: "Aux Bacchanales 紀尾井町", area: "千代田区 紀尾井町" },
  { shopName: "Aux Bacchanales 銀座", area: "中央区 銀座" },
  { shopName: "ル・プチメック 日比谷", area: "千代田区 有楽町" },
  { shopName: "ル・プチメック 東京", area: "千代田区 丸の内" },
  { shopName: "RITUEL 代官山", area: "渋谷区 猿楽町" },
  { shopName: "RITUEL 日本橋", area: "中央区 日本橋" },
  { shopName: "Bread, Espresso & Machiya 浅草", area: "台東区 浅草" },
  { shopName: "俺のBakery 恵比寿", area: "渋谷区 恵比寿" },
  { shopName: "俺のBakery 銀座", area: "中央区 銀座" },
  { shopName: "俺のBakery 町田", area: "町田市 原町田" },
  { shopName: "THE CITY BAKERY 広尾", area: "港区 南麻布" },
  { shopName: "THE CITY BAKERY 品川", area: "港区 港南" },
  { shopName: "THE CITY BAKERY 吉祥寺", area: "武蔵野市 吉祥寺" },
  { shopName: "Thierry Marx La Boulangerie", area: "港区 虎ノ門" },
  { shopName: "ベーカリー&レストラン沢村 広尾", area: "港区 南麻布" },
  { shopName: "ベーカリー&レストラン沢村 新宿", area: "新宿区 新宿" },
  { shopName: "PANYA ASHIYA 麻布十番", area: "港区 麻布十番" },
  { shopName: "PANYA ASHIYA 代々木上原", area: "渋谷区 西原" },
  { shopName: "一本堂 早稲田", area: "新宿区 早稲田" },
  { shopName: "一本堂 田園調布", area: "大田区 田園調布" },
  { shopName: "LIBERTÉ 神楽坂", area: "新宿区 神楽坂" },
  { shopName: "LIBERTÉ 吉祥寺", area: "武蔵野市 吉祥寺" },
  { shopName: "ハドソンマーケットベーカーズ", area: "港区 麻布十番" },
  { shopName: "BOULANGERIE SEIJI ASAKURA", area: "世田谷区 下馬" },
  { shopName: "DONQ 町田", area: "町田市 原町田" },
  { shopName: "Vie de France 北千住", area: "足立区 千住" },
  { shopName: "Little Mermaid 北千住", area: "足立区 千住" },
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "vendor";

async function upsertOrganizer() {
  const user = await prisma.user.upsert({
    where: { email: "tokyo.organizer@marchen.local" },
    update: {},
    create: {
      email: "tokyo.organizer@marchen.local",
      name: "Tokyo Metro Market Office",
      passwordHash: HASH,
      role: "ORGANIZER",
    },
  });

  const profile = await prisma.organizerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      organizationName: "Tokyo Metro Market Office",
      contactPhone: "03-5000-6000",
      website: "https://example.com/tokyo-metro-market",
      userId: user.id,
    },
  });

  return profile.id;
}

async function seedEvents(organizerId: string) {
  for (const ev of events) {
    const existing = await prisma.event.findFirst({ where: { title: ev.title } });
    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          description: ev.description,
          location: ev.location,
          eventDate: new Date(ev.eventDate),
          deadline: new Date(ev.deadline),
          maxVendors: ev.maxVendors,
          status: "OPEN",
          organizerId,
        },
      });
    } else {
      await prisma.event.create({
        data: {
          title: ev.title,
          description: ev.description,
          location: ev.location,
          eventDate: new Date(ev.eventDate),
          deadline: new Date(ev.deadline),
          status: "OPEN",
          maxVendors: ev.maxVendors,
          organizerId,
        },
      });
    }
  }
}

async function seedBakeries() {
  let index = 1;
  for (const bakery of bakeries) {
    const slug = slugify(bakery.shopName) + "-" + String(index).padStart(3, "0");
    const email = `${slug}@marchen.local`;
    const phone = `0907${String(100000 + index).slice(-6)}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: bakery.shopName },
      create: {
        email,
        name: bakery.shopName,
        passwordHash: HASH,
        role: "VENDOR",
      },
    });

    const vendor = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {
        shopName: bakery.shopName,
        description: bakery.area,
        category: "bread",
        contactPhone: phone,
      },
      create: {
        shopName: bakery.shopName,
        description: bakery.area,
        category: "bread",
        contactPhone: phone,
        userId: user.id,
      },
    });

    // Optional: attach a placeholder photo URL via Document table
    const photoUrl = `https://images.unsplash.com/featured/?bread,bakery&sig=${index}`;
    await prisma.document
      .create({
        data: {
          fileName: `${slug}-photo.jpg`,
          fileUrl: photoUrl,
          mimeType: "image/jpeg",
          sizeBytes: 0,
          vendorId: vendor.id,
        },
      })
      .catch(() => {
        // ignore duplicate photo URLs if already created
      });

    index += 1;
  }
}

async function main() {
  console.log("Seeding additional Tokyo events & bakeries...");
  console.log("Default password for created users:", PASSWORD);

  const organizerId = await upsertOrganizer();
  await seedEvents(organizerId);
  await seedBakeries();

  console.log(`Seeded ${events.length} events and ${bakeries.length} bakeries.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
