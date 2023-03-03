import { EventRaw } from '../../interfaces/interfaces';
import { ctx } from '../../processor';
import TokenPrices from '../historyModules/TokenPrices';
import PoolEventBase from './PoolEventBase';
import * as erc20 from "../../abi/ERC20";
import * as factory from "../../abi/ReefswapV2Factory";
import { Pool } from '../../model';
import { verifyPool } from './poolVerification';

class FactoryEvent extends PoolEventBase<EventRaw> {
  static verify = false;

  poolAddress?: string;

  tokenAddress1?: string;

  tokenAddress2?: string;

  decimal1?: number;

  decimal2?: number;

  async process(eventRaw: EventRaw, blockHeight: number): Promise<void> {
    await super.process(eventRaw);

    const args = factory.events.PairCreated.decode({topics: eventRaw.args.topics, data: eventRaw.args.data} );
    ctx.log.info(`Factory PairCreate event detected on evm even id: ${this.evmEventId}`);

    const [tokenAddress1, tokenAddress2, poolAddress] = args as any[];

    this.poolAddress = poolAddress;
    this.tokenAddress1 = tokenAddress1;
    this.tokenAddress2 = tokenAddress2;

    this.decimal1 = await new erc20.Contract(ctx, { height: blockHeight }, tokenAddress1).decimals();
    this.decimal2 = await new erc20.Contract(ctx, { height: blockHeight }, tokenAddress2).decimals();

    // Add new pool in TokenPrices
    TokenPrices.addPool(tokenAddress1, tokenAddress2);
  }

  async save(): Promise<void> {
    await super.save();
    if (!this.poolAddress || !this.tokenAddress1 || !this.tokenAddress2 || !this.decimal1 || !this.decimal2) {
      throw new Error('Not all required fields are set! Call process() first');
    }

    // Save pool
    const pool = new Pool({
      id: this.poolAddress,
      evmEventId: this.evmEventId,
      token1: this.tokenAddress1,
      token2: this.tokenAddress2,
      poolDecimal: 18,
      decimal1: this.decimal1,
      decimal2: this.decimal2,
    });
    await ctx.store.save(pool);

    // TODO: Contract may not be present in DB. wait some time?, add contract from verification api?
    if (FactoryEvent.verify) {
      verifyPool(this.poolAddress);
    }
  }

}

export default FactoryEvent;
