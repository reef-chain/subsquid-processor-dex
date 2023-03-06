// This migration adds additional views for pool data
module.exports = class Data1700000000000 {
    name = 'Data1700000000000'

    // Additional pool ratio function, which calculates the ratio between buy and sell amount
    // It has an additional field (which_token) to indicate for which token ration was calculated
    async up(db) {
        await db.query(`
            CREATE FUNCTION pool_ratio (duration text)
            RETURNS TABLE (
                pool_id VARCHAR, 
                timeframe timestamptz,
                exact_time timestamptz,
                ratio1 decimal,
                ratio2 decimal,
                which_token int
            )
            as $$
            begin
                return query
                SELECT 
                pe.pool_id,
                date_trunc(duration, pe.timestamp),
                pe.timestamp,
                (
                    CASE 
                    WHEN pe.amount_in2 > 0
                    THEN (
                    pe.amount1 / POWER(10, pl.decimal1)::decimal
                    ) / (
                    pe.amount_in2 / POWER(10, pl.decimal2)::decimal
                    )
                    ELSE -1
                    END
                ),
                (
                    CASE
                    WHEN pe.amount_in1 > 0
                    THEN (
                        pe.amount2 / POWER(10, pl.decimal2)::decimal
                    ) / (
                        pe.amount_in1 / POWER(10, pl.decimal1)::decimal
                    )
                    ELSE 1
                    END
                ),
                (
                    CASE
                    WHEN pe.amount_in2 > 0
                    THEN 1
                    ELSE 2
                    END
                ) 
                FROM pool_event as pe
                JOIN pool as pl
                ON pe.pool_id = pl.id
                WHERE pe.type = 'Swap'
                ORDER BY pe.timestamp;
            end; $$
            LANGUAGE plpgsql;
        `)
        
        // Pool candlestick using window 
        await db.query(`
            CREATE FUNCTION pool_candlestick (duration text)
            RETURNS TABLE (
                timeframe timestamptz,
                pool_id VARCHAR,
                which_token int,
                low1 decimal,
                high1 decimal,
                open1 decimal,
                close1 decimal,
                low2 decimal,
                high2 decimal,
                open2 decimal,
                close2 decimal
            )
            AS $$
            BEGIN
                RETURN QUERY  
                SELECT
                    p.timeframe,
                    p.pool_id,
                    p.which_token,
                    MIN(p.ratio1) OVER w,
                    MAX(p.ratio1) OVER w,
                    FIRST_VALUE(p.ratio1) OVER w,
                    LAST_VALUE(p.ratio1) OVER w,
                    MIN(p.ratio2) OVER w,
                    MAX(p.ratio2) OVER w,
                    FIRST_VALUE(p.ratio2) OVER w,
                    LAST_VALUE(p.ratio2) OVER w
                FROM pool_ratio(duration) AS p
                WINDOW w AS (PARTITION BY p.pool_id, p.timeframe, p.which_token ORDER BY p.timeframe);
            end; $$
            LANGUAGE plpgsql;
        `)

        // Additional pools for minute, hour and day candlestick data
        await db.query(`CREATE VIEW pool_minute_candlestick AS SELECT * FROM pool_candlestick('minute')`)
        await db.query(`CREATE VIEW pool_hour_candlestick AS SELECT * FROM pool_candlestick('hour')`)
        await db.query(`CREATE VIEW pool_day_candlestick AS SELECT * FROM pool_candlestick('day')`)

        // Pool supply data
        await db.query(`
            CREATE FUNCTION pool_prepare_supply_data (duration text)
            RETURNS TABLE (
                exact_time timestamptz,
                timeframe timestamptz,
                pool_id VARCHAR,
                total_supply numeric,
                supply numeric
            )
            AS $$
            BEGIN
            RETURN QUERY
            SELECT
                pe.timestamp,
                date_trunc(duration, pe.timestamp),
                pe.pool_id,
                pe.total_supply,
                pe.supply
            FROM pool_event as pe
            WHERE pe.type = 'Transfer'
            ORDER BY timestamp;
            end; $$
            LANGUAGE plpgsql;
        `)
        await db.query(`
            CREATE FUNCTION pool_supply (duration text) 
            RETURNS TABLE (
                pool_id VARCHAR,
                timeframe timestamptz,
                total_supply numeric,
                supply numeric
            )
            AS $$
            BEGIN
                RETURN QUERY
                SELECT
                p.pool_id,
                p.timeframe,
                (
                    SELECT DISTINCT ON (sub.timeframe)
                    sub.total_supply
                    FROM pool_prepare_supply_data(duration) as sub
                    WHERE MAX(p.exact_time) = sub.exact_time
                ),
                (
                    SELECT DISTINCT ON (sub.timeframe)
                    sub.supply
                    FROM pool_prepare_supply_data(duration) as sub
                    WHERE MAX(p.exact_time) = sub.exact_time
                )
                FROM pool_prepare_supply_data(duration) as p
                GROUP BY p.timeframe, p.pool_id
                ORDER BY p.timeframe;
            end; $$
            LANGUAGE plpgsql;
        `)

        // Pool supply views
        await db.query(`CREATE VIEW pool_minute_supply AS SELECT * FROM pool_supply('minute')`)
        await db.query(`CREATE VIEW pool_hour_supply AS SELECT * FROM pool_supply('hour')`)
        await db.query(`CREATE VIEW pool_day_supply AS SELECT * FROM pool_supply('day')`)

        // Pool volume data
        await db.query(`
            CREATE FUNCTION pool_prepare_volume_data (duration text)
            RETURNS TABLE (
                exact_time timestamptz,
                timeframe timestamptz,
                pool_id VARCHAR,
                amount1 numeric,
                amount2 numeric
            )
            AS $$
            BEGIN
            RETURN QUERY
            SELECT
                pe.timestamp,
                date_trunc(duration, pe.timestamp),
                pe.pool_id,
                pe.amount1,
                pe.amount2
            FROM pool_event as pe
            WHERE pe.type = 'Swap';
            end; $$
            LANGUAGE plpgsql;
        `)
        await db.query(`
            CREATE FUNCTION pool_volume (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                timeframe timestamptz,
                amount1 numeric,
                amount2 numeric
            )
            AS $$
            BEGIN
            RETURN QUERY
            SELECT
                p.pool_id,
                p.timeframe,
                SUM(p.amount1),
                SUM(p.amount2)
            FROM pool_prepare_volume_data(duration) as p
            GROUP BY p.pool_id, p.timeframe
            ORDER BY p.timeframe;
            end; $$
            LANGUAGE plpgsql;
        `)

        // Pool volume views
        await db.query(`CREATE VIEW pool_minute_volume AS SELECT * FROM pool_volume('minute')`)
        await db.query(`CREATE VIEW pool_hour_volume AS SELECT * FROM pool_volume('hour')`)
        await db.query(`CREATE VIEW pool_day_volume AS SELECT * FROM pool_volume('day')`)

        // Pool fees
        await db.query(`
            CREATE FUNCTION pool_prepare_fee_data (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                timeframe timestamptz,
                fee1 numeric,
                fee2 numeric,
                which_token int
            )
            AS $$
            BEGIN
            RETURN QUERY
            SELECT
                pe.pool_id,
                date_trunc(duration, pe.timestamp),
                (
                CASE
                    WHEN pe.amount_in1 > 0
                    THEN pe.amount_in1 * 0.003
                    ELSE 0
                END
                ),
                (
                CASE
                    WHEN pe.amount_in2 > 0
                    THEN pe.amount_in2 * 0.003
                    ELSE 0
                END
                ),
                (
                CASE
                    WHEN pe.amount_in1 > 0
                    THEN 1 -- Token 2 was bought 
                    ELSE 2 -- Token 1 was bought 
                END
                )
            FROM pool_event as pe
            WHERE pe.type = 'Swap';
            end; $$
            LANGUAGE plpgsql;
        `)
        await db.query(`
            CREATE FUNCTION pool_fee (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                which_token int,
                timeframe timestamptz,
                fee1 numeric,
                fee2 numeric
            )
            AS $$
            BEGIN
            RETURN QUERY
            SELECT
                org.pool_id,
                org.which_token,
                org.timeframe,
                SUM(org.fee1),
                SUM(org.fee2)
            FROM pool_prepare_fee_data(duration) as org
            GROUP BY org.pool_id, org.which_token, org.timeframe
            ORDER BY org.timeframe;
            end; $$
            LANGUAGE plpgsql;
        `)

        // Pool fee views
        await db.query(`CREATE VIEW pool_minute_fee AS SELECT * FROM pool_fee('minute')`)
        await db.query(`CREATE VIEW pool_hour_fee AS SELECT * FROM pool_fee('hour')`)
        await db.query(`CREATE VIEW pool_day_fee AS SELECT * FROM pool_fee('day')`)


        // Pool locked data
        await db.query(`
            CREATE FUNCTION pool_prepare_locked_data (duration text)
            RETURNS TABLE (
                exact_time timestamptz,
                timeframe timestamptz,
                pool_id VARCHAR,
                reserved1 numeric,
                reserved2 numeric
            )
            AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    pe.timestamp,
                    date_trunc(duration, pe.timestamp),
                    pe.pool_id,
                    pe.reserved1,
                    pe.reserved2
                FROM pool_event as pe
                WHERE pe.type = 'Sync';
            end; $$
            LANGUAGE plpgsql;
        `)
        await db.query(`
            CREATE FUNCTION pool_locked(
                duration text
            )
            RETURNS TABLE (
                pool_id VARCHAR,
                timeframe timestamptz,
                reserved1 numeric,
                reserved2 numeric
            )
            AS $$
            BEGIN
            RETURN QUERY
            SELECT
                p.pool_id,
                p.timeframe,
                SUM(p.reserved1),
                SUM(p.reserved2)
            FROM pool_prepare_locked_data(duration) as p
            GROUP BY p.pool_id, p.timeframe
            ORDER BY p.timeframe;
            end; $$
            LANGUAGE plpgsql;
        `)

        // Pool locked views
        await db.query(`CREATE VIEW pool_minute_locked AS SELECT * FROM pool_locked('minute')`)
        await db.query(`CREATE VIEW pool_hour_locked AS SELECT * FROM pool_locked('hour')`)
        await db.query(`CREATE VIEW pool_day_locked AS SELECT * FROM pool_locked('day')`)
    }

    async down(db) {
        await db.query(`DROP FUNCTION pool_ratio`)
        await db.query(`DROP FUNCTION pool_candlestick`)
        await db.query(`DROP VIEW pool_minute_candlestick`)
        await db.query(`DROP VIEW pool_hour_candlestick`)
        await db.query(`DROP VIEW pool_day_candlestick`)
        await db.query(`DROP FUNCTION pool_prepare_supply_data`)
        await db.query(`DROP FUNCTION pool_supply`)
        await db.query(`DROP VIEW pool_minute_supply`)
        await db.query(`DROP VIEW pool_hour_supply`)
        await db.query(`DROP VIEW pool_day_supply`)
        await db.query(`DROP FUNCTION pool_prepare_volume_data`)
        await db.query(`DROP FUNCTION pool_volume`)
        await db.query(`DROP VIEW pool_minute_volume`)
        await db.query(`DROP VIEW pool_hour_volume`)
        await db.query(`DROP VIEW pool_day_volume`)
        await db.query(`DROP FUNCTION pool_prepare_fee_data`)
        await db.query(`DROP FUNCTION pool_fee`)
        await db.query(`DROP VIEW pool_minute_fee`)
        await db.query(`DROP VIEW pool_hour_fee`)
        await db.query(`DROP VIEW pool_day_fee`)
        await db.query(`DROP FUNCTION pool_prepare_locked_data`)
        await db.query(`DROP FUNCTION pool_locked`)
        await db.query(`DROP VIEW pool_minute_locked`)
        await db.query(`DROP VIEW pool_hour_locked`)
        await db.query(`DROP VIEW pool_day_locked`)
    }
}
