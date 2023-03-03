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
  static async init(blockHeight: number): Promise<void> {
    ctx.log.info(`Initializing market history for block ${blockHeight}`);

    for (const module of modules) {
      await module.init(blockHeight);
    }
  }

  static async save(block: SubstrateBlock): Promise<void> {
    for (const module of modules) {
      await module.save(block);
    }
  }
}

export default MarketHistory;
