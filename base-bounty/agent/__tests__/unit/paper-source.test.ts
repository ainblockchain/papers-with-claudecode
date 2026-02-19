/**
 * Tests for paper-source.ts — arXiv paper fetching and context building.
 * Import directly from source to bypass the jest moduleNameMapper mock.
 */

import { buildPaperContext, suggestSubtopic, Paper } from '../../src/paper-source';

const samplePaper: Paper = {
  arxivId: '1706.03762',
  title: 'Attention Is All You Need',
  authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
  abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
  categories: ['cs.CL', 'cs.LG'],
  published: '2017-06-12',
  url: 'https://arxiv.org/abs/1706.03762',
};

const samplePaper2: Paper = {
  arxivId: '2010.11929',
  title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
  authors: ['Alexey Dosovitskiy', 'Lucas Beyer'],
  abstract: 'While the Transformer architecture has become the de facto standard for natural language processing tasks...',
  categories: ['cs.CV', 'cs.LG'],
  published: '2020-10-22',
  url: 'https://arxiv.org/abs/2010.11929',
};

const mambaPaper: Paper = {
  arxivId: '2312.00752',
  title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
  authors: ['Albert Gu', 'Tri Dao'],
  abstract: 'Foundation models, now powering most of the exciting applications in deep learning...',
  categories: ['cs.LG'],
  published: '2023-12-01',
  url: 'https://arxiv.org/abs/2312.00752',
};

describe('paper-source', () => {
  describe('buildPaperContext', () => {
    it('should return empty string for no papers', () => {
      expect(buildPaperContext([], 'ai/transformers')).toBe('');
    });

    it('should build context with paper details', () => {
      const context = buildPaperContext([samplePaper], 'ai/transformers');
      expect(context).toContain('ai/transformers');
      expect(context).toContain('Attention Is All You Need');
      expect(context).toContain('Vaswani');
      expect(context).toContain('1706.03762');
      expect(context).toContain('2017');
    });

    it('should include multiple papers', () => {
      const context = buildPaperContext([samplePaper, samplePaper2], 'ai/transformers');
      expect(context).toContain('Paper 1');
      expect(context).toContain('Paper 2');
      expect(context).toContain('Attention Is All You Need');
      expect(context).toContain('Image is Worth');
    });

    it('should truncate author list with et al.', () => {
      const context = buildPaperContext([samplePaper], 'ai/transformers');
      expect(context).toContain('et al.');
    });

    it('should not add et al. for papers with 3 or fewer authors', () => {
      const context = buildPaperContext([mambaPaper], 'ai/state-space-models');
      expect(context).not.toContain('et al.');
      expect(context).toContain('Albert Gu');
      expect(context).toContain('Tri Dao');
    });
  });

  describe('suggestSubtopic', () => {
    it('should detect attention in title', () => {
      const result = suggestSubtopic(samplePaper, 'ai/transformers');
      expect(result).toBe('ai/transformers/attention');
    });

    it('should detect state-space-models from Mamba paper', () => {
      const result = suggestSubtopic(mambaPaper, 'ai');
      expect(result).toBe('ai/state-space-models');
    });

    it('should detect transformer in title', () => {
      const result = suggestSubtopic(samplePaper2, 'ai/multimodal');
      expect(result).toBe('ai/multimodal/transformers');
    });

    it('should return parent topic when no pattern matches and no long words', () => {
      const paper = { ...samplePaper, title: 'The One' };
      const result = suggestSubtopic(paper, 'ai/research');
      expect(result).toBe('ai/research');
    });
  });
});
