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
                ratio_1 decimal,
                ratio_2 decimal,
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
                low_1 decimal,
                high_1 decimal,
                open_1 decimal,
                close_1 decimal,
                low_2 decimal,
                high_2 decimal,
                open_2 decimal,
                close_2 decimal
            )
            AS $$
            BEGIN
                RETURN QUERY  
                SELECT
                    p.timeframe,
                    p.pool_id,
                    p.which_token,
                    MIN(p.ratio_1) OVER w,
                    MAX(p.ratio_1) OVER w,
                    FIRST_VALUE(p.ratio_1) OVER w,
                    LAST_VALUE(p.ratio_1) OVER w,
                    MIN(p.ratio_2) OVER w,
                    MAX(p.ratio_2) OVER w,
                    FIRST_VALUE(p.ratio_2) OVER w,
                    LAST_VALUE(p.ratio_2) OVER w
                FROM pool_ratio(duration) AS p
                WINDOW w AS (PARTITION BY p.pool_id, p.timeframe, p.which_token ORDER BY p.timeframe);
            end; $$
            LANGUAGE plpgsql;
        `)

        // Additional pools for minute, hour and day candlestick data
        await db.query(`CREATE VIEW pool_minute_candlestick AS SELECT * FROM pool_candlestick('minute')`)
        await db.query(`CREATE VIEW pool_hour_candlestick AS SELECT * FROM pool_candlestick('hour')`)
        await db.query(`CREATE VIEW pool_day_candlestick AS SELECT * FROM pool_candlestick('day')`)
    }

    async down(db) {
        await db.query(`DROP FUNCTION pool_ratio`)
        await db.query(`DROP FUNCTION pool_candlestick`)
        await db.query(`DROP VIEW pool_minute_candlestick`)
        await db.query(`DROP VIEW pool_hour_candlestick`)
        await db.query(`DROP VIEW pool_day_candlestick`)
    }
}
