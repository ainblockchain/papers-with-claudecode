import { AgentIdentity } from './base-chain/identity.js';

export class PeerClient {
  private identity: AgentIdentity;
  private fetchFn: typeof fetch;

  constructor(identity: AgentIdentity) {
    this.identity = identity;
    this.fetchFn = globalThis.fetch;
  }

  /**
   * Set a custom fetch function (e.g. @x402/fetch for auto-payment).
   */
  setFetch(fetchFn: typeof fetch): void {
    this.fetchFn = fetchFn;
  }

  /**
   * Buy an exploration from a peer via x402.
   */
  async buyExploration(peerUrl: string, topicPath: string): Promise<any> {
    const url = `${peerUrl}/knowledge/explore/${topicPath}`;
    const response = await this.fetchFn(url);

    if (response.status === 402) {
      console.log(`[Peer] Payment required for ${url} — using x402 auto-pay`);
      // When using @x402/fetch, the 402 is handled automatically
      // For manual flow, the caller would need to handle payment
    }

    if (!response.ok) {
      throw new Error(`[Peer] Failed to buy exploration: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Buy frontier map from a peer via x402.
   */
  async buyFrontierMap(peerUrl: string, topic: string): Promise<any> {
    const url = `${peerUrl}/knowledge/frontier/${topic}`;
    const response = await this.fetchFn(url);

    if (!response.ok) {
      throw new Error(`[Peer] Failed to buy frontier map: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Discover peer endpoints from the ERC-8004 registry.
   * Note: The ERC-8004 registry is an ERC-721 contract. Peer discovery
   * currently requires off-chain indexing or Transfer event scanning,
   * which is not yet implemented. Returns an empty array for now.
   */
  async discoverPeers(): Promise<Array<{ address: string; name: string; endpoint: string }>> {
    // TODO: Implement peer discovery via Transfer event scanning or subgraph
    // The ERC-8004 registry does not have an enumeration function.
    // Options: (1) scan Transfer(0x0, to, tokenId) events, (2) use a subgraph
    console.log('[Peer] Peer discovery via ERC-8004 event scanning not yet implemented');
    return [];
  }

  /**
   * Get status from a peer (unauthenticated endpoint).
   */
  async getPeerStatus(peerUrl: string): Promise<any> {
    const response = await globalThis.fetch(`${peerUrl}/status`);
    if (!response.ok) {
      throw new Error(`[Peer] Failed to get status: ${response.status}`);
    }
    return response.json();
  }
}
