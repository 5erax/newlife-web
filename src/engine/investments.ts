import raw from "../content/investments.json" with { type: "json" };
import apkCoins from "../content/apk/coins.json" with { type: "json" };
import apkStocks from "../content/apk/stocks.json" with { type: "json" };
import type {
  Action,
  GameState,
  InvestmentState,
  InvestmentGroup,
  MarketInstrument,
} from "./types";
import { random } from "./rng";
import { addLog, clamp, money, requireGame, stat, MAX_MONEY } from "./helpers";
import { changeContext } from "./changes";
import { localPrice } from "./world";

export const INVESTMENT_LABELS: Record<InvestmentGroup, string> = {
  bond: "Trái phiếu",
  stock: "Cổ phiếu",
  fund: "Quỹ",
  penny: "Cổ phiếu nhỏ",
  crypto: "Tiền mã hoá",
};
export const MAX_MARKET_PRICE = 100_000_000_000;
export const APK_STOCK_SECTORS: Record<string, string> = {
  communication: "Truyền thông",
  consumer: "Hàng tiêu dùng",
  energy: "Năng lượng",
  financials: "Tài chính",
  healthcare: "Y tế",
  industrials: "Công nghiệp",
  materials: "Vật liệu",
  technology: "Công nghệ",
};
export const apkStockById = new Map(apkStocks.map((i) => [i.id, i]));
export function emptyInvestments(apk = false): InvestmentState {
  return {
    instruments: [
      ...raw.filter((i) => !apk || !["crypto", "stock"].includes(i.group)),
      ...(apk ? apkCoins : []),
      ...(apk ? apkStocks : []),
    ].map((i) => ({
      id: i.id,
      name: i.name,
      ticker: i.ticker,
      group: i.group as InvestmentGroup,
      price: i.initialPrice,
      initialPrice: i.initialPrice,
      risk: i.risk,
      liquidity: i.liquidity,
      yieldRate: i.yieldRate,
      termYears: i.termYears,
      trendiness: 50,
      listedAge: 0,
      status: "active",
      history: [{ age: 0, price: i.initialPrice }],
    })),
    positions: [],
    traded: {},
    realized: 0,
    invested: 0,
    dividends: 0,
    health: { bond: 75, stock: 60, fund: 65, penny: 40, crypto: 50 },
    news: [],
    history: [],
  };
}
export function valueForUnits(price: number, units: number, roundUp = false) {
  requireGame(
    Number.isSafeInteger(price) &&
      price >= 0 &&
      Number.isSafeInteger(units) &&
      units >= 0,
    "Giá hoặc số lượng không hợp lệ.",
  );
  const product = BigInt(price) * BigInt(units),
    value = (product + (roundUp ? 999n : 0n)) / 1000n;
  requireGame(
    value <= BigInt(MAX_MONEY),
    "Giá trị vị thế vượt giới hạn mô phỏng.",
  );
  return Number(value);
}
export function portfolioValue(s: Pick<GameState, "investments">) {
  const value = s.investments.positions.reduce(
    (n, p) =>
      n +
      valueForUnits(
        s.investments.instruments.find((i) => i.id === p.id)!.price,
        p.units,
      ),
    0,
  );
  requireGame(
    Number.isSafeInteger(value) && value <= MAX_MONEY,
    "Danh mục vượt giới hạn mô phỏng.",
  );
  return value;
}
const physicalValue = (s: GameState) =>
  s.assets.filter((a) => a.alive).reduce((n, a) => n + a.value * a.quantity, 0);
export function marketCapacity(s: GameState, i: MarketInstrument) {
  return Math.max(
    0,
    Math.floor(
      500000000 *
        i.liquidity *
        (0.5 + i.trendiness / 100) *
        (0.5 + s.investments.health[i.group] / 100) -
        (s.investments.traded[i.id] ?? 0),
    ),
  );
}
export function tradeQuote(i: MarketInstrument, units: number, buy: boolean) {
  const principal = valueForUnits(i.price, units, buy),
    fee = principal ? Math.max(1, Math.ceil(principal * 0.01)) : 0;
  return {
    principal,
    fee,
    total: buy ? principal + fee : Math.max(0, principal - fee),
  };
}
function marketNews(s: GameState, text: string) {
  s.investments.news.push({ age: s.age, text });
  s.investments.news = s.investments.news.slice(-50);
  addLog(s, text, "money");
}
function accounting(
  s: GameState,
  key: "dividends" | "realized",
  amount: number,
) {
  const total = s.investments[key] + amount;
  s.investments[key] = clamp(
    total,
    key === "realized" ? -MAX_MONEY : 0,
    MAX_MONEY,
  );
  if (total !== s.investments[key])
    marketNews(
      s,
      "Thống kê đầu tư tích lũy chạm giới hạn số học; tiền thực nhận vẫn được ghi riêng trong sổ tiền.",
    );
}
function addInstrument(s: GameState, group: InvestmentGroup) {
  if (s.investments.instruments.length >= 240) return;
  const serial = s.investments.instruments.length,
    id = `inv_new_${group}_${s.age}_${serial}`;
  const names =
    group === "crypto"
      ? [
          "LáNon",
          "MưaRào",
          "ĐảoMây",
          "CầuVồng",
          "CáChuồn",
          "SaoBăng",
          "ĐồiXanh",
          "BúpMăng",
        ]
      : ["Hạ Tầng", "Đô Thị", "Điện Sạch"];
  const name =
    names[Math.floor(random(s) * names.length)] +
    (group === "crypto" ? "Coin" : " Trái phiếu") +
    " " +
    serial;
  const price =
    group === "crypto"
      ? Math.max(1, Math.round(500 + random(s) * 9500))
      : 100000;
  s.investments.instruments.push({
    id,
    name,
    ticker: (group === "crypto" ? "NC" : "TPM") + serial,
    group,
    price,
    initialPrice: price,
    risk:
      group === "crypto"
        ? 85 + Math.floor(random(s) * 16)
        : 15 + Math.floor(random(s) * 25),
    liquidity: group === "crypto" ? 0.15 + random(s) * 0.5 : 0.7,
    yieldRate: group === "crypto" ? 0 : 0.04 + random(s) * 0.04,
    termYears: group === "crypto" ? 0 : 4,
    trendiness: 30 + Math.floor(random(s) * 51),
    listedAge: s.age,
    status: "active",
    history: [{ age: s.age, price }],
  });
  marketNews(
    s,
    `${name} (${s.investments.instruments.at(-1)!.ticker}) vừa được niêm yết. Lịch sử còn ngắn, chưa biết tương lai.`,
  );
}
function credit(s: GameState, amount: number, label: string) {
  const available = Math.max(
    0,
    MAX_MONEY - s.money - physicalValue(s) - portfolioValue(s),
  );
  const paid = Math.min(amount, available);
  if (paid) money(s, paid, label);
  return paid;
}
export function investmentYear(s: GameState) {
  changeContext(
    s,
    "investments",
    "Thu nhập và biến động thị trường đầu tư trong năm.",
  );
  s.investments.traded = {};
  const regime = random(s),
    shock =
      regime < 0.15 ? -0.25 : regime > 0.88 ? 0.25 : (random(s) - 0.5) * 0.15;
  for (const group of Object.keys(s.investments.health) as InvestmentGroup[])
    s.investments.health[group] = clamp(
      Math.round(
        s.investments.health[group] + shock * 30 + (random(s) - 0.5) * 12,
      ),
    );
  marketNews(
    s,
    shock < -0.15
      ? "Thị trường có một năm căng thẳng: giá và thanh khoản nhiều tài sản giảm."
      : shock > 0.15
        ? "Thị trường hưng phấn: dòng tiền tăng, nhưng giá cao cũng kéo theo rủi ro đảo chiều."
        : "Thị trường phân hoá: từng sản phẩm có diễn biến khác nhau.",
  );
  for (const i of s.investments.instruments) {
    if (i.status !== "active") continue;
    const roll =
      clamp(
        Math.round(
          (random(s) + shock * 0.12 + (i.trendiness - 50) / 2500) * 100000,
        ),
        0,
        100000,
      ) / 100000;
    let multiplier = 1;
    if (i.group === "crypto") {
      multiplier =
        roll < i.risk / 750
          ? 0
          : roll < 0.25
            ? 0.01 + random(s) * 0.19
            : roll < 0.5
              ? 0.3 + random(s) * 0.5
              : roll < 0.8
                ? 0.6 + random(s) * 1.4
                : roll < 0.94
                  ? 2 + random(s) * 4
                  : roll < 0.985
                    ? 10 + random(s) * 30
                    : 50 + random(s) * 150;
    } else if (i.group === "penny")
      multiplier =
        roll < i.risk / 1500
          ? 0
          : roll < 0.18
            ? 0.1 + random(s) * 0.3
            : roll > 0.98
              ? 5 + random(s) * 15
              : Math.max(0.1, 1 + shock * 2 + (random(s) - 0.5) * 1.4);
    else if (i.group === "bond")
      multiplier =
        roll < i.risk / 3000
          ? 0
          : Math.max(0.7, 1 + shock * 0.12 + (random(s) - 0.5) * 0.06);
    else
      multiplier = Math.max(
        0.15,
        1.05 +
          shock * (i.group === "stock" ? 1.4 : 0.7) +
          (random(s) - 0.5) *
            (i.group === "stock" ? 0.55 : 0.3) *
            (0.5 + i.risk / 100),
      );
    const old = i.price,
      holding = s.investments.positions.find((p) => p.id === i.id);
    let price =
      multiplier === 0
        ? 0
        : Math.max(1, Math.min(MAX_MARKET_PRICE, Math.round(old * multiplier)));
    if (holding) {
      const oldValue = valueForUnits(old, holding.units),
        available = Math.max(
          0,
          MAX_MONEY - s.money - physicalValue(s) - portfolioValue(s) + oldValue,
        );
      const cap = Number(
        (BigInt(Math.floor(available)) * 1000n) / BigInt(holding.units),
      );
      if (price > cap) {
        price = cap;
        marketNews(
          s,
          `${i.name} chạm giới hạn số học của mô phỏng; phần định giá vượt giới hạn được chặn.`,
        );
      }
    }
    i.price = price;
    i.trendiness = clamp(
      Math.round(
        i.trendiness + (price > old ? 8 : -10) + (random(s) - 0.5) * 15,
      ),
    );
    if (!price) {
      i.status = "delisted";
      marketNews(
        s,
        `${i.name} ${i.group === "crypto" ? "ngừng dự án và mất toàn bộ giá trị" : "mất khả năng hoạt động hoặc thanh toán"}. Vị thế có thể được xoá ghi lỗ.`,
      );
    } else if (price / old >= 10)
      marketNews(
        s,
        `${i.name} tăng ${Math.round((price / old - 1) * 100).toLocaleString("vi-VN")}% trong năm. Đây là nhánh hiếm; giá vẫn có thể sụp đổ sau đó.`,
      );
    else if (price / old < 0.3)
      marketNews(
        s,
        `${i.name} giảm ${Math.round((1 - price / old) * 100)}% trong năm.`,
      );
    i.history.push({ age: s.age, price });
    i.history = i.history.slice(-151);
    if (holding && i.status === "active") {
      const yieldValue = valueForUnits(
        i.group === "bond" ? i.initialPrice : i.price,
        holding.units,
      );
      const paid = credit(
        s,
        Math.round(yieldValue * i.yieldRate),
        `Lãi/cổ tức ${i.name}`,
      );
      accounting(s, "dividends", paid);
      if (holding.maturityAge !== undefined && s.age >= holding.maturityAge) {
        const face = valueForUnits(i.initialPrice, holding.units);
        s.investments.positions = s.investments.positions.filter(
          (p) => p !== holding,
        );
        const principal = credit(s, face, `Đáo hạn ${i.name}`);
        accounting(s, "realized", principal - holding.costBasis);
        marketNews(
          s,
          `${i.name} đã đáo hạn; khoản gốc và lãi thực nhận được ghi vào sổ tiền.`,
        );
      }
    }
  }
  if (s.age >= 15 && random(s) < 0.6) {
    const count = 1 + Math.floor(random(s) * 2);
    for (let n = 0; n < count; n++) addInstrument(s, "crypto");
  }
  if (
    s.age >= 15 &&
    s.investments.instruments.filter(
      (i) => i.group === "bond" && i.status === "active",
    ).length < 3
  )
    addInstrument(s, "bond");
  s.investments.history.push({
    age: s.age,
    value: portfolioValue(s),
    cost: s.investments.positions.reduce((n, p) => n + p.costBasis, 0),
  });
  s.investments.history = s.investments.history.slice(-151);
}
export function investmentAction(s: GameState, a: Action) {
  if (!["investmentBuy", "investmentSell", "marketResearch"].includes(a.type))
    return false;
  requireGame(
    s.age >= 18 && !s.prisonYears,
    "Đầu tư mở từ 18 tuổi khi không đang thụ án.",
  );
  changeContext(s, "investments", "Quyết định trong danh mục đầu tư.");
  if (a.type === "marketResearch") {
    requireGame(
      ["news", "advisor", "opinion"].includes(a.mode),
      "Công cụ không hợp lệ.",
    );
    const key = `market_${a.mode}`;
    requireGame(
      s.time > 0 && !(s.activityUses[key] ?? 0),
      "Mỗi công cụ dùng một lượt/năm và cần thời gian.",
    );
    money(
      s,
      -localPrice(s, a.mode === "advisor" ? 100000 : 0),
      "Đọc thông tin thị trường",
    );
    s.time--;
    s.activityUses[key] = 1;
    stat(s, "intelligence", 1);
    addLog(
      s,
      a.mode === "advisor"
        ? "Cố vấn trong game nhắc bạn so sánh rủi ro, thanh khoản và mức tập trung vốn. Không ai biết chắc giá năm sau."
        : a.mode === "opinion"
          ? "Một ý kiến có thể đúng hoặc sai. Hãy nhìn cả những sản phẩm đã thất bại, thay vì chỉ nhìn người thắng."
          : "Bạn đọc các tin đã xảy ra trong năm; tin này không bốc trước giá tương lai.",
      "money",
    );
    return true;
  }
  if (a.type !== "investmentBuy" && a.type !== "investmentSell") return false;
  const i = s.investments.instruments.find((i) => i.id === a.id);
  requireGame(i, "Không có sản phẩm đầu tư này.");
  requireGame(
    Number.isSafeInteger(a.units) && a.units >= 1 && a.units <= 1e12,
    "Số lượng phải từ 0,001 đến một tỷ đơn vị.",
  );
  const p = s.investments.positions.find((p) => p.id === i.id),
    buy = a.type === "investmentBuy",
    quote = tradeQuote(i, a.units, buy);
  if (i.price)
    requireGame(
      quote.principal <= marketCapacity(s, i),
      "Thanh khoản năm nay không đủ cho giao dịch này. Có thể giảm số lượng hoặc đợi năm sau.",
    );
  if (buy) {
    if (i.group === "bond") valueForUnits(i.initialPrice, a.units);
    requireGame(
      s.investments.invested + quote.total <= MAX_MONEY,
      "Tổng vốn giao dịch đã chạm giới hạn mô phỏng.",
    );
    requireGame(
      i.status === "active" && i.price > 0,
      "Sản phẩm đã mất giá trị hoặc ngừng giao dịch.",
    );
    requireGame(
      !p || i.group !== "bond",
      "Lô trái phiếu đang có: hãy đợi đáo hạn hoặc bán trước khi mua lô mới.",
    );
    requireGame(
      !p || p.units + a.units <= 1e12,
      "Số lượng vị thế vượt giới hạn.",
    );
    requireGame(
      s.investments.positions.length < 240 || !!p,
      "Đã đạt giới hạn vị thế.",
    );
    money(s, -quote.total, `Mua ${i.name} · phí 1%`);
    if (p) {
      p.units += a.units;
      p.costBasis += quote.total;
    } else
      s.investments.positions.push({
        id: i.id,
        units: a.units,
        costBasis: quote.total,
        ...(i.group === "bond" ? { maturityAge: s.age + i.termYears } : {}),
      });
    s.investments.invested += quote.total;
  } else {
    requireGame(p && a.units <= p.units, "Không sở hữu đủ số lượng để bán.");
    const basis = Number(
      (BigInt(p.costBasis) * BigInt(a.units)) / BigInt(p.units),
    );
    p.units -= a.units;
    p.costBasis -= basis;
    if (!p.units)
      s.investments.positions = s.investments.positions.filter((x) => x !== p);
    money(s, quote.total, `Bán ${i.name} · phí 1%`);
    accounting(s, "realized", quote.total - basis);
  }
  s.investments.traded[i.id] =
    (s.investments.traded[i.id] ?? 0) + quote.principal;
  addLog(
    s,
    `${buy ? "Mua" : "Bán"} ${a.units / 1000} ${i.ticker}. Phí, giá vốn và lãi/lỗ đã cập nhật theo giá hiện tại; tải lại giữ đúng giao dịch.`,
    "money",
  );
  return true;
}
