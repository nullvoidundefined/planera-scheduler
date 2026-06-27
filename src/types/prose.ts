/**
 * Shared content shapes for the portfolio site's prose routes: a titled section with
 * paragraphs (ProseSection) and a single FAQ disclosure (FaqEntry). Content modules
 * under src/content/ are typed against these.
 */
export interface FaqEntry {
    answer: string;
    question: string;
}

export interface ProseSection {
    body: string[];
    heading: string;
    id: string;
}
