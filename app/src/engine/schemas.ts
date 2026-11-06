import { z, type ZodType } from 'zod';
import { TACTICS } from './types';

export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentError';
  }
}

export const LocalizedSchema = z.object({ ms: z.string().min(1), en: z.string().optional() });
export type Localized = z.infer<typeof LocalizedSchema>;

export const TacticSchema = z.enum(TACTICS);

export const TacticInfoSchema = z.object({
  code: TacticSchema,
  name: LocalizedSchema,
  does: LocalizedSchema,
  cue: LocalizedSchema,
  tip: LocalizedSchema,
});
export type TacticInfo = z.infer<typeof TacticInfoSchema>;
export const TacticsFileSchema = z.array(TacticInfoSchema);

export const SwipeCardSchema = z
  .object({
    id: z.string().min(1),
    channel: z.enum(['sms', 'chat', 'email']),
    sender: z.string().min(1),
    text: LocalizedSchema,
    answer: z.enum(['scam', 'legit']),
    tactics: z.array(TacticSchema),
    why: LocalizedSchema,
  })
  .superRefine((card, ctx) => {
    if (card.answer === 'legit' && card.tactics.length !== 0) {
      ctx.addIssue({ code: 'custom', path: ['tactics'], message: 'legit card must have no tactics' });
    }
    if (card.answer === 'scam' && card.tactics.length < 1) {
      ctx.addIssue({ code: 'custom', path: ['tactics'], message: 'scam card needs at least one tactic' });
    }
  });
export type SwipeCard = z.infer<typeof SwipeCardSchema>;
export const CardsFileSchema = z.array(SwipeCardSchema);

/** Registry of content file name -> schema. Owner tasks register theirs here. */
export const CONTENT_FILES: Record<string, ZodType> = {
  'tactics.json': TacticsFileSchema,
  'cards.json': CardsFileSchema,
};

export function parseContent<T>(schema: ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const msg = result.error.issues
    .map((i) => `${file}: ${i.path.map(String).join('.')} ${i.message}`)
    .join('\n');
  throw new ContentError(msg);
}
