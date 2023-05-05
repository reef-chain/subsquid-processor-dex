import { EventRaw } from '../../interfaces/interfaces';
import { ctx } from '../../processor';
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
  name1?: string;
  name2?: string;
  symbol1?: string;
  symbol2?: string;
  blockHeight?: number;

  async process(eventRaw: EventRaw, blockHeight: number): Promise<void> {
    await super.process(eventRaw);

    const args = factory.events.PairCreated.decode({topics: eventRaw.args.topics, data: eventRaw.args.data} );
    ctx.log.info(`Factory PairCreate event detected on evm even id: ${this.evmEventId}`);

    const [tokenAddress1, tokenAddress2, poolAddress] = args as any[];

    this.poolAddress = poolAddress;
    this.tokenAddress1 = tokenAddress1;
    this.tokenAddress2 = tokenAddress2;

    const contract1 = new erc20.Contract(ctx, { height: blockHeight }, tokenAddress1);
    const contract2 = new erc20.Contract(ctx, { height: blockHeight }, tokenAddress2);

    this.decimal1 = await contract1.decimals();
    this.decimal2 = await contract2.decimals();

    try { 
      this.name1 = await contract1.name(); 
    } catch (e) { 
      this.name1 = '';
    }

    try { 
      this.name2 = await contract2.name(); 
    } catch (e) { 
      this.name2 = '';
    }

    try {
      this.symbol1 = await contract1.symbol();
    } catch (e) {
      this.symbol1 = '';
    }

    try {
      this.symbol2 = await contract2.symbol();
    } catch (e) {
      this.symbol2 = '';
    }

    this.blockHeight = blockHeight;
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
      name1: this.name1,
      name2: this.name2,
      symbol1: this.symbol1,
      symbol2: this.symbol2,
      verified: false,
    });
    await ctx.store.save(pool);

    if (FactoryEvent.verify) {
      await verifyPool(pool, this.blockHeight!);
    }
  }

}

export default FactoryEvent;
