import "reflect-metadata";
import { Arg, Field, Int, ObjectType, Query, Resolver } from 'type-graphql';
import { BigInteger, DateTime } from '@subsquid/graphql-server';
import type { EntityManager } from 'typeorm'
import { PoolListsResolver } from "./poolLists";
import { TokensResolver } from "./tokens";
import { PoolType } from "../../model";
import { REEF_CONTRACT_ADDRESS } from "../../util/util";
import { calculateTokenPrices } from "../../util/tokenPrices";
import { calculateTVL } from "../../util/poolTvl";

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
export class ReservesSimpleObject {
  @Field(() => String, { nullable: false })
  token1!: string;

  @Field(() => String, { nullable: false })
  token2!: string;

  @Field(() => BigInteger, { nullable: true })
  reserved1!: bigint;

  @Field(() => BigInteger, { nullable: true })
  reserved2!: bigint;

  constructor(props: Partial<ReservesSimpleObject>) {
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
export class PoolData {
  @Field(() => [FeeObject], { nullable: false })
  fee!: FeeObject[];

  @Field(() => [VolumeObject], { nullable: false })
  volume!: VolumeObject[];

  @Field(() => ReservesObject, { nullable: false })
  previousReserves!: ReservesObject;

  @Field(() => [ReservesObject], { nullable: false })
  allReserves!: ReservesObject[];

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
  decimals1!: number;

  @Field(() => Int, { nullable: false })
  decimals2!: number;

  @Field(() => String, { nullable: false })
  symbol1!: string;

  @Field(() => String, { nullable: false })
  symbol2!: string;

  @Field(() => String, { nullable: false })
  name1!: string;

  @Field(() => String, { nullable: false })
  name2!: string;

  @Field(() => String, { nullable: false })
  iconUrl1!: string;

  @Field(() => String, { nullable: false })
  iconUrl2!: string;

  @Field(() => BigInteger, { nullable: false })
  tvl!: bigint;


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

@ObjectType()
export class PoolPositionObject {
  @Field(() => String, { nullable: false })
  address!: string;

  @Field(() => Int, { nullable: false })
  decimals!: number;

  @Field(() => BigInteger, { nullable: false })
  reserved1!: bigint;

  @Field(() => BigInteger, { nullable: false })
  reserved2!: bigint;

  @Field(() => BigInteger, { nullable: false })
  totalSupply!: bigint;

  @Field(() => BigInteger, { nullable: false })
  userSupply!: bigint;

  constructor(props: Partial<PoolPositionObject>) {
    Object.assign(this, props);
  }
}

@ObjectType()
export class CountPoolEventsByUserObject {
  @Field(() => String, { nullable: false })
  address!: string;

  @Field(() => Int, { nullable: false })
  count!: number;

  constructor(props: Partial<CountPoolEventsByUserObject>) {
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
      SELECT DISTINCT ON (pool_id) pool.id, pool.token1_id as token1, pool.token2_id as token2, pool_event.reserved1, pool_event.reserved2
      FROM pool_event
      INNER JOIN pool ON pool_event.pool_id = pool.id
      WHERE pool_event.type = 'Sync' AND pool_event.timestamp < $1
      ORDER BY pool_id ASC, id DESC;
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
      SELECT DISTINCT ON (pool_id, timeframe) pool.id, pool.token1_id as token1, pool.token2_id as token2, pool_hour_volume.amount1, pool_hour_volume.amount2
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
    @Arg('fromTime') fromTime: string,
    @Arg('time') time: string,
  ): Promise<PoolData> {
    const manager = await this.tx();

    const queryFee = `
      SELECT DISTINCT ON (timeframe) fee1, fee2, timeframe
      FROM pool_{time}_fee
      WHERE pool_id = $1 AND timeframe >= $2
    `;
    let resultFee = await manager.query(queryFee.replace('{time}', time.toLowerCase()), [address, fromTime]);
    resultFee = resultFee.map((row: any) => {
      return new FeeObject({
        fee1: row.fee1,
        fee2: row.fee2,
        timeframe: row.timeframe,
      });
    });

    const queryVolume = `
      SELECT DISTINCT ON (timeframe) amount1, amount2, timeframe
      FROM pool_{time}_volume
      WHERE pool_id = $1 AND timeframe >= $2
    `;
    let resultVolume = await manager.query(queryVolume.replace('{time}', time.toLowerCase()), [address, fromTime]);
    resultVolume = resultVolume.map((row: any) => {
      return new VolumeObject({
        amount1: row.amount1,
        amount2: row.amount2,
        timeframe: row.timeframe,
      });
    });

    const queryPreviousReserves = `
      SELECT pe.reserved1, pe.reserved2, pe.timestamp as timeframe
      FROM pool_event pe
      WHERE pe.type = 'Sync' AND pe.pool_id = $1 AND pe.timestamp < $2
      ORDER BY timeframe DESC
      LIMIT 1
    `;
    const resultPreviousReserves = await manager.query(queryPreviousReserves.replace('{time}', time.toLowerCase()), [address, fromTime]);

    const queryAllReserves = `
      SELECT pe.reserved1, pe.reserved2, pe.timestamp as timeframe
      FROM pool_event pe
      WHERE pe.type = 'Sync' AND pe.pool_id = $1 AND pe.timestamp >= $2
      ORDER BY timeframe ASC
    `;
    const resultAllReserves = await manager.query(queryAllReserves.replace('{time}', time.toLowerCase()), [address, fromTime]);

    const result = new PoolData({
      fee: resultFee,
      volume: resultVolume,
      previousReserves: resultPreviousReserves[0] || {},
      allReserves: resultAllReserves,
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
      ORDER BY id DESC
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
      ORDER BY id DESC
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
      reserves: resultReserves[0] || new ReservesObject({reserved1: 0n, reserved2: 0n}),
      totalSupply: resultTotalSupply[0]?.total_supply || 0n,
      userSupply: resultUserSupply[0]?.supply || 0n,
    });

    return result;
  }

  @Query(() => [PoolEventObject])
  async allPools(): Promise<PoolEventObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (pool_id) reserved1, reserved2, p.id as address, t1.id as token1, t2.id as token2, 
        t1.decimals as decimals1, t2.decimals as decimals2, t1.symbol as symbol1, t2.symbol as symbol2, 
        t1.name as name1, t2.name as name2, t1.icon_url as icon_url1, t2.icon_url as icon_url2
      FROM pool_event AS pe
      JOIN pool AS p ON pe.pool_id = p.id
      JOIN token AS t1 ON p.token1_id = t1.id
      JOIN token AS t2 ON p.token2_id = t2.id
      WHERE pe.type = 'Sync'
      ORDER BY pool_id ASC, pe.id DESC
    `;
    let result = await manager.query(query);

    let tokenPrices = {
      [REEF_CONTRACT_ADDRESS]:0.001
    };

    calculateTokenPrices(result,tokenPrices)

    result = result.map((row: any) => {
      return new PoolEventObject({
        ...row,
        iconUrl1: row.icon_url1,
        iconUrl2: row.icon_url2,
        tvl:calculateTVL({
          reserved1:row.reserved1,
          reserved2:row.reserved2,
          decimals1:row.decimals1,
          decimals2:row.decimals2,
          token1:row.token1,
          token2:row.token2,
        },tokenPrices) ??0
      });
    });

    result.sort((a: PoolEventObject, b: PoolEventObject) => {
      const tvlA = parseFloat(a.tvl.toString().replace(/,/g, ''));
      const tvlB = parseFloat(b.tvl.toString().replace(/,/g, ''));
      return tvlB - tvlA;
    });

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
    
    const result = new PoolFeeObject({
      fee1: resultQuery[0].sum_fee1 || 0n,
      fee2: resultQuery[0].sum_fee2 || 0n
    });

    return result;    
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
    let resultQuery = await manager.query(query.replace('{time}', time.toLowerCase()), [address, fromTime]);
    resultQuery = resultQuery.map((row: any) => {
      return new PoolSupplyObject({
        totalSupply: row.total_supply,
        timeframe: row.timeframe,
      });
    });

    return resultQuery;
  }

  @Query(() => PoolPositionObject)
  async userPoolSupply(
    @Arg('token1') token1: string,
    @Arg('token2') token2: string,
    @Arg('signerAddress') signerAddress: string,
  ): Promise<PoolPositionObject> {
    const manager = await this.tx();

    const swapOrder = token1 > token2;
    const [firstToken, secondToken] = swapOrder ? [token2, token1] : [token1, token2];
    
    const queryPool = `
      SELECT id, decimals
      FROM pool
      WHERE token1_id = $1 AND token2_id = $2
      LIMIT 1
    `;
    const resultPool = await manager.query(queryPool, [firstToken, secondToken]);
    if (!resultPool.length) {
      return new PoolPositionObject({
        address: '0x0000000000000000000000000000000000000000',
        decimals: 0,
        reserved1: 0n,
        reserved2: 0n,
        totalSupply: 0n,
        userSupply: 0n,
      });
    }

    const queryReserves = `
      SELECT reserved1, reserved2
      FROM pool_event
      WHERE pool_id = $1 AND type = 'Sync'
      ORDER BY id DESC
      LIMIT 1
    `;
    const resultReserves = await manager.query(queryReserves, [resultPool[0].id]);
    const resultReserves1 = resultReserves.length ? resultReserves[0].reserved1: 0n;
    const resultReserves2 = resultReserves.length ? resultReserves[0].reserved2: 0n; 

    const queryTotalSupply = `
      SELECT total_supply
      FROM pool_event
      WHERE pool_id = $1 AND type = 'Transfer'
      ORDER BY id DESC
      LIMIT 1
    `;
    let resultTotalSupply = await manager.query(queryTotalSupply, [resultPool[0].id]);

    const queryUserSupply = `
      SELECT SUM(supply) AS supply
      FROM pool_event
      WHERE pool_id = $1 AND type = 'Transfer' AND signer_address = $2
    `;
    const resultUserSupply = await manager.query(queryUserSupply, [resultPool[0].id, signerAddress]);

    return new PoolPositionObject({
      address: resultPool[0].id,
      decimals: resultPool[0].decimals,
      reserved1: swapOrder ? resultReserves2 : resultReserves1,
      reserved2: swapOrder ? resultReserves1 : resultReserves2,
      totalSupply: resultTotalSupply[0]?.total_supply || 0n,
      userSupply: resultUserSupply[0]?.supply || 0n,
    });
  }

  @Query(() => [ReservesSimpleObject])
  async poolsReserves(
    @Arg('tokens', () => [String]) tokens: string[]
  ): Promise<ReservesSimpleObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT DISTINCT ON (pool_id) pool.id, pool.token1_id as token1, pool.token2_id as token2, pool_event.reserved1, pool_event.reserved2
      FROM pool_event
      INNER JOIN pool ON pool_event.pool_id = pool.id
      WHERE pool_event.type = 'Sync' AND pool.token1_id = ANY($1::text[]) AND pool.token2_id = ANY($1::text[])
      ORDER BY pool_id ASC, id DESC;
    `;
    let result = await manager.query(query, [tokens]);
    result = result.map((row: any) => {
      return new ReservesSimpleObject({
        token1: row.token1,
        token2: row.token2,
        reserved1: row.reserved1,
        reserved2: row.reserved2,
      });
    });

    return result;
  }

  @Query(() => [CountPoolEventsByUserObject])
  async countPoolEventsByUser(
    @Arg('poolEventType') poolEventType: PoolType,
    @Arg('fromTime') fromTime: string,
    @Arg('limit') limit: number,
  ): Promise<CountPoolEventsByUserObject[]> {
    const manager = await this.tx();

    const query = `
      SELECT signer_address, COUNT(*) AS swap_count
      FROM pool_event
      WHERE type = $1 AND timestamp >= $2
      GROUP BY signer_address
      ORDER BY swap_count DESC
      LIMIT $3;
    `;
    let result = await manager.query(query, [poolEventType, fromTime, limit]);
    result = result.map((row: any) => {
      return new CountPoolEventsByUserObject({
        address: row.signer_address,
        count: row.swap_count,
      });
    });

    return result;
  }
}

export {
  PoolListsResolver,
  TokensResolver
}