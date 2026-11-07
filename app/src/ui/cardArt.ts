// Flat card art (assets/tactic-*.svg, assets/concept-*.svg): one picture per tactic and per finance concept.
import type { Concept, Tactic } from '../engine/types';
import greed from '../../../assets/tactic-greed.svg';
import urgency from '../../../assets/tactic-urgency.svg';
import authority from '../../../assets/tactic-authority.svg';
import fear from '../../../assets/tactic-fear.svg';
import secrecy from '../../../assets/tactic-secrecy.svg';
import social from '../../../assets/tactic-social.svg';
import payfirst from '../../../assets/tactic-payfirst.svg';
import bajet from '../../../assets/concept-bajet.svg';
import kecemasan from '../../../assets/concept-kecemasan.svg';
import kompaun from '../../../assets/concept-kompaun.svg';
import risiko from '../../../assets/concept-risiko.svg';
import hutang from '../../../assets/concept-hutang.svg';
import semak from '../../../assets/concept-semak.svg';

export const TACTIC_ART: Record<Tactic, string> = { greed, urgency, authority, fear, secrecy, social, payfirst };
export const CONCEPT_ART: Record<Concept, string> = { bajet, kecemasan, kompaun, risiko, hutang, semak };
