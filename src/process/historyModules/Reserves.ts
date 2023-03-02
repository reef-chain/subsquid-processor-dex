import { SubstrateBlock } from '@subsquid/substrate-processor';
import BigNumber from 'bignumber.js';
import { Pool, ReservedRaw } from '../../model';
import { ctx } from '../../processor';
import MarketHistoryModule from './MarketHistoryModule';

type Reserve = [BigNumber, BigNumber, string];

class Reserves implements MarketHistoryModule {
  private static pools: string[] = [];

  private static reserves: Reserve[] = [];

  static async init(blockId: string): Promise<void> {
    ctx.log.info(`Initializing Reserves holder on block: ${blockId}`);
    this.pools = [];
    this.reserves = [];

    const reserves = await ctx.store.find(ReservedRaw, {
      where: { blockId },
      relations: { pool: true }
    });

    for (const reserve of reserves) {
      this.updateReserve(
        reserve.pool.id,
        reserve.id,
        new BigNumber(reserve.reserved1.toString()),
        new BigNumber(reserve.reserved2.toString()),
      );
    }
  }

  static updateReserve(poolId: string, id: string, reserve1: BigNumber, reserve2: BigNumber): void {
    const index = this.pools.indexOf(poolId);
    if (index === -1) {
      ctx.log.info(`Reserves detected new pool: ${poolId}`);
      this.pools.push(poolId);
      this.reserves.push([reserve1, reserve2, id]);
    } else {
      ctx.log.info(`Reserves updated for pool: ${poolId}`);
      this.reserves[index] = [reserve1, reserve2, id];
    }
  }

  static async save(block: SubstrateBlock): Promise<void> {
    const reservedRaw: ReservedRaw[] = await Promise.all(
      this.pools.map(async (poolId, index) => {
        const pool: Pool | undefined = await ctx.store.get(Pool, poolId);
        return new ReservedRaw({
          id: `${block.height}-${poolId}`,
          blockId: block.id,
          eventId: this.reserves[index][2],
          pool,
          reserved1: BigInt(this.reserves[index][0].toFixed() || '0'),
          reserved2: BigInt(this.reserves[index][1].toFixed() || '0'),
          timestamp: new Date(block.timestamp),
        });
      }
    ));

    await ctx.store.save(reservedRaw);
  }
}

export default Reserves;
