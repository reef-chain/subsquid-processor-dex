import ethers from 'ethers';
import { ctx } from '../../processor';
import PoolEventBase from './PoolEventBase';

class EmptyEvent extends PoolEventBase<ethers.LogDescription> {
  async process(event: ethers.LogDescription): Promise<void> {
    await super.process(event);
    ctx.log.info(`Processing empty event ${event.name} detected!`);
  }
}

export default EmptyEvent;
