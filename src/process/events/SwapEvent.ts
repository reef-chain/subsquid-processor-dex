import { utils } from 'ethers';
import { PoolType } from '../../model';
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
  }
}

export default SwapEvent;
