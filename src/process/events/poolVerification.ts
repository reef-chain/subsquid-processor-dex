import axios from "axios";
import { Pool } from "../../model";
import { ctx } from "../../processor";
import ReefswapV2PairSource from "../../util/ReefswapV2PairSource";
import { REEF_CONTRACT_ADDRESS } from "../../util/util";

const verificationApi = axios.create({ baseURL: `${process.env.VERIFICATION_API_URL}/api/verificator` });

export const verifyAll = async() => {
  const unverifiedPools = await ctx.store.find(Pool, {
    where: { verified: false }
  });
  ctx.log.info(`Submitting verification for ${unverifiedPools.length} pools`);
  for (const pool of unverifiedPools) {
    await verifyPool(pool, ctx.blocks[0].header.height)    
  }
}

export const verifyPool = async (pool: Pool, blockHeight: number) => {
  try {
    const res = await verificationApi.post('/submit-verification', {
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
      ctx.log.info(`Pool ${pool.id} has been verified`)
    } else {
      ctx.log.error(`Failed to verify pool ${pool.id}`);
    }
  } catch (e: any) {
    if (e?.response?.data?.error === 'Contract already verified') {
      pool.verified = true;
      ctx.store.save(pool);
      ctx.log.info(`Pool ${pool.id} already verified`)
    } else {
      ctx.log.error(`Failed to verify pool ${pool.id}: ${e?.response?.data?.error || e?.response?.data || e}`);
    }
  }
};

export const isApprovedContract = async (address: string) => {
  if (address === REEF_CONTRACT_ADDRESS) return true;

  try {
    const res = await verificationApi.get(`/contract/${address}`);
    if (res?.data?.approved === true) {
      return true;
    } else {
      return false;
    }
  } catch (e: any) {
    ctx.log.error(`Error checking if contract ${address} is approved: ${e?.response?.data?.error || e?.response?.data || e}`)
    return false;
  }
};
