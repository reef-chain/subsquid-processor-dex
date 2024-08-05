import BigNumber from "bignumber.js";

export const calculateTVL = ({
    reserved1,
    reserved2,
    decimals1,
    decimals2,
    token1,
    token2,
  }:any, tokenPrices: any): string => {
    const r1 = new BigNumber(reserved1).div(new BigNumber(10).pow(decimals1)).multipliedBy(tokenPrices[token1] || 0);
    const r2 = new BigNumber(reserved2).div(new BigNumber(10).pow(decimals2)).multipliedBy(tokenPrices[token2] || 0);
    const result = r1.plus(r2).toFormat(2);
    return result === 'NaN' ? '0' : result;
  };