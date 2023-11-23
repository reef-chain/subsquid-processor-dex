import { Event } from '@subsquid/substrate-processor';
import { Fields, ctx } from '../../processor';
import PoolEventBase from './PoolEventBase';
import * as erc20 from "../../abi/ERC20";
import * as factory from "../../abi/ReefswapV2Factory";
import { Pool, Token } from '../../model';
import { isApprovedContract, verifyPool } from './poolVerification';
import { getTokenIcon } from '../../util/util';

class FactoryEvent extends PoolEventBase<Event<Fields>> {
  static verify = false;
  poolAddress?: string;
  tokenAddress1?: string;
  tokenAddress2?: string;
  blockHeight?: number;

  async process(event: Event<Fields>, blockHeight: number): Promise<void> {
    await super.process(event);

    const args = factory.events.PairCreated.decode({topics: event.args.topics, data: event.args.data} );
    ctx.log.info(`Factory PairCreate event detected on evm even id: ${this.evmEventId}`);

    const [tokenAddress1, tokenAddress2, poolAddress] = args as any[];

    this.tokenAddress1 = tokenAddress1;
    this.tokenAddress2 = tokenAddress2;
    this.poolAddress = poolAddress;
    this.blockHeight = blockHeight;
  }

  async save(): Promise<void> {
    await super.save();
    if (!this.poolAddress || !this.tokenAddress1 || !this.tokenAddress2 || !this.blockHeight) {
      throw new Error('Not all required fields are set! Call process() first');
    }

    let token1 = await ctx.store.findOneBy(Token, { id: this.tokenAddress1 });
    if (!token1) {
        const contract1 = new erc20.Contract(
          {_chain: {client: ctx._chain.rpc}},
          { height: this.blockHeight },
          this.tokenAddress1
        );

        let decimals1;
        try { decimals1 = await contract1.decimals(); } catch (e) { }

        let name1, symbol1, iconUrl1;
        try { name1 = await contract1.name(); } catch (e) { }
        try { symbol1 = await contract1.symbol() } catch (e) { }
        try { iconUrl1 = await contract1.iconUri() } catch (e) { iconUrl1 = await getTokenIcon(this.tokenAddress1); }

        const approved1 = await isApprovedContract(this.tokenAddress1);

        token1 = new Token({
          id: this.tokenAddress1,
          name: name1 || '',
          symbol: symbol1 || '',
          iconUrl: iconUrl1 || '',
          decimals: decimals1 || 0,
          approved: approved1,
        });
        await ctx.store.save(token1);
    }

    let token2 = await ctx.store.findOneBy(Token, { id: this.tokenAddress2 });
    if (!token2) {
        const contract2 = new erc20.Contract(
          {_chain: {client: ctx._chain.rpc}}, 
          { height: this.blockHeight }, 
          this.tokenAddress2
        );

        let decimals2;
        try { decimals2 = await contract2.decimals(); } catch (e) { }

        let name2, symbol2, iconUrl2;
        try { name2 = await contract2.name(); } catch (e) { }
        try { symbol2 = await contract2.symbol() } catch (e) { }
        try { iconUrl2 = await contract2.iconUri() } catch (e) { iconUrl2 = await getTokenIcon(this.tokenAddress2); }

        const approved2 = await isApprovedContract(this.tokenAddress2);

        token2 = new Token({
          id: this.tokenAddress2,
          name: name2 || '',
          symbol: symbol2 || '',
          iconUrl: iconUrl2 || '',
          decimals: decimals2 || 0,
          approved: approved2,
        });
        await ctx.store.save(token2);
    }

    // Save pool
    const pool = new Pool({
      id: this.poolAddress,
      evmEventId: this.evmEventId,
      token1,
      token2,
      decimals: 18,
      verified: false,
    });
    await ctx.store.save(pool);

    if (FactoryEvent.verify) {
      await verifyPool(pool, this.blockHeight!);
    }
  }

}

export default FactoryEvent;
