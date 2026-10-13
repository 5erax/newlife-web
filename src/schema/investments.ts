import { z } from "zod";
import { idSchema } from "./content";
import { MAX_MARKET_PRICE, emptyInvestments } from "../engine/investments";
const amount = z.number().int().min(0).max(1e15),
  score = z.number().int().min(0).max(100),
  age = z.number().int().min(0).max(150);
export const investmentSchema = z
  .object({
    instruments: z
      .array(
        z.object({
          id: idSchema,
          name: z.string().min(1).max(100),
          ticker: z.string().min(1).max(30),
          group: z.enum(["bond", "stock", "fund", "penny", "crypto"]),
          price: amount.max(MAX_MARKET_PRICE),
          initialPrice: amount.min(1).max(MAX_MARKET_PRICE),
          risk: score,
          liquidity: z.number().min(0.01).max(1),
          yieldRate: z.number().min(0).max(0.25),
          termYears: z.number().int().min(0).max(10),
          trendiness: score,
          listedAge: age,
          status: z.enum(["active", "delisted"]),
          history: z
            .array(z.object({ age, price: amount.max(MAX_MARKET_PRICE) }))
            .min(1)
            .max(151),
        }),
      )
      .min(1)
      .max(240),
    positions: z
      .array(
        z.object({
          id: idSchema,
          units: z.number().int().min(1).max(1e12),
          costBasis: amount,
          maturityAge: age.optional(),
        }),
      )
      .max(240),
    traded: z.record(idSchema, amount),
    realized: z.number().int().min(-1e15).max(1e15),
    invested: amount,
    dividends: amount,
    health: z.object({
      bond: score,
      stock: score,
      fund: score,
      penny: score,
      crypto: score,
    }),
    news: z.array(z.object({ age, text: z.string().min(1).max(1000) })).max(50),
    history: z.array(z.object({ age, value: amount, cost: amount })).max(151),
  })
  .default(emptyInvestments);
