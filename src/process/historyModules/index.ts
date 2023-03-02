import { SubstrateBlock } from '@subsquid/substrate-processor';
import { ctx } from '../../processor';
import Candlestick from './Candlestick';
import MarketHistoryModule from './MarketHistoryModule';
import Reserves from './Reserves';
import TokenPrices from './TokenPrices';
import Volume from './Volume';

const modules = [
  Volume,
  Reserves,
  TokenPrices,
  Candlestick,
];

class MarketHistory extends MarketHistoryModule {
  static async init(blockId: string): Promise<void> {
    ctx.log.info(`Initializing market history for block ${blockId}`);

    for (const module of modules) {
      await module.init(blockId);
    }
  }

  static async save(block: SubstrateBlock): Promise<void> {
    for (const module of modules) {
      await module.save(block);
    }
  }
}

export default MarketHistory;
