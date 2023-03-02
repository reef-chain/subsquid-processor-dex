import { utils } from 'ethers';
import { PoolType } from '../../model';
import { ctx } from '../../processor';
import PoolEvent, { PoolEventData } from './PoolEvent';

class BurnEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, PoolType.Burn);
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    const [address, amount1, amount2, to] = event.args;
    this.senderAddress = address;
    this.amount1 = amount1.toString();
    this.amount2 = amount2.toString();
    this.toAddress = to;
    ctx.log.info(`Burn event processed! \n\tSender: ${this.senderAddress} \n\tAmount1: ${this.amount1} \n\tAmount2: ${this.amount2} \n\tTo: ${this.toAddress}`);
  }
}

export default BurnEvent;
