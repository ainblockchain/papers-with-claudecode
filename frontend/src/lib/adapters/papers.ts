// Papers 어댑터 — GitHub 레포(awesome-papers-with-claude-code)에서 직접 논문/코스 데이터를 가져옴
// FE에서 바로 GitHub로 호출 (public repo이므로 인증 불필요, raw.githubusercontent.com은 rate limit 비해당)
import { Paper } from '@/types/paper';
import { MOCK_PAPERS } from '@/constants/mock-papers';

const REPO_OWNER = 'ainblockchain';
const REPO_NAME = 'awesome-papers-with-claude-code';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

export interface PapersAdapter {
  fetchTrendingPapers(period: 'daily' | 'weekly' | 'monthly'): Promise<Paper[]>;
  searchPapers(query: string): Promise<Paper[]>;
  getPaperById(id: string): Promise<Paper | null>;
  /** Synchronous lookup (cached data only — returns null if not cached) */
  getPaperByIdSync?(id: string): Paper | null;
}

// ── 파싱 유틸 ──────────────────────────────────

/** README.md에서 논문 메타데이터를 파싱 */
function parseReadme(content: string) {
  const titleMatch = content.match(/^#\s+(.+?)\s+Learning Path/m);
  const title = titleMatch?.[1]?.trim() || '';

  const metaMatch = content.match(
    /based on\s*\n?\s*"(.+?)"\s+by\s+(.+?),\s+(\d{4})/
  );
  const authors = metaMatch?.[2] || '';
  const year = metaMatch?.[3] || '';

  const statsMatch = content.match(
    /\*{0,2}(\d+)\*{0,2}\s*concepts?\s+across\s+\*{0,2}(\d+)\*{0,2}\s*courses?/
  );
  const totalConcepts = statsMatch ? parseInt(statsMatch[1]) : 0;
  const totalModules = statsMatch ? parseInt(statsMatch[2]) : 0;

  const arxivMatch = content.match(/arXiv[:\s]+(\d+\.\d+)/);
  const arxivId = arxivMatch?.[1] || '';

  return { title, authors, year, totalConcepts, totalModules, arxivId };
}

/** courses.json에서 코스 통계 추출 */
function parseCourseStats(
  data: { concepts?: string[]; lessons?: unknown[] }[]
): { totalConcepts: number; totalLessons: number } {
  let totalConcepts = 0;
  let totalLessons = 0;
  for (const course of data) {
    totalConcepts += course.concepts?.length || 0;
    totalLessons += course.lessons?.length || 0;
  }
  return { totalConcepts, totalLessons };
}

/** slug → 사람이 읽기 좋은 이름 ("image-recognition" → "Image Recognition") */
function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** raw.githubusercontent.com에서 파일 내용 가져오기 (rate limit 비해당) */
async function fetchRawFile(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${RAW_BASE}/${path}`);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

// ── GitHub 데이터 fetching ─────────────────────

async function fetchPapersFromGitHub(): Promise<Paper[]> {
  // 1) Git Trees API로 전체 디렉토리 구조를 한 번에 가져옴 (1 API call)
  const treeRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`,
    { headers: { Accept: 'application/vnd.github.v3+json' } }
  );

  if (!treeRes.ok) {
    throw new Error(`GitHub tree API failed: ${treeRes.status}`);
  }

  const tree = await treeRes.json();

  // 2) 트리에서 <paper-slug>/<course-slug>/README.md 패턴으로 코스 식별
  const courses: { paperSlug: string; courseSlug: string }[] = [];

  for (const item of tree.tree) {
    const match = item.path.match(/^([^/]+)\/([^/]+)\/README\.md$/);
    if (match) {
      courses.push({ paperSlug: match[1], courseSlug: match[2] });
    }
  }

  // 3) 각 코스의 README + courses.json을 병렬 fetch → 코스별 Paper 카드 생성
  const papers = await Promise.all(
    courses.map(async ({ paperSlug, courseSlug }) => {
      const [readme, coursesRaw] = await Promise.all([
        fetchRawFile(`${paperSlug}/${courseSlug}/README.md`),
        fetchRawFile(`${paperSlug}/${courseSlug}/knowledge/courses.json`),
      ]);

      const meta = parseReadme(readme || '');

      let stats = { totalConcepts: 0, totalLessons: 0 };
      if (coursesRaw) {
        try {
          stats = parseCourseStats(JSON.parse(coursesRaw));
        } catch { /* malformed JSON */ }
      }

      const paper: Paper = {
        id: `${paperSlug}/${courseSlug}`,
        title: meta.title || slugToName(paperSlug),
        description: `${stats.totalConcepts} concepts · ${stats.totalLessons} lessons across ${meta.totalModules || 1} module${meta.totalModules > 1 ? 's' : ''}`,
        authors: meta.authors
          ? meta.authors.split(/,\s*(?:and\s+)?/).map((name, i) => ({
              id: `${paperSlug}-${courseSlug}-${i}`,
              name: name.replace(/\s+et\s+al\.?/, ' et al.').trim(),
            }))
          : [],
        publishedAt: meta.year ? `${meta.year}-01-01` : '',
        thumbnailUrl: '',
        arxivUrl: meta.arxivId ? `https://arxiv.org/abs/${meta.arxivId}` : '',
        githubUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/main/${paperSlug}/${courseSlug}`,
        submittedBy: 'community',
        totalStages: meta.totalModules || 1,
        courseName: slugToName(courseSlug),
      };

      return paper;
    })
  );

  // 개념 수 내림차순 정렬
  papers.sort((a, b) => {
    const aCount = parseInt(a.description) || 0;
    const bCount = parseInt(b.description) || 0;
    return bCount - aCount;
  });

  return papers;
}

// ── Adapter 구현 ───────────────────────────────

class GitHubPapersAdapter implements PapersAdapter {
  private cachedPapers: Paper[] = [];
  private cacheTimestamp = 0;

  private async getPapers(): Promise<Paper[]> {
    if (this.cachedPapers.length > 0 && Date.now() - this.cacheTimestamp < CACHE_TTL_MS) {
      return this.cachedPapers;
    }

    const papers = await fetchPapersFromGitHub();
    this.cachedPapers = papers;
    this.cacheTimestamp = Date.now();
    return papers;
  }

  async fetchTrendingPapers(): Promise<Paper[]> {
    try {
      return await this.getPapers();
    } catch (error) {
      console.warn('GitHub papers fetch failed, falling back to mock:', error);
      return MOCK_PAPERS;
    }
  }

  async searchPapers(query: string): Promise<Paper[]> {
    try {
      const papers = await this.getPapers();
      const q = query.toLowerCase();
      return papers.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.authors.some((a) => a.name.toLowerCase().includes(q))
      );
    } catch {
      return MOCK_PAPERS.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  async getPaperById(id: string): Promise<Paper | null> {
    try {
      const papers = await this.getPapers();
      return papers.find((p) => p.id === id) ?? null;
    } catch {
      return this.cachedPapers.find((p) => p.id === id)
        ?? MOCK_PAPERS.find((p) => p.id === id)
        ?? null;
    }
  }

  getPaperByIdSync(id: string): Paper | null {
    return this.cachedPapers.find((p) => p.id === id)
      ?? MOCK_PAPERS.find((p) => p.id === id)
      ?? null;
  }
}

export const papersAdapter: PapersAdapter = new GitHubPapersAdapter();
