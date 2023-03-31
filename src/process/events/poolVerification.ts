import axios from "axios";
import { Pool } from "../../model";
import { ctx } from "../../processor";
import ReefswapV2PairSource from "../../util/ReefswapV2PairSource";

const verificationApi = axios.create({ baseURL: `${process.env.VERIFICATION_API_URL}/api/verificator/submit-verification` });

export const verifyAll = async() => {
  const unverifiedPools = await ctx.store.find(Pool, {
    where: { verified: false }
  });
  for (const pool of unverifiedPools) {
    await verifyPool(pool, ctx.blocks[0].header.height)    
  }
}

export const verifyPool = async (pool: Pool, blockHeight: number) => {
  try {
    const res = await verificationApi.post('/', {
      name: 'ReefswapV2Pair',
      runs: 999999,
      source: ReefswapV2PairSource,
      target: 'london',
      address: pool.id,
      filename: 'ReefswapV2Pair.sol',
      license: 'none',
      arguments: '[]',
      optimization: 'true',
      compilerVersion: 'v0.5.16+commit.9c3226ce',
      blockHeight
    });
    
    if (res?.data === 'Verified') {
      pool.verified = true;
      ctx.store.save(pool);
    } else {
      ctx.log.error(`Failed to verify pool ${pool.id}`);
    }
  } catch (e) {
    ctx.log.error(`Failed to verify pool ${pool.id}`);
  }
};

