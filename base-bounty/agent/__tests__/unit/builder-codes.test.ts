import {
  encodeBuilderCodes,
  decodeBuilderCodes,
  buildBuilderCodeSuffix,
  tagTransaction,
  buildAuthorCodes,
  buildAgentCode,
  parseBuilderCodes,
  AuthorAttribution,
} from '../../src/base-chain/builder-codes.js';

// ERC-8021 constants for verification
const ERC_MARKER_HEX = '80218021802180218021802180218021'; // 16 bytes
const SCHEMA_ID_HEX = '00';

describe('ERC-8021 Builder Codes', () => {
  // ---------------------------------------------------------------------------
  // encodeBuilderCodes — core encoding
  // ---------------------------------------------------------------------------

  describe('encodeBuilderCodes', () => {
    it('should encode a single code matching ERC-8021 spec format', () => {
      // Reference: official example "baseapp" => 07626173656170700080218021802180218021802180218021
      const suffix = encodeBuilderCodes(['baseapp']);

      // codesLength(1 byte) + "baseapp"(7 bytes) + schemaId(1 byte) + ercMarker(16 bytes)
      expect(suffix).toBe('07' + '62617365617070' + '00' + ERC_MARKER_HEX);
    });

    it('should match the official ERC-8021 example exactly', () => {
      const suffix = encodeBuilderCodes(['baseapp']);
      expect(suffix).toBe('07626173656170700080218021802180218021802180218021');
    });

    it('should encode multiple codes with comma delimiter', () => {
      const suffix = encodeBuilderCodes(['cogito_node', 'arxiv_1706.03762']);

      // "cogito_node,arxiv_1706.03762" = 28 bytes
      const codesStr = 'cogito_node,arxiv_1706.03762';
      const codesHex = Buffer.from(codesStr, 'ascii').toString('hex');
      const codesLen = Buffer.from(codesStr, 'ascii').length;
      const codesLenHex = codesLen.toString(16).padStart(2, '0');

      expect(suffix).toBe(codesLenHex + codesHex + SCHEMA_ID_HEX + ERC_MARKER_HEX);
    });

    it('should end with schemaId + ercMarker', () => {
      const suffix = encodeBuilderCodes(['test']);

      // Last 34 hex chars should be schemaId(2) + ercMarker(32)
      const tail = suffix.slice(-34);
      expect(tail).toBe(SCHEMA_ID_HEX + ERC_MARKER_HEX);
    });

    it('should produce valid hex', () => {
      const suffix = encodeBuilderCodes(['cogito_node']);
      expect(/^[0-9a-f]+$/i.test(suffix)).toBe(true);
    });

    it('should throw on empty codes array', () => {
      expect(() => encodeBuilderCodes([])).toThrow('At least one builder code is required');
    });

    it('should throw when total codes exceed 255 bytes', () => {
      const longCode = 'a'.repeat(256);
      expect(() => encodeBuilderCodes([longCode])).toThrow('exceeds maximum 255 bytes');
    });
  });

  // ---------------------------------------------------------------------------
  // decodeBuilderCodes — core decoding
  // ---------------------------------------------------------------------------

  describe('decodeBuilderCodes', () => {
    it('should decode a single code', () => {
      const encoded = encodeBuilderCodes(['baseapp']);
      const decoded = decodeBuilderCodes(encoded);
      expect(decoded).toEqual(['baseapp']);
    });

    it('should decode from the official ERC-8021 example', () => {
      const decoded = decodeBuilderCodes('07626173656170700080218021802180218021802180218021');
      expect(decoded).toEqual(['baseapp']);
    });

    it('should decode multiple comma-delimited codes', () => {
      const encoded = encodeBuilderCodes(['cogito_node', 'arxiv_1706.03762']);
      const decoded = decodeBuilderCodes(encoded);
      expect(decoded).toEqual(['cogito_node', 'arxiv_1706.03762']);
    });

    it('should handle 0x prefix', () => {
      const encoded = encodeBuilderCodes(['test_code']);
      const decoded = decodeBuilderCodes('0x' + encoded);
      expect(decoded).toEqual(['test_code']);
    });

    it('should decode codes from calldata with preceding data', () => {
      const calldata = 'abcdef1234' + encodeBuilderCodes(['cogito_node', 'arxiv_2305.12345']);
      const decoded = decodeBuilderCodes(calldata);
      expect(decoded).toEqual(['cogito_node', 'arxiv_2305.12345']);
    });

    it('should decode from full tagged transaction data', () => {
      const tagged = tagTransaction('0xabcdef1234');
      const decoded = decodeBuilderCodes(tagged);
      expect(decoded).toContain('cogito_node');
    });

    it('should return empty array for data without ERC-8021 suffix', () => {
      expect(decodeBuilderCodes('0xabcdef1234')).toEqual([]);
    });

    it('should return empty array for short data', () => {
      expect(decodeBuilderCodes('0x12')).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(decodeBuilderCodes('')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Encode/decode roundtrip
  // ---------------------------------------------------------------------------

  describe('encode/decode roundtrip', () => {
    it('should roundtrip a single code', () => {
      const original = ['cogito_node'];
      const encoded = encodeBuilderCodes(original);
      const decoded = decodeBuilderCodes(encoded);
      expect(decoded).toEqual(original);
    });

    it('should roundtrip multiple codes', () => {
      const original = ['cogito_node', 'arxiv_1706.03762', 'github_huggingface/transformers'];
      const encoded = encodeBuilderCodes(original);
      const decoded = decodeBuilderCodes(encoded);
      expect(decoded).toEqual(original);
    });

    it('should roundtrip codes with special characters in identifiers', () => {
      const original = ['agent_v1', 'doi_10.1038/s41586-021-03819-2'];
      const encoded = encodeBuilderCodes(original);
      const decoded = decodeBuilderCodes(encoded);
      expect(decoded).toEqual(original);
    });

    it('should roundtrip when appended to existing calldata', () => {
      const codes = ['cogito_node', 'arxiv_2305.12345'];
      const calldata = '0xdeadbeef' + encodeBuilderCodes(codes);
      const decoded = decodeBuilderCodes(calldata);
      expect(decoded).toEqual(codes);
    });

    it('should roundtrip via tagTransaction', () => {
      const authors: AuthorAttribution[] = [
        { type: 'arxiv', identifier: '1706.03762' },
      ];
      const tagged = tagTransaction('0x1234', authors);
      const decoded = decodeBuilderCodes(tagged);
      expect(decoded).toEqual(['cogito_node', 'arxiv_1706.03762']);
    });
  });

  // ---------------------------------------------------------------------------
  // buildBuilderCodeSuffix
  // ---------------------------------------------------------------------------

  describe('buildBuilderCodeSuffix', () => {
    it('should encode a single agent code', () => {
      const suffix = buildBuilderCodeSuffix('cogito_node');
      expect(suffix).toBeTruthy();
      expect(typeof suffix).toBe('string');

      // Verify it is valid hex
      expect(/^[0-9a-f]+$/i.test(suffix)).toBe(true);

      // Verify it contains the ercMarker at the end
      expect(suffix.endsWith(ERC_MARKER_HEX)).toBe(true);

      // Decode and verify
      const decoded = decodeBuilderCodes(suffix);
      expect(decoded).toEqual(['cogito_node']);
    });

    it('should encode agent code with author attributions', () => {
      const authors: AuthorAttribution[] = [
        { type: 'arxiv', identifier: '1706.03762' },
        { type: 'github', identifier: 'huggingface/transformers' },
      ];

      const suffix = buildBuilderCodeSuffix('cogito_node', authors);

      // Decode and verify all codes are present
      const decoded = decodeBuilderCodes(suffix);
      expect(decoded).toEqual([
        'cogito_node',
        'arxiv_1706.03762',
        'github_huggingface/transformers',
      ]);
    });

    it('should handle empty authors array', () => {
      const suffix = buildBuilderCodeSuffix('test_agent', []);
      const singleSuffix = buildBuilderCodeSuffix('test_agent');
      expect(suffix).toBe(singleSuffix);
    });

    it('should handle special characters in identifiers', () => {
      const authors: AuthorAttribution[] = [
        { type: 'doi', identifier: '10.1038/s41586-021-03819-2' },
      ];

      const suffix = buildBuilderCodeSuffix('agent', authors);
      expect(suffix.length).toBeGreaterThan(0);
      expect(/^[0-9a-f]+$/i.test(suffix)).toBe(true);

      // Verify roundtrip
      const decoded = decodeBuilderCodes(suffix);
      expect(decoded).toEqual(['agent', 'doi_10.1038/s41586-021-03819-2']);
    });
  });

  // ---------------------------------------------------------------------------
  // tagTransaction
  // ---------------------------------------------------------------------------

  describe('tagTransaction', () => {
    it('should append ERC-8021 suffix to tx data with 0x prefix', () => {
      const txData = '0xabcdef';
      const tagged = tagTransaction(txData);

      expect(tagged.startsWith('0xabcdef')).toBe(true);
      expect(tagged.length).toBeGreaterThan(txData.length);
      // Must end with ercMarker
      expect(tagged.endsWith(ERC_MARKER_HEX)).toBe(true);
    });

    it('should add 0x prefix if missing', () => {
      const txData = 'abcdef';
      const tagged = tagTransaction(txData);

      expect(tagged.startsWith('0xabcdef')).toBe(true);
    });

    it('should include author attributions when provided', () => {
      const txData = '0x1234';
      const authors: AuthorAttribution[] = [
        { type: 'arxiv', identifier: '2305.12345' },
      ];

      const tagged = tagTransaction(txData, authors);

      expect(tagged.startsWith('0x1234')).toBe(true);
      // Decode and verify
      const decoded = decodeBuilderCodes(tagged);
      expect(decoded).toContain('arxiv_2305.12345');
    });

    it('should always include cogito_node agent code', () => {
      const tagged = tagTransaction('0x00');
      const decoded = decodeBuilderCodes(tagged);
      expect(decoded).toContain('cogito_node');
    });

    it('should handle empty 0x data (for simple ETH transfers)', () => {
      const tagged = tagTransaction('0x');
      expect(tagged.startsWith('0x')).toBe(true);
      expect(tagged.endsWith(ERC_MARKER_HEX)).toBe(true);
      const decoded = decodeBuilderCodes(tagged);
      expect(decoded).toContain('cogito_node');
    });
  });

  // ---------------------------------------------------------------------------
  // buildAuthorCodes
  // ---------------------------------------------------------------------------

  describe('buildAuthorCodes', () => {
    it('should extract arxiv ID', () => {
      const codes = buildAuthorCodes({ arxivId: '1706.03762' });

      expect(codes).toContainEqual({ type: 'arxiv', identifier: '1706.03762' });
    });

    it('should extract DOI', () => {
      const codes = buildAuthorCodes({ doi: '10.1038/s41586-021-03819-2' });

      expect(codes).toContainEqual({ type: 'doi', identifier: '10.1038/s41586-021-03819-2' });
    });

    it('should extract GitHub repo', () => {
      const codes = buildAuthorCodes({ githubRepo: 'huggingface/transformers' });

      expect(codes).toContainEqual({ type: 'github', identifier: 'huggingface/transformers' });
    });

    it('should extract author last names (max 3)', () => {
      const codes = buildAuthorCodes({
        authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
      });

      const customCodes = codes.filter(c => c.type === 'custom');
      expect(customCodes).toHaveLength(3); // max 3 authors
      expect(customCodes[0].identifier).toBe('vaswani');
      expect(customCodes[1].identifier).toBe('shazeer');
      expect(customCodes[2].identifier).toBe('parmar');
    });

    it('should handle single-name authors', () => {
      const codes = buildAuthorCodes({ authors: ['Plato'] });

      expect(codes).toContainEqual({ type: 'custom', identifier: 'plato' });
    });

    it('should combine all attribution types', () => {
      const codes = buildAuthorCodes({
        arxivId: '1706.03762',
        doi: '10.1234/test',
        githubRepo: 'org/repo',
        authors: ['John Doe'],
      });

      expect(codes).toHaveLength(4);
      expect(codes.map(c => c.type)).toEqual(['arxiv', 'doi', 'github', 'custom']);
    });

    it('should return empty array for empty paper', () => {
      const codes = buildAuthorCodes({});
      expect(codes).toEqual([]);
    });

    it('should return empty array for undefined fields', () => {
      const codes = buildAuthorCodes({
        arxivId: undefined,
        doi: undefined,
        githubRepo: undefined,
        authors: undefined,
      });
      expect(codes).toEqual([]);
    });

    it('should work with the Paper interface shape', () => {
      // Simulate a Paper from paper-source.ts
      const paper = {
        arxivId: '1706.03762',
        title: 'Attention Is All You Need',
        authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
        abstract: 'The dominant sequence transduction models...',
        categories: ['cs.CL', 'cs.LG'],
        published: '2017-06-12',
        url: 'https://arxiv.org/abs/1706.03762',
      };

      const codes = buildAuthorCodes(paper);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes[0]).toEqual({ type: 'arxiv', identifier: '1706.03762' });

      // Build the full suffix with these codes
      const suffix = buildBuilderCodeSuffix('cogito_node', codes);
      const decoded = decodeBuilderCodes(suffix);
      expect(decoded[0]).toBe('cogito_node');
      expect(decoded[1]).toBe('arxiv_1706.03762');
    });
  });

  // ---------------------------------------------------------------------------
  // buildAgentCode
  // ---------------------------------------------------------------------------

  describe('buildAgentCode', () => {
    it('should return the agent builder code', () => {
      expect(buildAgentCode()).toBe('cogito_node');
    });
  });

  // ---------------------------------------------------------------------------
  // parseBuilderCodes (backward compatibility alias)
  // ---------------------------------------------------------------------------

  describe('parseBuilderCodes', () => {
    it('should decode valid ERC-8021 tagged data', () => {
      const tagged = tagTransaction('0xabcdef');
      const codes = parseBuilderCodes(tagged);
      expect(codes).toContain('cogito_node');
    });

    it('should return empty array for non-tagged data', () => {
      const codes = parseBuilderCodes('0xabcdef1234');
      expect(Array.isArray(codes)).toBe(true);
      expect(codes).toEqual([]);
    });

    it('should handle data with 0x prefix', () => {
      const codes = parseBuilderCodes('0x1234');
      expect(Array.isArray(codes)).toBe(true);
    });

    it('should handle data without 0x prefix', () => {
      const codes = parseBuilderCodes('1234');
      expect(Array.isArray(codes)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // ERC-8021 byte layout verification
  // ---------------------------------------------------------------------------

  describe('ERC-8021 byte layout verification', () => {
    it('should have correct byte layout: codesLength + codes + schemaId + ercMarker', () => {
      const suffix = encodeBuilderCodes(['cogito_node']);

      // Parse manually
      const codesLenHex = suffix.slice(0, 2);
      const codesLen = parseInt(codesLenHex, 16);
      expect(codesLen).toBe(11); // "cogito_node" = 11 bytes

      const codesHex = suffix.slice(2, 2 + codesLen * 2);
      const codesAscii = Buffer.from(codesHex, 'hex').toString('ascii');
      expect(codesAscii).toBe('cogito_node');

      const schemaId = suffix.slice(2 + codesLen * 2, 2 + codesLen * 2 + 2);
      expect(schemaId).toBe('00');

      const marker = suffix.slice(2 + codesLen * 2 + 2);
      expect(marker).toBe(ERC_MARKER_HEX);
    });

    it('should use comma (0x2c) as code delimiter', () => {
      const suffix = encodeBuilderCodes(['code_a', 'code_b']);

      // Extract the codes hex portion
      const codesLen = parseInt(suffix.slice(0, 2), 16);
      const codesHex = suffix.slice(2, 2 + codesLen * 2);

      // The comma character 0x2C should appear in the codes
      expect(codesHex).toContain('2c');

      // Verify the full codes string
      const codesAscii = Buffer.from(codesHex, 'hex').toString('ascii');
      expect(codesAscii).toBe('code_a,code_b');
    });

    it('should have exactly 16-byte ercMarker', () => {
      expect(ERC_MARKER_HEX.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should produce total suffix size = 1 + codesLength + 1 + 16 bytes', () => {
      const codes = ['test'];
      const suffix = encodeBuilderCodes(codes);
      const codesStr = 'test';
      const expectedByteLen = 1 + codesStr.length + 1 + 16; // 22 bytes = 44 hex chars
      expect(suffix.length).toBe(expectedByteLen * 2);
    });
  });
});
