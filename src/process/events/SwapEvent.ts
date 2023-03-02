import { utils } from 'ethers';
import { PoolType } from '../../model';
import Volume from '../historyModules/Volume';
import PoolEvent, { PoolEventData } from './PoolEvent';

class SwapEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, PoolType.Swap);
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    const [address, amoin1, amoin2, amo1, amo2, to] = event.args;
    this.senderAddress = address;
    this.amountIn1 = amoin1.toString();
    this.amountIn2 = amoin2.toString();
    this.amount1 = amo1.toString() as string;
    this.amount2 = amo2.toString() as string;
    this.toAddress = to;

    await Volume.updateVolume(this.poolId, this.amount1, this.amount2);
  }
}

export default SwapEvent;
