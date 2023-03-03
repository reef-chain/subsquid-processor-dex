import { SubstrateBlock } from '@subsquid/substrate-processor';
import BigNumber from 'bignumber.js';
import { ReservedRaw, TokenPrice } from '../../model';
import { bigdecimalTransformer } from '../../model/generated/marshal';
import { ctx } from '../../processor';
import { REEF_CONTRACT_ADDRESS } from '../../util/util';
import MarketHistoryModule from './MarketHistoryModule';
import ReefPriceScrapper from './ReefPriceScrapper';

const dot = (matrix: number[][], vector: number[]): number[] => matrix.map((row) => row.reduce((acc, current, index) => acc + current * vector[index], 0));

const estimateTokenPriceBasedOnReefPrice = (
  reserves: number[][],
  reefPrice: number,
  reefIndex: number,
): number[] => {
  // Create new vector with reef price
  const prices = new Array(reserves.length)
    .fill(0)
    .map((_, i) => (i === reefIndex ? reefPrice : 0));

  // Solve the system of equations
  const newPrices = dot(reserves, prices);

  // Inject reef price into the price vector
  return newPrices.map((price, index) => (index === reefIndex ? reefPrice : price));
};

class TokenPrices implements MarketHistoryModule {
  private static skip = false;

  private static tokens: string[] = [];

  private static priceVector: number[] = [];

  private static reserveMatrix: number[][] = [];

  static async init(blockHeight: number): Promise<void> {
    // On init reset all variables
    this.tokens = [];
    this.priceVector = [];
    this.reserveMatrix = [];

    // Retrieve block data from tokenPrice table
    const priceData = await ctx.store.find(TokenPrice, {
      where: { blockHeight },
    });

    // Add tokens to the list and price vector
    for (const { price, token } of priceData) {
      this.addToken(token, Number(price));
    }

    // Retrieve reserved data from reservedRaw table
    const reserveData = await ctx.store.find(ReservedRaw, {
      where: { blockHeight },
      relations: { pool: true }
    });

    // Update the reserve matrix
    for (const {
      pool, reserved1, reserved2
    } of reserveData) {
      this.updateReserves(
        pool.token1,
        pool.token2,
        new BigNumber(reserved1.toString()).div(new BigNumber(10).pow(pool.decimal1)),
        new BigNumber(reserved2.toString()).div(new BigNumber(10).pow(pool.decimal2)),
      );
    }

    // If for some reason reef token is not in the list, add it
    if (this.tokens.indexOf(REEF_CONTRACT_ADDRESS) === -1) {
      this.addToken(REEF_CONTRACT_ADDRESS);
    }
  }

  static addPool(token1: string, token2: string): void {
    this.addToken(token1);
    this.addToken(token2);
  }

  static updateReserves(token1: string, token2: string, reserve1: BigNumber, reserve2: BigNumber): void {
    // Find the index of the tokens in the list
    const i = this.tokens.indexOf(token1);
    const j = this.tokens.indexOf(token2);

    // Ensure that the tokens are in the list
    if (i === -1 || j === -1) {
      throw new Error('Token not found');
    }

    ctx.log.info(`Updating token price reserve ratios for ${token1} and ${token2}`);

    // Update the reserve matrix
    this.reserveMatrix[i][j] = reserve1.div(reserve2).toNumber();
    this.reserveMatrix[j][i] = reserve2.div(reserve1).toNumber();

    // Update the price vector only when reef token is present in pool
    // This is because we are approximating the price of the token based on the reef price
    // Once we onboard stable coins and estimate price through them, we can remove this condition
    if (token1 === REEF_CONTRACT_ADDRESS || token2 === REEF_CONTRACT_ADDRESS) {
      this.skip = false;
    }
  }

  static async save(block: SubstrateBlock): Promise<void> {
    await this.estimatePrice(new Date(block.timestamp));
    await this.insertPrices(block);
  }

  // Private methods
  private static addToken(token: string, price = 0): void {
    const index = this.tokens.indexOf(token);
    if (index === -1) {
      const oldLength = this.tokens.length;
      // Add token to the listi
      this.tokens.push(token);
      // Add token to the price vector
      this.priceVector.push(price);
      // Add token to the reserve matrix
      this.reserveMatrix.push(new Array(oldLength).fill(0));
      this.reserveMatrix.forEach((row) => row.push(0));
    }
  }

  private static async estimatePrice(timestamp: Date): Promise<void> {
    const reefIndex = this.tokens.indexOf(REEF_CONTRACT_ADDRESS);
    const currentReefPrice = this.priceVector[reefIndex];

    // Retrieve latest reef price
    const reefPrice = await ReefPriceScrapper.getPrice(timestamp);

    // Inject reef price into the price vector
    this.priceVector[reefIndex] = reefPrice;

    if (!this.skip || currentReefPrice !== reefPrice) {
      ctx.log.info('Estimating token prices');
      // Solve the system of equations to estimate the prices
      // Update the price vector
      this.priceVector = estimateTokenPriceBasedOnReefPrice(
        this.reserveMatrix,
        this.priceVector[reefIndex],
        reefIndex,
      );
    }

    this.skip = true;
  }

  private static async insertPrices(block: SubstrateBlock): Promise<void> {
    // Insert the price vector into the database
    const tokenPrices: TokenPrice[] = await Promise.all(
      this.priceVector.map(async (price, index) => {
        const token = this.tokens[index];
        return new TokenPrice({
          id: `${String(block.height).padStart(9, '0')}-${token}`,
          blockHeight: block.height,
          token,
          price: bigdecimalTransformer.from(price),
          timestamp: new Date(block.timestamp),
        });
      }
    ));

    await ctx.store.save(tokenPrices);
  }
}

export default TokenPrices;
