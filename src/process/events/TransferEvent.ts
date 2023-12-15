import { ethers } from 'ethers';
import { PoolEvent as PoolEventModel, PoolType } from '../../model';
import { ctx } from '../../processor';
import PoolEvent, { PoolEventData } from './PoolEvent';

class TransferEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, PoolType.Transfer);
  }

  async process(event: ethers.LogDescription): Promise<void> {
    await super.process(event);
    const [addr1, addr2, amount] = event.args;

    // When mint is called first address is zero and when burn is called second address is zero.
    if (addr1 !== ethers.ZeroAddress && addr2 !== ethers.ZeroAddress) { return; }
    if (addr1 === ethers.ZeroAddress && addr2 === ethers.ZeroAddress) { return; }

    const prevSupply = await ctx.store.findOne(PoolEventModel, {
      where: { pool: { id: this.poolId }, type: PoolType.Transfer },
      order: { timestamp: 'DESC' },
    });

    const isMint = addr1 === ethers.ZeroAddress;
    const prev = BigInt((prevSupply?.totalSupply || 0).toString());

    this.totalSupply = (isMint ? prev + amount : prev - amount).toString();
    this.supply = `${!isMint ? '-' : ''}${amount.toString()}`;    

    ctx.log.info(`Transfer event processed! \n\tPool id:${this.poolId}\n\tSupply: ${this.supply}\n\tTotal supply: ${this.totalSupply}`);
  }
}

export default TransferEvent;
