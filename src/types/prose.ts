/**
 * Shared content shapes for the portfolio site's prose routes: a titled section with
 * paragraphs (ProseSection). Content modules under src/content/ are typed against these.
 */
export interface ProseSection {
    body: string[];
    heading: string;
    id: string;
}
