import "reflect-metadata";
import { Arg, Field, ObjectType, Query, Resolver } from 'type-graphql';
import type { EntityManager } from 'typeorm'

const DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY = `
  SELECT {SELECT}
  FROM pool as p
  LEFT JOIN (
    SELECT 
      pool_id, 
      SUM(amount1) as day_volume1,
      SUM(amount2) as day_volume2
    FROM (
      SELECT DISTINCT ON (pool_id, timeframe)
        * 
      FROM pool_hour_volume
      WHERE timeframe > NOW() - INTERVAL '1 DAY'
    ) day_volume
    GROUP BY pool_id
  ) as dv ON p.id = dv.pool_id
  LEFT JOIN (
    SELECT 
      pool_id, 
      SUM(amount1) as prev_day_volume1,
      SUM(amount2) as prev_day_volume2
    FROM (
      SELECT DISTINCT ON (pool_id, timeframe)
        * 
      FROM pool_hour_volume
      WHERE
        timeframe < NOW() - INTERVAL '1 DAY' AND 
        timeframe > NOW() - INTERVAL '2 DAY'
    ) prev_day_volume
    GROUP BY pool_id
  ) as dl ON p.id = dl.pool_id
  {USER_JOIN} JOIN (
    SELECT 
      pe.pool_id, 
      SUM(pe.amount1) as user_locked_amount1, 
      SUM(pe.amount2) as user_locked_amount2
    FROM pool_event as pe
    WHERE 
      pe.signer_address ILIKE $1 AND 
      (pe.type = 'Mint' OR pe.type = 'Burn')
    GROUP BY pe.pool_id
  ) as ulp ON ulp.pool_id = p.id
  LEFT JOIN (
    SELECT DISTINCT ON (pool_id)
      pool_id,
      reserved1,
      reserved2
    FROM pool_event
    WHERE type = 'Sync'
    ORDER BY pool_id asc, timestamp desc
  ) as pr ON pr.pool_id = p.id
  JOIN token AS t1 ON p.token1_id = t1.id
  JOIN token AS t2 ON p.token2_id = t2.id
  WHERE p.verified = true {SEARCH}
  {PAGINATION}
`;

const SELECT_ITEMS = `
  p.id, t1.id as token1, t2.id as token2, t1.decimals as decimals1, t2.decimals as decimals2, 
  t1.name as name1, t2.name as name2, t1.symbol as symbol1, t2.symbol as symbol2,
  t1.icon_url as icon_url1, t2.icon_url as icon_url2,
  dv.day_volume1, dv.day_volume2, 
  dl.prev_day_volume1, dl.prev_day_volume2, 
  ulp.user_locked_amount1, ulp.user_locked_amount2,
  pr.reserved1, pr.reserved2
`;

const ADDITIONAL_SEARCH = `
    AND (
      p.id ILIKE $4 OR 
      p.token1_id ILIKE $4 OR 
      p.token2_id ILIKE $4 OR 
      t1.name ILIKE $4 OR
      t2.name ILIKE $4 OR
      t1.symbol ILIKE $4 OR
      t2.symbol ILIKE $4
    )
  `;

const COUNT_ITEMS = `
    COUNT(*)
`;

const PAGINATION = `
    LIMIT $2
    OFFSET $3
`;

@ObjectType()
export class VerifiedPoolsWithUserLP {
    @Field(() => String, { nullable: false })
    id!: string;

    @Field(() => String, { nullable: false })
    token1!: string;

    @Field(() => String, { nullable: false })
    token2!: string;

    @Field(() => String, { nullable: true })
    reserved1!: string;

    @Field(() => String, { nullable: true })
    reserved2!: string;

    @Field(() => Number, { nullable: false })
    decimals1!: number;

    @Field(() => Number, { nullable: false })
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

    @Field(() => String, { nullable: true })
    dayVolume1!: string | null;

    @Field(() => String, { nullable: true })
    dayVolume2!: string | null;

    @Field(() => String, { nullable: true })
    prevDayVolume1!: string | null;

    @Field(() => String, { nullable: true })
    prevDayVolume2!: string | null;

    @Field(() => String, { nullable: true })
    userLockedAmount1!: string | null;

    @Field(() => String, { nullable: true })
    userLockedAmount2!: string | null;

    constructor(props: Partial<VerifiedPoolsWithUserLP>) {
      Object.assign(this, props);
    }
}

@Resolver()
export class PoolListsResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Query(() => [VerifiedPoolsWithUserLP])
    async allPoolsList(
        @Arg('signerAddress') signerAddress: string,
        @Arg('limit') limit: number,
        @Arg('offset') offset: number,
        @Arg('search') search: string,
    ): Promise<VerifiedPoolsWithUserLP[]> {
        const manager = await this.tx();

        const query = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
            .replace('{USER_JOIN}', 'LEFT')
            .replace('{SELECT}', SELECT_ITEMS)
            .replace('{SEARCH}', search.trim() != "" ? ADDITIONAL_SEARCH : '')
            .replace('{PAGINATION}', PAGINATION);

        const queryResult = await manager.query(
            query, 
            search.trim() != "" ? [signerAddress, limit, offset, `${search}%`] : [signerAddress, limit, offset]
        );
        const result = queryResult.map((row: any) => {
          return new VerifiedPoolsWithUserLP({
              id: row.id,
              token1: row.token1,
              token2: row.token2,
              reserved1: row.reserved1,
              reserved2: row.reserved2,
              decimals1: row.decimals1,
              decimals2: row.decimals2,
              symbol1: row.symbol1,
              symbol2: row.symbol2,
              name1: row.name1,
              name2: row.name2,
              iconUrl1: row.icon_url1,
              iconUrl2: row.icon_url2,
              dayVolume1: row.day_volume1,
              dayVolume2: row.day_volume2,
              prevDayVolume1: row.prev_day_volume1,
              prevDayVolume2: row.prev_day_volume2,
              userLockedAmount1: row.user_locked_amount1,
              userLockedAmount2: row.user_locked_amount2,
          });
        });
        return result;
    }
  
    @Query(() => Number)
    async allPoolsListCount(
        @Arg('signerAddress') signerAddress: string,
        @Arg('search') search: string,
    ): Promise<number> {
        const manager = await this.tx();

        const query = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
            .replace('{USER_JOIN}', 'LEFT')
            .replace('{SELECT}', COUNT_ITEMS)
            .replace('{SEARCH}', search.trim() != "" ? ADDITIONAL_SEARCH : '')
            .replace('{PAGINATION}', '');

        const result = await manager.query(
            query, 
            search.trim() != "" ? [signerAddress, `${search}%`] : [signerAddress]
        );
        return result[0].count;
    }
    
    @Query(() => [VerifiedPoolsWithUserLP])
    async userPoolsList(
        @Arg('signerAddress') signerAddress: string,
        @Arg('limit') limit: number,
        @Arg('offset') offset: number,
        @Arg('search') search: string,
    ): Promise<VerifiedPoolsWithUserLP[]> {
        const manager = await this.tx();

        const query = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
            .replace('{USER_JOIN}', 'INNER')
            .replace('{SELECT}', SELECT_ITEMS)
            .replace('{SEARCH}', search ? ADDITIONAL_SEARCH : '')
            .replace('{PAGINATION}', PAGINATION);

        const queryResult = await manager.query(
            query,
            search.trim() != "" ? [signerAddress, limit, offset, `${search}%`] : [signerAddress, limit, offset]
        );
        const result = queryResult.map((row: any) => {
          return new VerifiedPoolsWithUserLP({
              id: row.id,
              token1: row.token1,
              token2: row.token2,
              reserved1: row.reserved1,
              reserved2: row.reserved2,
              decimals1: row.decimals1,
              decimals2: row.decimals2,
              symbol1: row.symbol1,
              symbol2: row.symbol2,
              name1: row.name1,
              name2: row.name2,
              iconUrl1: row.icon_url1,
              iconUrl2: row.icon_url2,
              dayVolume1: row.day_volume1,
              dayVolume2: row.day_volume2,
              prevDayVolume1: row.prev_day_volume1,
              prevDayVolume2: row.prev_day_volume2,
              userLockedAmount1: row.user_locked_amount1,
              userLockedAmount2: row.user_locked_amount2,
          });
        });
        return result;
    }
  
    @Query(() => Number)
    async userPoolsListCount(
        @Arg('signerAddress') signerAddress: string,
        @Arg('search') search: string,
    ): Promise<number> {
        const manager = await this.tx();

        const query = DEFAULT_VERIFIED_POOLS_WITH_USER_LP_QUERY
            .replace('{USER_JOIN}', 'INNER')
            .replace('{SELECT}', COUNT_ITEMS)
            .replace('{SEARCH}', search ? ADDITIONAL_SEARCH : '')
            .replace('{PAGINATION}', '');

        const result = await manager.query(
            query, 
            search.trim() != "" ? [signerAddress, `${search}%`] : [signerAddress]
        );
        return result[0].count;
    }
}