import axios from "axios";
import { ctx } from "../../processor";
import ReefswapV2PairSource from "../../util/ReefswapV2PairSource";

const verificationApi = axios.create({ baseURL: `${process.env.VERIFICATION_API_URL}/api/verificator/submit-verification` });

export const verifyPool = async (address: string) => {
  try {
    await verificationApi.post('/', {
      name: 'ReefswapV2Pair',
      runs: 999999,
      source: ReefswapV2PairSource,
      target: 'london',
      address,
      filename: 'ReefswapV2Pair.sol',
      license: 'none',
      arguments: [],
      optimization: true,
      compilerVersion: 'v0.5.16+commit.9c3226ce'
    });
  } catch (e) {
    ctx.log.error(`Failed to verify pool ${address}`);
  }
};

