import { utils } from 'ethers';
import PoolEvent, { PoolEventData } from './PoolEvent';
import { ctx } from '../../processor';
import { PoolType } from '../../model';

class SyncEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, PoolType.Sync);
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    this.reserved1 = event.args[0].toString();
    this.reserved2 = event.args[1].toString();

    if (!this.reserved1 || !this.reserved2) {
      throw new Error(`Sync event on evm event: ${this.evmEventId} has no reserve`);
    }
    ctx.log.info(`Sync event processed! \n\tPool id:${this.poolId}\n\tReserved1: ${this.reserved1} \n\tReserved2: ${this.reserved2}`);
  }
}

export default SyncEvent;
