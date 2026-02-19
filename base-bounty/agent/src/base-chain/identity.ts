import { ethers } from 'ethers';

const ERC_8004_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

// Minimal ABI for ERC-8004 Agent Identity Registry (UUPS-upgradeable ERC-721)
const ERC_8004_ABI = [
  // Registration
  'function register() external returns (uint256)',
  'function register(string agentURI) external returns (uint256)',
  // ERC-721 view functions
  'function balanceOf(address owner) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

export interface RegistrationResult {
  txHash: string;
  agentId: bigint;
}

export class AgentIdentity {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private registry: ethers.Contract;

  constructor(rpcUrl: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.registry = new ethers.Contract(ERC_8004_REGISTRY, ERC_8004_ABI, this.signer);
  }

  /**
   * Register this agent on the ERC-8004 registry with an agent URI.
   * The agentURI should point to JSON metadata describing the agent.
   * Returns the transaction hash and the minted agent (token) ID.
   */
  async register(agentURI: string): Promise<RegistrationResult> {
    const tx = await this.registry['register(string)'](agentURI);
    const receipt = await tx.wait();

    // Extract agentId from the Transfer event (ERC-721 mint: from=0x0)
    let agentId = 0n;
    for (const log of receipt.logs) {
      try {
        const parsed = this.registry.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed && parsed.name === 'Transfer' && parsed.args.from === ethers.ZeroAddress) {
          agentId = parsed.args.tokenId;
          break;
        }
      } catch {
        // Not a matching event, skip
      }
    }

    console.log(`[Identity] Registered on ERC-8004 — agentId: ${agentId}, tx: ${receipt.hash}`);
    return { txHash: receipt.hash, agentId };
  }

  /**
   * Check if this wallet already owns an agent identity NFT.
   */
  async isRegistered(address?: string): Promise<boolean> {
    const addr = address || await this.signer.getAddress();
    const balance: bigint = await this.registry.balanceOf(addr);
    return balance > 0n;
  }

  /**
   * Get the on-chain tokenURI for a given agent ID.
   * Returns parsed JSON metadata embedded in the data URI.
   */
  async getTokenMetadata(agentId: number | bigint): Promise<Record<string, unknown>> {
    const uri: string = await this.registry.tokenURI(agentId);
    // tokenURI is a data:application/json;base64,... URI
    const prefix = 'data:application/json;base64,';
    if (uri.startsWith(prefix)) {
      const json = Buffer.from(uri.slice(prefix.length), 'base64').toString();
      return JSON.parse(json) as Record<string, unknown>;
    }
    return { raw: uri };
  }

  getAddress(): string {
    return this.signer.address;
  }
}
