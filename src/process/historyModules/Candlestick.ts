import { ctx } from '../../processor';
import MarketHistoryModule from './MarketHistoryModule';
import { Candlestick as CandlestickModel } from '../../model';
import { Pool } from '../../model';
import { bigdecimalTransformer } from '../../model/generated/marshal';
import { SubstrateBlock } from '@subsquid/substrate-processor';
import BigNumber from 'bignumber.js';

type CandlestickPoolBlock = [
  BigNumber, // open
  BigNumber, // high
  BigNumber, // low
  BigNumber, // close
]

// Pool id and token address are formated like -> `poolId:tokenAddres`
type CandlestickBlock = {
  [poolIdAndTokenAddress: string]: CandlestickPoolBlock;
};

class Candlestick implements MarketHistoryModule {
  private static candlesticks: CandlestickBlock = {};

  static async init(blockId: string): Promise<void> {
    const initialData: CandlestickModel[] = await ctx.store.find(CandlestickModel, {
      where: { blockId }
    });

    this.candlesticks = initialData.reduce(
      (acc: any, d: CandlestickModel) => {
        const close = new BigNumber(d.close);
        acc[`${d.pool.id}:${d.token}`] = [close, close, close, close];
        return acc;
      },
      {} as CandlestickBlock,
    );
  }

  static updateCandlestick(poolId: string, tokenAddress: string, price: BigNumber): void {
    const key = `${poolId}:${tokenAddress}`;
    if (!this.candlesticks[key]) {
      this.candlesticks[key] = [
        new BigNumber(price),
        new BigNumber(price),
        new BigNumber(price),
        new BigNumber(price),
      ];
    } else {
      const [open, high, low] = this.candlesticks[key];
      this.candlesticks[key] = [
        new BigNumber(open),
        new BigNumber(high.gt(price) ? high : price),
        new BigNumber(low.lt(price) ? low : price),
        new BigNumber(price),
      ];
    }
    ctx.log.info(
      `Candlestick updated for pool: ${poolId} and token: ${tokenAddress} with \n\tOpen = ${this.candlesticks[
        key
      ][0].toString()}\n\tHigh = ${this.candlesticks[
        key
      ][1].toString()}\n\tLow = ${this.candlesticks[
        key
      ][2].toString()}\n\tClose = ${this.candlesticks[
        key
      ][3].toString()}`,
    );
  }

  private static prepareCandlestickForNextBlock() {
    const keys = Object.keys(this.candlesticks);
    this.candlesticks = keys.reduce(
      (acc, key) => {
        const [, , , close] = this.candlesticks[key];
        acc[key] = [
          new BigNumber(close),
          new BigNumber(close),
          new BigNumber(close),
          new BigNumber(close),
        ];
        return acc;
      },
      {} as CandlestickBlock,
    );
  }

  static async save(block: SubstrateBlock): Promise<void> {

    const keys = Object.keys(this.candlesticks);    
    const candlesticks: CandlestickModel[] = await Promise.all(keys.map(async (key) => {
      const [open, high, low, close] = this.candlesticks[key];
      const [poolId, token] = key.split(':');
      const pool = await ctx.store.get(Pool, poolId);
      return new CandlestickModel({
        id: `${block.height}-${poolId}-${token}`,
        blockId: block.id,
        pool,
        token,
        open: bigdecimalTransformer.from(open),
        high: bigdecimalTransformer.from(high),
        low: bigdecimalTransformer.from(low),
        close: bigdecimalTransformer.from(close),
        timestamp: new Date(block.timestamp),
      });
    }));

    await ctx.store.save(candlesticks);

    this.prepareCandlestickForNextBlock();
  }
}

export default Candlestick;
