// 🔌 ADAPTER — Fetches courses from BFF API routes backed by GitHub
import { Paper } from '@/types/paper';

export interface PapersAdapter {
  fetchTrendingPapers(period: 'daily' | 'weekly' | 'monthly'): Promise<Paper[]>;
  searchPapers(query: string): Promise<Paper[]>;
  getPaperById(id: string): Promise<Paper | null>;
}

class ApiPapersAdapter implements PapersAdapter {
  private cache: Paper[] | null = null;

  async fetchTrendingPapers(): Promise<Paper[]> {
    if (this.cache) return this.cache;
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      const papers: Paper[] = await res.json();
      this.cache = papers;
      return papers;
    } catch (error) {
      console.warn('[PapersAdapter] Failed to fetch from API, returning empty list:', error);
      return [];
    }
  }

  async searchPapers(query: string): Promise<Paper[]> {
    const papers = await this.fetchTrendingPapers();
    const q = query.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.authors.some((a) => a.name.toLowerCase().includes(q)),
    );
  }

  async getPaperById(id: string): Promise<Paper | null> {
    const papers = await this.fetchTrendingPapers();
    return papers.find((p) => p.id === id) ?? null;
  }
}

export const papersAdapter: PapersAdapter = new ApiPapersAdapter();
