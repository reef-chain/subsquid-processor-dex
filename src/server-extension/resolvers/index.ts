import "reflect-metadata";
import { Arg, Field, Int, ObjectType, Query, Resolver } from 'type-graphql';
import { BigInteger, BigDecimalScalar, DateTime } from '@subsquid/graphql-server';
import type { EntityManager } from 'typeorm'
import BigNumber from 'bignumber.js';
import { PoolListsResolver } from "./poolLists";

@ObjectType()
export class Ping {
  @Field(() => String, { nullable: false })
  message!: string

  constructor(message: string) { this.message = message }
}

@Resolver()
export class PingResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => Ping)
  async ping(): Promise<Ping> {
    return new Ping(`Custom API extension works!`)
  }
}

@ObjectType()
export class PoolObject {
  @Field(() => String, { nullable: false })
  address!: string;

  @Field(() => String, { nullable: false })
  token1!: string;

  @Field(() => String, { nullable: false })
  token2!: string;

  constructor(props: Partial<PoolObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class ReservesObject {
  @Field(() => PoolObject, { nullable: true })
  pool!: PoolObject;

  @Field(() => BigInteger, { nullable: true })
  reserved1!: bigint;

  @Field(() => BigInteger, { nullable: true })
  reserved2!: bigint;

  @Field(() => DateTime, { nullable: true })
  timeframe!: Date;

  constructor(props: Partial<ReservesObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class VolumeObject {
  @Field(() => PoolObject, { nullable: true })
  pool!: PoolObject;

  @Field(() => BigInteger, { nullable: true })
  amount1!: bigint;

  @Field(() => BigInteger, { nullable: true })
  amount2!: bigint;

  @Field(() => DateTime, { nullable: true })
  timeframe!: Date;

  constructor(props: Partial<VolumeObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class CandlestickObject {
  @Field(() => BigDecimalScalar, { nullable: true })
  close!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  high!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  open!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  low!: BigNumber;

  @Field(() => DateTime, { nullable: true })
  timeframe!: Date;

  constructor(props: Partial<CandlestickObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class PoolCandlestickObject {
  @Field(() => String, { nullable: true })
  poolId!: string;

  @Field(() => BigDecimalScalar, { nullable: true })
  close1!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  close2!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  high1!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  high2!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  open1!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  open2!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  low1!: BigNumber;

  @Field(() => BigDecimalScalar, { nullable: true })
  low2!: BigNumber;

  @Field(() => Int, { nullable: true })
  whichToken!: number;

  @Field(() => String, { nullable: true })
  token1!: string;

  @Field(() => String, { nullable: true })
  token2!: string;

  @Field(() => DateTime, { nullable: true })
  timeframe!: Date;

  constructor(props: Partial<PoolCandlestickObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class PoolData {
  @Field(() => [CandlestickObject], { nullable: false })
  candlestick1!: CandlestickObject[];

  @Field(() => [CandlestickObject], { nullable: false })
  candlestick2!: CandlestickObject[];

  @Field(() => [FeeObject], { nullable: false })
  fee!: FeeObject[];

  @Field(() => [VolumeObject], { nullable: false })
  volume!: VolumeObject[];

  @Field(() => [ReservesObject], { nullable: false })
  reserves!: ReservesObject[];

  @Field(() => ReservesObject, { nullable: false })
  previousReserves!: ReservesObject;

  @Field(() => CandlestickObject, { nullable: false })
  previousCandlestick1!: CandlestickObject;

  @Field(() => CandlestickObject, { nullable: false })
  previousCandlestick2!: CandlestickObject;

  constructor(props: Partial<PoolData>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class FeeObject {
  @Field(() => BigInteger, { nullable: true })
  fee1!: bigint;

  @Field(() => BigInteger, { nullable: true })
  fee2!: bigint;

  @Field(() => DateTime, { nullable: false })
  timeframe!: Date;

  constructor(props: Partial<FeeObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class PoolInfo {
  @Field(() => FeeObject, { nullable: false })
  fee!: FeeObject;

  @Field(() => VolumeObject, { nullable: false })
  currentDayVolume!: VolumeObject;

  @Field(() => VolumeObject, { nullable: false })
  previousDayVolume!: VolumeObject;

  @Field(() => ReservesObject, { nullable: false })
  reserves!: ReservesObject;

  @Field(() => BigInteger, { nullable: false })
  totalSupply!: bigint;

  @Field(() => BigInteger, { nullable: false })
  userSupply!: bigint;

  constructor(props: Partial<PoolInfo>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class PoolEventObject {
  @Field(() => String, { nullable: false })
  address!: string;

  @Field(() => String, { nullable: false })
  token1!: string;

  @Field(() => String, { nullable: false })
  token2!: string;

  @Field(() => BigInteger, { nullable: false })
  reserved1!: bigint;

  @Field(() => BigInteger, { nullable: false })
  reserved2!: bigint;

  @Field(() => Int, { nullable: false })
  decimal1!: number;

  @Field(() => Int, { nullable: false })
  decimal2!: number;

  @Field(() => String, { nullable: false })
  symbol1!: string;

  @Field(() => String, { nullable: false })
  symbol2!: string;

  constructor(props: Partial<PoolEventObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class PoolVolumeObject {
  @Field(() => BigInteger, { nullable: false })
  amount1!: bigint;

  @Field(() => BigInteger, { nullable: false })
  amount2!: bigint;

  constructor(props: Partial<PoolVolumeObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class PoolFeeObject {
  @Field(() => BigInteger, { nullable: false })
  fee1!: bigint;

  @Field(() => BigInteger, { nullable: false })
  fee2!: bigint;

  @Field(() => DateTime, { nullable: true })
  timeframe!: Date;

  constructor(props: Partial<PoolFeeObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class PoolSupplyObject {
  @Field(() => BigInteger, { nullable: false })
  totalSupply!: bigint;

  @Field(() => DateTime, { nullable: false })
  timeframe!: Date;

  constructor(props: Partial<PoolSupplyObject>) {
    Object.assign(this, props);
  }
}


@Resolver()
export class PoolResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => [ReservesObject])
  async totalSupply(@Arg('toTime') toTime: string): Promise<ReservesObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (pool_id) pool.id, pool.token1, pool.token2, pool_event.reserved1, pool_event.reserved2
      FROM pool_event
      INNER JOIN pool ON pool_event.pool_id = pool.id
      WHERE pool_event.type = 'Sync' AND pool_event.timestamp < $1
      ORDER BY pool_id ASC, timestamp DESC;
    `;
    let result = await manager.query(query, [toTime]);
    result = result.map((row: any) => {
      return new ReservesObject({
        pool: new PoolObject({
          address: row.id,
          token1: row.token1,
          token2: row.token2,
        }),
        reserved1: row.reserved1,
        reserved2: row.reserved2,
      });
    });

    return result;
  }

  @Query(() => [VolumeObject])
  async volume(@Arg('fromTime') fromTime: string): Promise<VolumeObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (pool_id, timeframe) pool.id, pool.token1, pool.token2, pool_hour_volume.amount1, pool_hour_volume.amount2
      FROM pool_hour_volume
      INNER JOIN pool ON pool_hour_volume.pool_id = pool.id
      WHERE pool_hour_volume.timeframe >= $1
      ORDER BY pool_id ASC, timeframe DESC;
    `;
    let result = await manager.query(query, [fromTime]);
    result = result.map((row: any) => {
      return new VolumeObject({
        pool: new PoolObject({
          address: row.id,
          token1: row.token1,
          token2: row.token2,
        }),
        amount1: row.amount1,
        amount2: row.amount2,
      });
    });

    return result;    
  }

  @Query(() => PoolData)
  async poolData(
    @Arg('address') address: string,
    @Arg('fromTime') fromTime: string
  ): Promise<PoolData> {
    const manager = await this.tx();

    const queryCandlestick1 = `
      SELECT DISTINCT ON (timeframe) close1, high1, open1, low1, timeframe
      FROM pool_day_candlestick
      WHERE which_token = 1 AND pool_id = $1 AND timeframe >= $2
    `;
    let resultCandlestick1 = await manager.query(queryCandlestick1, [address, fromTime]);
    resultCandlestick1 = resultCandlestick1.map((row: any) => {
      return new CandlestickObject({
        close: row.close1,
        high: row.high1,
        open: row.open1,
        low: row.low1,
        timeframe: row.timeframe,
      });
    });

    const queryCandlestick2 = `
      SELECT DISTINCT ON (timeframe) close2, high2, open2, low2, timeframe
      FROM pool_day_candlestick
      WHERE which_token = 2 AND pool_id = $1 AND timeframe >= $2
    `;
    let resultCandlestick2 = await manager.query(queryCandlestick2, [address, fromTime]);
    resultCandlestick2 = resultCandlestick2.map((row: any) => {
      return new CandlestickObject({
        close: row.close2,
        high: row.high2,
        open: row.open2,
        low: row.low2,
        timeframe: row.timeframe,
      });
    });

    const queryFee = `
      SELECT DISTINCT ON (timeframe) fee1, fee2, timeframe
      FROM pool_day_fee
      WHERE pool_id = $1 AND timeframe >= $2
    `;
    let resultFee = await manager.query(queryFee, [address, fromTime]);
    resultFee = resultFee.map((row: any) => {
      return new FeeObject({
        fee1: row.fee1,
        fee2: row.fee2,
        timeframe: row.timeframe,
      });
    });

    const queryVolume = `
      SELECT DISTINCT ON (timeframe) amount1, amount2, timeframe
      FROM pool_day_volume
      WHERE pool_id = $1 AND timeframe >= $2
    `;
    let resultVolume = await manager.query(queryVolume, [address, fromTime]);
    resultVolume = resultVolume.map((row: any) => {
      return new VolumeObject({
        amount1: row.amount1,
        amount2: row.amount2,
        timeframe: row.timeframe,
      });
    });

    const queryReserves = `
      SELECT DISTINCT ON (timeframe) reserved1, reserved2, timeframe
      FROM pool_day_locked
      WHERE pool_id = $1 AND timeframe >= $2
    `;
    let resultReserves = await manager.query(queryReserves, [address, fromTime]);
    resultReserves = resultReserves.map((row: any) => {
      return new ReservesObject({
        reserved1: row.reserved1,
        reserved2: row.reserved2,
        timeframe: row.timeframe,
      });
    });

    const queryPreviousReserves = `
      SELECT reserved1, reserved2, timeframe
      FROM pool_day_locked
      WHERE pool_id = $1 AND timeframe < $2
      ORDER BY timeframe DESC
      LIMIT 1
    `;
    let resultPreviousReserves = await manager.query(queryPreviousReserves, [address, fromTime]);
    resultPreviousReserves = resultPreviousReserves.map((row: any) => {
      return new ReservesObject({
        reserved1: row.reserved1,
        reserved2: row.reserved2,
        timeframe: row.timeframe,
      });
    });

    const queryPreviousCandlestick1 = `
      SELECT close1
      FROM pool_day_candlestick
      WHERE which_token = 1 AND pool_id = $1 AND timeframe < $2
      ORDER BY timeframe DESC
      LIMIT 1
    `;
    let resultPreviousCandlestick1 = await manager.query(queryPreviousCandlestick1, [address, fromTime]);
    resultPreviousCandlestick1 = resultPreviousCandlestick1.map((row: any) => {
      return new CandlestickObject({
        close: row.close1,
      });
    });

    const queryPreviousCandlestick2 = `
      SELECT close2
      FROM pool_day_candlestick
      WHERE which_token = 2 AND pool_id = $1 AND timeframe < $2
      ORDER BY timeframe DESC
      LIMIT 1
    `;
    let resultPreviousCandlestick2 = await manager.query(queryPreviousCandlestick2, [address, fromTime]);
    resultPreviousCandlestick2 = resultPreviousCandlestick2.map((row: any) => {
      return new CandlestickObject({
        close: row.close2,
      });
    });

    const result = new PoolData({
      candlestick1: resultCandlestick1,
      candlestick2: resultCandlestick2,
      fee: resultFee,
      volume: resultVolume,
      reserves: resultReserves,
      previousReserves: resultPreviousReserves[0] || {},
      previousCandlestick1: resultPreviousCandlestick1[0] || {},
      previousCandlestick2: resultPreviousCandlestick2[0] || {},
    });

    return result;
  }

  @Query(() => PoolInfo)
  async poolInfo(
    @Arg('address') address: string,
    @Arg('signerAddress') signerAddress: string,
    @Arg('fromTime') fromTime: string,
    @Arg('toTime') toTime: string,
  ): Promise<PoolInfo> {
    const manager = await this.tx();

    const queryFee = `
      SELECT SUM(fee1) AS fee1, SUM(fee2) AS fee2
      FROM (
        SELECT DISTINCT ON (timeframe) fee1, fee2, timeframe
        FROM pool_day_fee
        WHERE (pool_id = $1 AND timeframe >= $2)
      ) t
    `;
    let resultFee = await manager.query(queryFee, [address, toTime]);

    const queryCurrentDayVolume = `
      SELECT SUM(amount1) AS amount1, SUM(amount2) AS amount2
      FROM (
        SELECT DISTINCT ON (timeframe) amount1, amount2, timeframe
        FROM pool_day_volume
        WHERE (pool_id = $1 AND timeframe >= $2)
      ) t
    `;
    let resultCurrentDayVolume = await manager.query(queryCurrentDayVolume, [address, toTime]);

    const queryPreviousDayVolume = `
      SELECT SUM(amount1) AS amount1, SUM(amount2) AS amount2
      FROM (
        SELECT DISTINCT ON (timeframe) amount1, amount2, timeframe
        FROM pool_day_volume
        WHERE (pool_id = $1 AND timeframe >= $2 AND timeframe < $3)
      ) t
    `;
    let resultPreviousDayVolume = await manager.query(queryPreviousDayVolume, [address, fromTime, toTime]);

    const queryReserves = `
      SELECT reserved1, reserved2
      FROM pool_event
      WHERE pool_id = $1 AND type = 'Sync'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    let resultReserves = await manager.query(queryReserves, [address]);
    resultReserves = resultReserves.map((row: any) => {
      return new ReservesObject({
        reserved1: row.reserved1,
        reserved2: row.reserved2
      });
    });

    const queryTotalSupply = `
      SELECT total_supply
      FROM pool_event
      WHERE pool_id = $1 AND type = 'Transfer'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    let resultTotalSupply = await manager.query(queryTotalSupply, [address]);

    const queryUserSupply = `
      SELECT SUM(supply) AS supply
      FROM pool_event
      WHERE pool_id = $1 AND type = 'Transfer' AND signer_address = $2
    `;
    let resultUserSupply = await manager.query(queryUserSupply, [address, signerAddress]);

    const result = new PoolInfo({
      fee: resultFee[0] || {},
      currentDayVolume: resultCurrentDayVolume[0] || {},
      previousDayVolume: resultPreviousDayVolume[0] || {},
      reserves: resultReserves[0] || 0n,
      totalSupply: resultTotalSupply[0]?.total_supply || 0n,
      userSupply: resultUserSupply[0]?.supply || 0n,
    });

    return result;
  }

  @Query(() => [PoolEventObject])
  async allPools(): Promise<PoolEventObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (pool_id) reserved1, reserved2, p.id as address,
        p.token1, p.token2, p.decimal1, p.decimal2, p.symbol1, p.symbol2 
      FROM pool_event AS pe
      JOIN pool AS p ON pe.pool_id = p.id
      WHERE pe.type = 'Sync'
      ORDER BY pool_id ASC, timestamp DESC
    `;
    const result = await manager.query(query);
    return result;
  }

  @Query(() => PoolVolumeObject)
  async poolVolume(
    @Arg('address') address: string,
    @Arg('fromTime') fromTime: string,
    @Arg('toTime') toTime: string
  ): Promise<PoolVolumeObject> {
    const manager = await this.tx();

    const query = `
      SELECT SUM(amount1) AS sum_amount1, SUM(amount2) AS sum_amount2
      FROM pool_hour_volume
      WHERE pool_id = $1 AND timeframe >= $2 AND timeframe < $3;
    `;
    const resultQuery = await manager.query(query, [address, fromTime, toTime]);
    
    const result =  new PoolVolumeObject({
      amount1: resultQuery[0].sum_amount1 || 0n,
      amount2: resultQuery[0].sum_amount2 || 0n
    });

    return result;    
  }

  @Query(() => PoolFeeObject)
  async poolFee(
    @Arg('address') address: string,
    @Arg('fromTime') fromTime: string,
  ): Promise<PoolFeeObject> {
    const manager = await this.tx();

    const query = `
      SELECT SUM(amount1) AS sum_fee1, SUM(amount2) AS sum_fee2
      FROM pool_hour_volume
      WHERE pool_id = $1 AND timeframe >= $2;
    `;
    const resultQuery = await manager.query(query, [address, fromTime]);
    
    const result =  new PoolFeeObject({
      fee1: resultQuery[0].sum_fee1 || 0n,
      fee2: resultQuery[0].sum_fee2 || 0n
    });

    return result;    
  }

  @Query(() => [PoolCandlestickObject])
  async poolLastCandlestick(
    @Arg('address') address: string,
    @Arg('whichToken') whichToken: number,
    @Arg('fromTime') fromTime: string,
  ): Promise<PoolCandlestickObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (timeframe) pool_id, timeframe, close1, close2, high1, high2, low1, low2,
        open1, open2, which_token, pool.token1, pool.token2
      FROM pool_day_candlestick AS pc
        INNER JOIN pool ON pc.pool_id = pool.id
      WHERE pool.id = $1 AND which_token = $2 AND timeframe <= $3
      ORDER BY timeframe DESC
      LIMIT 1;
    `;
    const resultQuery = await manager.query(query, [address, whichToken, fromTime]);
    
    return resultQuery;
  }

  @Query(() => [PoolCandlestickObject])
  async poolTimeCandlestick(
    @Arg('address') address: string,
    @Arg('whichToken') whichToken: number,
    @Arg('fromTime') fromTime: string,
    @Arg('time') time: string,
  ): Promise<PoolCandlestickObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (timeframe) pool_id, timeframe, close1, close2, high1, high2, low1, low2,
        open1, open2, which_token, pool.token1, pool.token2
      FROM pool_{time}_candlestick AS pc
        INNER JOIN pool ON pc.pool_id = pool.id
      WHERE pool.id = $1 AND which_token = $2 AND timeframe >= $3
      ORDER BY timeframe ASC
      LIMIT 1;
    `;
    const resultQuery = await manager.query(query.replace('{time}', time.toLowerCase()), [address, whichToken, fromTime]);
    
    return resultQuery;
  }

  @Query(() => [PoolFeeObject])
  async poolTimeFees(
    @Arg('address') address: string,
    @Arg('fromTime') fromTime: string,
    @Arg('time') time: string,
  ): Promise<PoolFeeObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (timeframe) fee1, fee2, timeframe
      FROM pool_{time}_fee
      WHERE pool_id = $1 AND timeframe >= $2
      ORDER BY timeframe ASC;
    `;
    const resultQuery = await manager.query(query.replace('{time}', time.toLowerCase()), [address, fromTime]);
  
    return resultQuery;    
  }

  @Query(() => [PoolSupplyObject])
  async poolTimeSupply(
    @Arg('address') address: string,
    @Arg('fromTime') fromTime: string,
    @Arg('time') time: string,
  ): Promise<PoolSupplyObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (timeframe) total_supply, timeframe
      FROM pool_{time}_supply
      WHERE pool_id = $1 AND timeframe >= $2
      ORDER BY timeframe ASC;
    `;
    const resultQuery = await manager.query(query.replace('{time}', time.toLowerCase()), [address, fromTime]);

    return resultQuery;
  }
}

export {
  PoolListsResolver
}