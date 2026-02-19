/**
 * Paper discovery and fetching from arXiv.
 *
 * This is the core of "papers-with-claudecode" — the agent reads real papers,
 * extracts knowledge, and writes structured explorations to the knowledge graph.
 */

export interface Paper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  published: string;
  url: string;
}

// Map our topic paths to arXiv category queries
const TOPIC_TO_ARXIV: Record<string, string> = {
  'ai/transformers': 'cat:cs.CL+AND+all:transformer',
  'ai/transformers/attention': 'cat:cs.CL+AND+all:attention+mechanism',
  'ai/transformers/decoder-only': 'cat:cs.CL+AND+(all:GPT+OR+all:decoder-only)',
  'ai/transformers/encoder-only': 'cat:cs.CL+AND+(all:BERT+OR+all:encoder-only)',
  'ai/reinforcement-learning': 'cat:cs.LG+AND+all:reinforcement+learning',
  'ai/state-space-models': 'cat:cs.LG+AND+(all:state+space+model+OR+all:Mamba+OR+all:S4)',
  'ai/diffusion': 'cat:cs.CV+AND+all:diffusion+model',
  'ai/multimodal': 'cat:cs.CV+AND+(all:multimodal+OR+all:vision+language)',
  'ai/alignment': 'cat:cs.AI+AND+(all:alignment+OR+all:RLHF)',
  'ai/agents': 'cat:cs.AI+AND+(all:autonomous+agent+OR+all:tool+use+LLM)',
  'crypto/consensus': 'cat:cs.DC+AND+all:consensus+protocol',
  'crypto/defi': 'cat:cs.CR+AND+(all:decentralized+finance+OR+all:DeFi)',
  'crypto/zk': 'cat:cs.CR+AND+(all:zero+knowledge+proof+OR+all:zkSNARK)',
  'math/category-theory': 'cat:math.CT',
  'math/topology': 'cat:math.AT+AND+all:algebraic+topology',
};

// Fallback: construct query from topic path
function topicToQuery(topicPath: string): string {
  if (TOPIC_TO_ARXIV[topicPath]) return TOPIC_TO_ARXIV[topicPath];

  // Convert topic path to search terms
  const parts = topicPath.split('/');
  const terms = parts.map(p => p.replace(/-/g, ' ')).join(' ');
  return `all:${encodeURIComponent(terms)}`;
}

/**
 * Fetch papers from arXiv for a given topic.
 */
export async function fetchPapers(topicPath: string, maxResults = 5): Promise<Paper[]> {
  const query = topicToQuery(topicPath);
  const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=relevance&sortOrder=descending&max_results=${maxResults}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  return parseArxivResponse(xml);
}

/**
 * Fetch recent/trending papers for a topic (sorted by submission date).
 */
export async function fetchRecentPapers(topicPath: string, maxResults = 5): Promise<Paper[]> {
  const query = topicToQuery(topicPath);
  const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  return parseArxivResponse(xml);
}

/**
 * Build rich exploration context from a set of papers.
 * This is passed to aiExplore() so the LLM generates knowledge grounded in real research.
 */
export function buildPaperContext(papers: Paper[], topicPath: string): string {
  if (papers.length === 0) return '';

  const sections = papers.map((p, i) => {
    const authors = p.authors.slice(0, 3).join(', ') + (p.authors.length > 3 ? ' et al.' : '');
    return [
      `### Paper ${i + 1}: "${p.title}"`,
      `Authors: ${authors} (${p.published.slice(0, 4)})`,
      `arXiv: ${p.arxivId}`,
      `Abstract: ${p.abstract}`,
    ].join('\n');
  });

  return [
    `You are exploring the topic "${topicPath}" by reading research papers.`,
    `Below are ${papers.length} relevant papers. Synthesize their contributions into a structured exploration.`,
    `Focus on: key innovations, how they relate to each other, what problems they solve, and what gaps remain.`,
    `Always cite papers by author and year.`,
    '',
    ...sections,
  ].join('\n\n');
}

/**
 * Pick a subtopic for deeper exploration based on a paper's content.
 */
export function suggestSubtopic(paper: Paper, parentTopic: string): string {
  // Extract key concept from title for subtopic naming
  const title = paper.title.toLowerCase();

  // Common patterns
  const subtopicPatterns: [RegExp, string][] = [
    [/attention/i, 'attention'],
    [/transformer/i, 'transformers'],
    [/diffusion/i, 'diffusion'],
    [/reinforcement/i, 'reinforcement-learning'],
    [/graph neural/i, 'graph-networks'],
    [/convolution/i, 'convolutions'],
    [/generative/i, 'generative-models'],
    [/pre-train/i, 'pretraining'],
    [/fine-tun/i, 'fine-tuning'],
    [/quantiz/i, 'quantization'],
    [/pruning/i, 'pruning'],
    [/distill/i, 'distillation'],
    [/retrieval/i, 'retrieval'],
    [/embedding/i, 'embeddings'],
    [/alignment|rlhf/i, 'alignment'],
    [/multi-?modal/i, 'multimodal'],
    [/vision/i, 'vision'],
    [/speech|audio/i, 'speech'],
    [/reasoning/i, 'reasoning'],
    [/chain.of.thought/i, 'chain-of-thought'],
    [/mamba|state.space/i, 'state-space-models'],
    [/mixture.of.experts|moe/i, 'mixture-of-experts'],
  ];

  for (const [pattern, subtopic] of subtopicPatterns) {
    if (pattern.test(title)) {
      return `${parentTopic}/${subtopic}`;
    }
  }

  // Fallback: use first meaningful word from title
  const words = paper.title.split(/\s+/).filter(w => w.length > 4 && !/^(the|and|for|with|from|that|this|using|based)$/i.test(w));
  if (words.length > 0) {
    return `${parentTopic}/${words[0].toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  }

  return parentTopic;
}

// ---------------------------------------------------------------------------
// XML parsing (arXiv Atom feed)
// ---------------------------------------------------------------------------

function parseArxivResponse(xml: string): Paper[] {
  const papers: Paper[] = [];
  const entries = xml.split('<entry>').slice(1); // Skip feed header

  for (const entry of entries) {
    const paper = parseEntry(entry);
    if (paper) papers.push(paper);
  }

  return papers;
}

function parseEntry(xml: string): Paper | null {
  const id = extractTag(xml, 'id');
  const title = extractTag(xml, 'title')?.replace(/\s+/g, ' ').trim();
  const abstract = extractTag(xml, 'summary')?.replace(/\s+/g, ' ').trim();
  const published = extractTag(xml, 'published');

  if (!id || !title || !abstract) return null;

  // Extract arXiv ID from URL
  const arxivId = id.replace('http://arxiv.org/abs/', '').replace(/v\d+$/, '');

  // Extract authors
  const authors: string[] = [];
  const authorMatches = xml.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
  for (const match of authorMatches) {
    authors.push(match[1].trim());
  }

  // Extract categories
  const categories: string[] = [];
  const catMatches = xml.matchAll(/category[^>]*term="([^"]+)"/g);
  for (const match of catMatches) {
    categories.push(match[1]);
  }

  return {
    arxivId,
    title,
    authors,
    abstract,
    categories,
    published: published || '',
    url: `https://arxiv.org/abs/${arxivId}`,
  };
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : null;
}
