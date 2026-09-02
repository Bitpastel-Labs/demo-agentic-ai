export const OPEN_ANALYSIS_EVENT = "open-analysis";

/** Ask the accordion with this id to expand (the anchor link handles scrolling). */
export function openAnalysis(id: string) {
  window.dispatchEvent(new CustomEvent<string>(OPEN_ANALYSIS_EVENT, { detail: id }));
}
