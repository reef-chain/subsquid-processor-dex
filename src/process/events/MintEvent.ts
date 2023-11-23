import ethers from 'ethers';
import { PoolType } from '../../model';
import { ctx } from '../../processor';
import PoolEvent, { PoolEventData } from './PoolEvent';

class MintEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, PoolType.Mint);
  }

  async process(event: ethers.LogDescription): Promise<void> {
    await super.process(event);
    const [address, amount0, amount1] = event.args;
    this.senderAddress = address;
    this.amount1 = amount0.toString();
    this.amount2 = amount1.toString();
    ctx.log.info(`Mint event processed! \n\tSender: ${this.senderAddress} \n\tAmount1: ${this.amount1} \n\tAmount2: ${this.amount2}`);
  }
}

export default MintEvent;
