// Types for the build-time virtual module served by app/vite-plugins/ink.ts.
// JSON exports are null until their file exists and its schema is registered in CONTENT_FILES.
declare module 'virtual:celik-content' {
  export const scenarios: Record<string, import('./engine/types').CompiledScenario>;
  export const tactics: import('./engine/schemas').TacticInfo[] | null;
  export const cards: import('./engine/schemas').SwipeCard[] | null;
  export const concepts: import('./engine/schemas').ConceptInfo[] | null;
  export const sindiket: unknown;
  export const drills: unknown;
  export const semester: unknown;
  export const pages: unknown;
}
