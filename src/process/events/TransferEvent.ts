import { BigNumber, constants, utils } from 'ethers';
import { PoolEvent as PoolEventModel, PoolType } from '../../model';
import { ctx } from '../../processor';
import PoolEvent, { PoolEventData } from './PoolEvent';

class TransferEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, PoolType.Transfer);
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    const [addr1, addr2, amount] = event.args;

    // When mint is called first address is zero and when burn is called second address is zero.
    if (addr1 !== constants.AddressZero && addr2 !== constants.AddressZero) { return; }
    if (addr1 === constants.AddressZero && addr2 === constants.AddressZero) { return; }

    const prevSupply = await ctx.store.findOne(PoolEventModel, {
      where: { pool: { id: this.poolId }, type: PoolType.Transfer },
      order: { timestamp: 'DESC' },
    });

    const isMint = addr1 === constants.AddressZero;
    const prev = BigNumber.from((prevSupply?.totalSupply || 0).toString());

    this.totalSupply = (isMint ? prev.add(amount) : prev.sub(amount)).toString();
    this.supply = `${!isMint ? '-' : ''}${amount.toString()}`;    

    ctx.log.info(`Transfer event processed! \n\tPool id:${this.poolId}\n\tSupply: ${this.supply}\n\tTotal supply: ${this.totalSupply}`);
  }
}

export default TransferEvent;
