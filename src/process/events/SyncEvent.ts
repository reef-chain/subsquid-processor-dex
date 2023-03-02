import { utils } from 'ethers';
import BigNumber from 'bignumber.js';
import TokenPrices from '../historyModules/TokenPrices';
import PoolEvent, { PoolEventData } from './PoolEvent';
import Reserves from '../historyModules/Reserves';
import Candlestick from '../historyModules/Candlestick';
import { ctx } from '../../processor';
import { Pool, PoolType } from '../../model';

class SyncEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, PoolType.Sync);
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    const pool = await ctx.store.get(Pool, this.poolId);
    if (!pool) throw new Error(`Pool with id: ${this.poolId} not found`);

    const { token1, token2, decimal1, decimal2 } = pool;

    this.reserved1 = event.args[0].toString();
    this.reserved2 = event.args[1].toString();

    if (!this.reserved1 || !this.reserved2) {
      throw new Error(`Sync event on evm event: ${this.evmEventId} has no reserve`);
    }
    ctx.log.info(`Sync event processed! \n\tPool id:${this.poolId}\n\tReserved1: ${this.reserved1} \n\tReserved2: ${this.reserved2}`);

    // Update reserves for tokens in TokenPrices
    const reservedRaw1 = new BigNumber(this.reserved1);
    const reservedRaw2 = new BigNumber(this.reserved2);
    const reserve1 = reservedRaw1.dividedBy((10 ** decimal1));
    const reserve2 = reservedRaw2.dividedBy((10 ** decimal2));
    const price1 = reserve2.dividedBy(reserve1);
    const price2 = reserve1.dividedBy(reserve2);

    // Updating history modules
    TokenPrices.updateReserves(token1, token2, reserve1, reserve2);
    Reserves.updateReserve(this.poolId, this.evmEventId, reservedRaw1, reservedRaw2);
    Candlestick.updateCandlestick(this.poolId, token1, price1);
    Candlestick.updateCandlestick(this.poolId, token2, price2);
  }
}

export default SyncEvent;
