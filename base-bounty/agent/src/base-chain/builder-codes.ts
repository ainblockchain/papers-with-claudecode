/**
 * ERC-8021 builder code attribution.
 *
 * Builder codes serve dual purpose:
 * 1. Identifying the Cogito agent
 * 2. Attributing original paper authors / GitHub contributors whose work
 *    the knowledge derives from
 *
 * ERC-8021 suffix format (appended to transaction calldata):
 *   [codesLength (1 byte)] [codes (variable, comma-delimited ASCII)] [schemaId (1 byte)] [ercMarker (16 bytes)]
 *
 * - codesLength: total byte length of the comma-delimited codes string
 * - codes: ASCII builder codes joined by 0x2C (comma), e.g. "cogito_node,arxiv_1706.03762"
 * - schemaId: 0x00 for Schema 0 (canonical)
 * - ercMarker: fixed 16 bytes 0x80218021802180218021802180218021
 */

// ERC-8021 constants
const ERC_MARKER = '80218021802180218021802180218021'; // 16 bytes, hex-encoded (32 hex chars)
const SCHEMA_ID = '00'; // Schema 0

// Builder code prefix — the Cogito agent's own identifier
const COGITO_BUILDER_CODE = 'cogito_node';

export interface AuthorAttribution {
  type: 'arxiv' | 'github' | 'doi' | 'custom';
  identifier: string;
}

/**
 * Encode builder codes into an ERC-8021 hex suffix.
 *
 * The suffix is: codesLength (1 byte) + codes (comma-delimited ASCII) + schemaId (1 byte) + ercMarker (16 bytes)
 *
 * @param codes - Array of builder code strings (e.g. ["cogito_node", "arxiv_1706.03762"])
 * @returns Hex string (without 0x prefix) of the encoded ERC-8021 suffix
 */
export function encodeBuilderCodes(codes: string[]): string {
  if (codes.length === 0) {
    throw new Error('At least one builder code is required');
  }

  // Join codes with comma delimiter
  const codesString = codes.join(',');
  const codesBytes = Buffer.from(codesString, 'ascii');

  if (codesBytes.length > 255) {
    throw new Error(`Builder codes total length ${codesBytes.length} exceeds maximum 255 bytes`);
  }

  // codesLength (1 byte) + codes (variable) + schemaId (1 byte) + ercMarker (16 bytes)
  const codesLengthHex = codesBytes.length.toString(16).padStart(2, '0');
  const codesHex = codesBytes.toString('hex');

  return codesLengthHex + codesHex + SCHEMA_ID + ERC_MARKER;
}

/**
 * Decode ERC-8021 builder codes from transaction calldata.
 *
 * Parses the suffix by working backwards from the end of calldata:
 * 1. Verify the last 16 bytes are the ercMarker
 * 2. Read the schemaId byte before the marker
 * 3. For Schema 0: read codesLength, then parse comma-delimited ASCII codes
 *
 * @param calldata - Hex string of transaction calldata (with or without 0x prefix)
 * @returns Array of decoded builder code strings, or empty array if no valid suffix found
 */
export function decodeBuilderCodes(calldata: string): string[] {
  const hex = calldata.startsWith('0x') ? calldata.slice(2) : calldata;

  // Minimum suffix size: 1 (codesLength) + 1 (min code) + 1 (schemaId) + 16 (ercMarker) = 19 bytes = 38 hex chars
  if (hex.length < 38) return [];

  // Step 1: Check for ercMarker at the end (last 32 hex chars = 16 bytes)
  const markerStart = hex.length - 32;
  const marker = hex.slice(markerStart);
  if (marker !== ERC_MARKER) return [];

  // Step 2: Read schemaId (1 byte = 2 hex chars before marker)
  const schemaIdStart = markerStart - 2;
  const schemaId = hex.slice(schemaIdStart, markerStart);
  if (schemaId !== SCHEMA_ID) return []; // Only Schema 0 supported

  // Step 3: Read codesLength (1 byte = 2 hex chars before schemaId)
  // But first we need to figure out where codes end and codesLength starts.
  // The codesLength is the byte BEFORE the codes data.
  // Layout: ... [codesLength][codes][schemaId][ercMarker]
  // We know schemaId position, so codes end at schemaIdStart.
  // We need codesLength to know where codes start.
  // codesLength is 1 byte immediately before the codes data.
  // But we read it from the data. We need to try: the byte at position (schemaIdStart - codesLen*2 - 2)
  // should equal codesLen.

  // Actually, the layout from the suffix start is:
  // [codesLength (1 byte)] [codes (codesLength bytes)] [schemaId (1 byte)] [ercMarker (16 bytes)]
  // Total suffix = 1 + codesLength + 1 + 16 = codesLength + 18 bytes

  // Working from the end:
  // ercMarker is at [end-16 .. end]
  // schemaId is at [end-17]
  // codes are at [end-17-codesLength .. end-17]
  // codesLength byte is at [end-18-codesLength]

  // We know the position of schemaId. The codes field is directly before schemaId.
  // But we need to read codesLength first. The codesLength byte is before the codes field.
  // So we scan: try reading the byte at various positions before schemaId to find a valid codesLength.

  // Iterate from the largest possible codesLength downward (greedy).
  // The real codesLength byte is furthest from the ercMarker, so scanning
  // from large to small avoids false positives from bytes inside the codes
  // data that happen to match a shorter length value.
  const maxCodesLen = Math.min(255, Math.floor((schemaIdStart - 2) / 2));
  // Also cannot start before the beginning of the hex string
  // codesLenPos = schemaIdStart - codesLen*2 - 2 >= 0
  // => codesLen <= (schemaIdStart - 2) / 2  (already handled by maxCodesLen)

  for (let codesLen = maxCodesLen; codesLen >= 1; codesLen--) {
    const codesLenPos = schemaIdStart - codesLen * 2 - 2;
    if (codesLenPos < 0) continue;

    const candidateLenHex = hex.slice(codesLenPos, codesLenPos + 2);
    const candidateLen = parseInt(candidateLenHex, 16);

    if (candidateLen === codesLen) {
      // Found a consistent codesLength. Extract and validate the codes.
      const codesHex = hex.slice(codesLenPos + 2, schemaIdStart);
      try {
        const codesAscii = Buffer.from(codesHex, 'hex').toString('ascii');
        // Validate: all characters should be printable ASCII (0x20-0x7E)
        if (/^[\x20-\x7e]+$/.test(codesAscii)) {
          return codesAscii.split(',').filter(c => c.length > 0);
        }
      } catch {
        // Invalid hex, try next candidate
        continue;
      }
    }
  }

  return [];
}

/**
 * Build ERC-8021 builder code suffix from the agent code and optional author attributions.
 *
 * @param agentCode - The agent's builder code (e.g. "cogito_node")
 * @param authors - Optional author attributions to include
 * @returns Hex string suffix (without 0x prefix) to append to transaction data
 */
export function buildBuilderCodeSuffix(agentCode: string, authors?: AuthorAttribution[]): string {
  const codes = [agentCode];

  if (authors) {
    for (const author of authors) {
      codes.push(`${author.type}_${author.identifier}`);
    }
  }

  return encodeBuilderCodes(codes);
}

/**
 * Tag a transaction with ERC-8021 builder codes.
 * Appends builder code suffix to transaction data.
 */
export function tagTransaction(
  txData: string,
  authors?: AuthorAttribution[]
): string {
  const suffix = buildBuilderCodeSuffix(COGITO_BUILDER_CODE, authors);
  // Ensure txData has 0x prefix
  const data = txData.startsWith('0x') ? txData : `0x${txData}`;
  return `${data}${suffix}`;
}

/**
 * Build author attributions from paper metadata.
 * Extracts identifiable attributions from paper information.
 */
export function buildAuthorCodes(paper: {
  arxivId?: string;
  doi?: string;
  authors?: string[];
  githubRepo?: string;
}): AuthorAttribution[] {
  const attributions: AuthorAttribution[] = [];

  if (paper.arxivId) {
    attributions.push({ type: 'arxiv', identifier: paper.arxivId });
  }

  if (paper.doi) {
    attributions.push({ type: 'doi', identifier: paper.doi });
  }

  if (paper.githubRepo) {
    attributions.push({ type: 'github', identifier: paper.githubRepo });
  }

  if (paper.authors) {
    // Use first author's last name for compact attribution (max 3 authors)
    for (const author of paper.authors.slice(0, 3)) {
      const lastName = author.split(' ').pop()?.toLowerCase() || author.toLowerCase();
      attributions.push({ type: 'custom', identifier: lastName });
    }
  }

  return attributions;
}

/**
 * Return the agent's own builder code.
 */
export function buildAgentCode(): string {
  return COGITO_BUILDER_CODE;
}

/**
 * Parse builder codes from a transaction's data suffix.
 * Alias for decodeBuilderCodes for backward compatibility.
 */
export function parseBuilderCodes(txData: string): string[] {
  return decodeBuilderCodes(txData);
}
