import { SubstrateBlock } from "@subsquid/substrate-processor";

class MarketHistoryModule {
  static async init(blockHeight: number): Promise<void> { }

  static async save(block: SubstrateBlock): Promise<void> { }
}

export default MarketHistoryModule;
