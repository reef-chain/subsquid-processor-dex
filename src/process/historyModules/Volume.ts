import { SubstrateBlock } from '@subsquid/substrate-processor';
import BigNumber from 'bignumber.js';
import { Pool, VolumeRaw } from '../../model';
import { ctx } from '../../processor';
import MarketHistoryModule from './MarketHistoryModule';

type BlockPoolVolume = [BigNumber, BigNumber];
type BlockVolume = {
  [poolId: string]: BlockPoolVolume;
}

class Volume implements MarketHistoryModule {
  private static pools: Pool[] = [];

  private static blockVolume: BlockVolume = {};

  static async init(blockId: string): Promise<void> {
    ctx.log.info(`Initializing Volume holder on block: ${blockId}`);
    this.pools = await ctx.store.find(Pool);
    ctx.log.info(`Volume for pools: [${this.pools.map(p => p.id).join(', ')}] initialized`);
  }

  static async updateVolume(poolId: string, volume1: string, volume2: string): Promise<void> {
    const index = this.pools.findIndex(p => p.id === poolId);
    if (index === -1) {
      ctx.log.info(`Volume detected new pool: ${poolId}`);
      const pool = await ctx.store.get(Pool, poolId);
      if (!pool) { throw new Error(`Pool ${poolId} not found`); }
      this.pools.push(pool);
    }

    if (this.blockVolume[poolId] === undefined) {
      ctx.log.info(`Volume initialized for pool: ${poolId} with \n\tVolume1 = ${volume1.toString()}\n\tVolume2 = ${volume2.toString()}`);
      this.blockVolume[poolId] = [new BigNumber(volume1), new BigNumber(volume2)];
    } else {
      this.blockVolume[poolId][0] = this.blockVolume[poolId][0].plus(volume1);
      this.blockVolume[poolId][1] = this.blockVolume[poolId][1].plus(volume2);
      ctx.log.info(`Volume updated for pool: ${poolId} with \n\tVolume1 = ${this.blockVolume[poolId][0].toString()}\n\tVolume2 = ${this.blockVolume[poolId][1].toString()}`);
    }
  }

  static async save(block: SubstrateBlock): Promise<void> {
    const volumeRaws: VolumeRaw[] = await Promise.all(
      this.pools.map(async (pool) => {
        return new VolumeRaw({
          id: `${block.height}-${pool.id}`,
          blockId: block.id,
          pool,
          volume1: this.blockVolume[pool.id] ? BigInt(this.blockVolume[pool.id][0].toFixed()) : BigInt('0'),
          volume2: this.blockVolume[pool.id] ? BigInt(this.blockVolume[pool.id][1].toFixed()) : BigInt('0'),
          timestamp: new Date(block.timestamp),
        });
      }
    ));

    await ctx.store.save(volumeRaws);
    this.blockVolume = {};
  }
}

export default Volume;
