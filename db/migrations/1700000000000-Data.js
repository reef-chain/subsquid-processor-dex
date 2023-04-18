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
                supply numeric,
                total_supply numeric
            )
            AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    p.pool_id,
                    p.timeframe,
                    p.supply,
        	        LAST_VALUE(p.total_supply) OVER w
                FROM pool_prepare_supply_data(duration) as p
                WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe, p.pool_id);
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
                SUM(p.amount1) OVER w,
                SUM(p.amount2) OVER w
            FROM pool_prepare_volume_data(duration) AS p
            WINDOW w AS (PARTITION BY p.timeframe, p.pool_id ORDER BY p.timeframe);
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
                fee2 numeric
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
                timeframe timestamptz,
                fee1 numeric,
                fee2 numeric
            )
            AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    p.pool_id,
                    p.timeframe,
                    SUM(p.fee1) OVER w,
                    SUM(p.fee2) OVER w
                FROM pool_prepare_fee_data(duration) AS p
                WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe);
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

        // Function applies date trunc over timestamp, which we can use in window functions
        await db.query(`
            CREATE FUNCTION candlestick_prepare (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                token TEXT,
                open NUMERIC,
                high NUMERIC,
                low NUMERIC,
                close NUMERIC,
                timeframe TIMESTAMPTZ,
                timeframe_org TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT 
                c.id,
                c.token,
                c.open,
                c.high,
                c.low,
                c.close,
                date_trunc(duration, c.timestamp),
                c.timestamp
                FROM candlestick AS c;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Applying window function over candlestick_prepare function extracting open, high, low, close
        await db.query(`
            CREATE FUNCTION candlestick_window (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                token TEXT, 
                open NUMERIC,
                high NUMERIC,
                low NUMERIC,
                close NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT DISTINCT ON (c.pool_id, c.token, c.timeframe)
                c.pool_id,
                c.token,
                FIRST_VALUE(c.open) OVER w,
                MAX(c.high) OVER w,
                MIN(c.low) OVER w,
                LAST_VALUE(c.close) OVER w,
                c.timeframe
                FROM candlestick_prepare(duration) AS c
                WINDOW w AS (PARTITION BY c.pool_id, c.token, c.timeframe ORDER BY c.timeframe_org)
                ORDER BY c.pool_id, c.token, c.timeframe, c.timeframe_org DESC;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Pool candlestick views
        await db.query(`CREATE VIEW candlestick_min AS SELECT * FROM candlestick_window('minute')`)
        await db.query(`CREATE VIEW candlestick_hour AS SELECT * FROM candlestick_window('hour')`)
        await db.query(`CREATE VIEW candlestick_day AS SELECT * FROM candlestick_window('day')`)
        await db.query(`CREATE VIEW candlestick_week AS SELECT * FROM candlestick_window('week')`)

        // Function applies date trunc over timestamp, which we can use in window functions
        await db.query(`
            CREATE FUNCTION volume_prepare_raw (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                volume1 NUMERIC,
                volume2 NUMERIC,
                timeframe TIMESTAMPTZ,
                timeframe_org TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT 
                    v.pool_id,
                    v.volume1,
                    v.volume2,
                    date_trunc(duration, v.timestamp),
                    v.timestamp
                FROM volume_raw AS v;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Volume is calculated as sum of volume1 and volume2
        await db.query(`
            CREATE FUNCTION volume_window_raw (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                volume1 NUMERIC,
                volume2 NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
            SELECT DISTINCT ON (v.pool_id, v.timeframe)
                v.pool_id,
                SUM(v.volume1) OVER w,
                SUM(v.volume2) OVER w,
                v.timeframe
                FROM volume_prepare_raw(duration) AS v
                WINDOW w AS (PARTITION BY v.pool_id, v.timeframe)
                ORDER BY v.pool_id, v.timeframe, v.timeframe_org DESC;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Volume raw views
        await db.query(`CREATE VIEW volume_raw_min AS SELECT * FROM volume_window_raw('minute')`)
        await db.query(`CREATE VIEW volume_raw_hour AS SELECT * FROM volume_window_raw('hour')`)
        await db.query(`CREATE VIEW volume_raw_day AS SELECT * FROM volume_window_raw('day')`)
        await db.query(`CREATE VIEW volume_raw_week AS SELECT * FROM volume_window_raw('week')`)

        // Function applies date trunc over timestamp, which we can use in window functions
        await db.query(`
            CREATE FUNCTION reserved_prepare_raw (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                reserved1 NUMERIC,
                reserved2 NUMERIC,
                timeframe TIMESTAMPTZ,
                timeframe_org TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT 
                r.pool_id,
                r.reserved1,
                r.reserved2,
                date_trunc(duration, r.timestamp),
                r.timestamp
                FROM reserved_raw AS r;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Applying window function over reserved_prepare_raw function last reserved values are used as reserve
        await db.query(`
            CREATE FUNCTION reserved_window_raw (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                reserved1 NUMERIC,
                reserved2 NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
            SELECT DISTINCT ON (r.pool_id, r.timeframe)
                r.pool_id,
                LAST_VALUE(r.reserved1) OVER w,
                LAST_VALUE(r.reserved2) OVER w,
                r.timeframe
                FROM reserved_prepare_raw(duration) AS r
                WINDOW w AS (PARTITION BY r.pool_id, r.timeframe ORDER BY r.timeframe_org)
                ORDER BY r.pool_id, r.timeframe, r.timeframe_org DESC;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Reserved raw views
        await db.query(`CREATE VIEW reserved_raw_min AS SELECT * FROM reserved_window_raw('minute')`)
        await db.query(`CREATE VIEW reserved_raw_hour AS SELECT * FROM reserved_window_raw('hour')`)
        await db.query(`CREATE VIEW reserved_raw_day AS SELECT * FROM reserved_window_raw('day')`)
        await db.query(`CREATE VIEW reserved_raw_week AS SELECT * FROM reserved_window_raw('week')`)

        // Function applies date trunc over timestamp, which we can use in window functions
        await db.query(`
            CREATE FUNCTION token_price_prepare (duration text)
            RETURNS TABLE (
                token TEXT,
                price NUMERIC,
                timeframe TIMESTAMPTZ,
                timeframe_org TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT 
                p.token,
                p.price,
                date_trunc(duration, p.timestamp),
                p.timestamp
                FROM token_price AS p;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Applying window function over price_prepare function. Price is calculated as last price in pool
        await db.query(`
            CREATE FUNCTION token_price_window (duration text)
            RETURNS TABLE (
                token TEXT,
                price NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
            SELECT DISTINCT ON (p.token, p.timeframe)
                p.token,
                LAST_VALUE(p.price) OVER w,
                p.timeframe
            FROM token_price_prepare(duration) AS p
            WINDOW w AS (PARTITION BY p.token, p.timeframe ORDER BY p.timeframe_org)
            ORDER BY p.token, p.timeframe, p.timeframe_org DESC;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Token price views
        await db.query(`CREATE VIEW token_price_min AS SELECT * FROM token_price_window('minute')`)
        await db.query(`CREATE VIEW token_price_hour AS SELECT * FROM token_price_window('hour')`)
        await db.query(`CREATE VIEW token_price_day AS SELECT * FROM token_price_window('day')`)
        await db.query(`CREATE VIEW token_price_week AS SELECT * FROM token_price_window('week')`)

        // Calling volume window raw and multiplying volumes by 0.3% to get a fee
        await db.query(`
            CREATE VIEW fee_raw AS 
            SELECT
                pool_id,
                block_height,
                volume1 * 0.0003 AS fee1,
                volume2 * 0.0003 AS fee2,
                timestamp
            FROM volume_raw;
        `)

        await db.query(`
            CREATE FUNCTION fee_prepare_raw (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                fee1 NUMERIC,
                fee2 NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT 
                f.pool_id,
                f.fee1,
                f.fee2,
                date_trunc(duration, f.timestamp)
                FROM fee_raw as f;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        await db.query(`
            CREATE FUNCTION fee_window_raw (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                fee1 NUMERIC,
                fee2 NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT DISTINCT ON (f.pool_id, f.timeframe)
                f.pool_id,
                SUM(f.fee1) OVER w,
                SUM(f.fee2) OVER w,
                f.timeframe
                FROM fee_prepare_raw(duration) AS f
                WINDOW w AS (PARTITION BY f.pool_id, f.timeframe);
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Fee raw views
        await db.query(`CREATE VIEW fee_raw_min AS SELECT * FROM fee_window_raw('minute')`)
        await db.query(`CREATE VIEW fee_raw_hour AS SELECT * FROM fee_window_raw('hour')`)
        await db.query(`CREATE VIEW fee_raw_day AS SELECT * FROM fee_window_raw('day')`)
        await db.query(`CREATE VIEW fee_raw_week AS SELECT * FROM fee_window_raw('week')`)

        // Pool volume combined with price for each pool and block
        await db.query(`
            CREATE VIEW volume AS
            SELECT 
                vl.block_height,
                vl.pool_id,
                vl.timestamp,
                vl.volume1 * tp1.price + vl.volume2 * tp2.price AS volume
            FROM volume_raw AS vl
            JOIN pool AS p ON 
                vl.pool_id = p.id
            JOIN token_price as tp1 ON 
                p.token1 = tp1.token AND
                vl.block_height = tp1.block_height
            JOIN token_price as tp2 ON
                p.token2 = tp2.token AND
                vl.block_height = tp2.block_height;
        `)

        // Preparing pool volume for window aggregation through date trunc
        await db.query(`
            CREATE FUNCTION volume_prepare (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                volume NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
            SELECT 
                v.pool_id,
                v.volume,
                date_trunc(duration, v.timestamp)
            FROM volume AS v;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Applying window function over pool_volume_prepare function and summing volume
        await db.query(`
            CREATE FUNCTION volume_window (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                volume NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT DISTINCT ON (p.pool_id, p.timeframe)
                p.pool_id,
                SUM(p.volume) OVER w,
                p.timeframe
                FROM volume_prepare(duration) AS p
                WINDOW w AS (PARTITION BY p.pool_id, p.timeframe);
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Pool volume views
        await db.query(`CREATE VIEW volume_min AS SELECT * FROM volume_window('minute')`)
        await db.query(`CREATE VIEW volume_hour AS SELECT * FROM volume_window('hour')`)
        await db.query(`CREATE VIEW volume_day AS SELECT * FROM volume_window('day')`)
        await db.query(`CREATE VIEW volume_week AS SELECT * FROM volume_window('week')`)

        // Pool reserved supply combined with price for each pool and block
        await db.query(`
            CREATE VIEW reserved AS
            SELECT 
                l.block_height,
                l.pool_id,
                l.timestamp,
                l.reserved1 * tp1.price + l.reserved2 * tp2.price AS reserved
            FROM reserved_raw as l
            JOIN pool as p ON
                l.pool_id = p.id
            JOIN token_price as tp1 ON
                p.token1 = tp1.token AND
                l.block_height = tp1.block_height
            JOIN token_price as tp2 ON
                p.token2 = tp2.token AND
                l.block_height = tp2.block_height;
        `)

        // Preparing pool reserved supply for window aggregation through date trunc
        await db.query(`
            CREATE FUNCTION reserved_prepare (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                reserved NUMERIC,
                timeframe TIMESTAMPTZ,
                timeframe_org TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT 
                r.pool_id,
                r.reserved,
                date_trunc(duration, r.timestamp),
                r.timestamp
                FROM reserved AS r
                ORDER BY timestamp;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Applying window function over pool_reserved_prepare function and summing reserved
        await db.query(`
            CREATE FUNCTION reserved_window (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                reserved NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT DISTINCT ON (p.pool_id, p.timeframe)
                p.pool_id,
                LAST_VALUE(p.reserved) OVER w,
                p.timeframe
                FROM reserved_prepare(duration) AS p
                WINDOW w AS (PARTITION BY p.pool_id, p.timeframe ORDER BY p.timeframe_org)
                ORDER BY p.pool_id, p.timeframe, p.timeframe_org DESC;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Reserved views
        await db.query(`CREATE VIEW reserved_min AS SELECT * FROM reserved_window('minute')`)
        await db.query(`CREATE VIEW reserved_hour AS SELECT * FROM reserved_window('hour')`)
        await db.query(`CREATE VIEW reserved_day AS SELECT * FROM reserved_window('day')`)
        await db.query(`CREATE VIEW reserved_week AS SELECT * FROM reserved_window('week')`)

        // Pool fees combined with price for each pool and block
        await db.query(`
            CREATE VIEW fee AS
            SELECT 
                f.block_height,
                f.pool_id,
                f.timestamp,
                f.fee1 * tp1.price + f.fee2 * tp2.price AS fee
            FROM fee_raw as f
            JOIN pool as p ON
                f.pool_id = p.id
            JOIN token_price as tp1 ON
                p.token1 = tp1.token AND
                f.block_height = tp1.block_height
            JOIN token_price as tp2 ON
                p.token2 = tp2.token AND
                f.block_height = tp2.block_height;
        `)

        // Preparing pool fees for window aggregation through date trunc
        await db.query(`
            CREATE FUNCTION fee_prepare (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                fee NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
                SELECT 
                f.pool_id,
                f.fee,
                date_trunc(duration, f.timestamp)
                FROM fee AS f
                ORDER BY timestamp;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Applying window function over pool_fee_prepare function and summing fee
        await db.query(`
            CREATE FUNCTION fee_window (duration text)
            RETURNS TABLE (
                pool_id VARCHAR,
                fee NUMERIC,
                timeframe TIMESTAMPTZ
            ) AS $$
            BEGIN RETURN QUERY
            SELECT DISTINCT ON (p.pool_id, p.timeframe)
                p.pool_id,
                SUM(p.fee) OVER w,
                p.timeframe
            FROM fee_prepare(duration) AS p
            WINDOW w AS (PARTITION BY p.pool_id, p.timeframe);
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Fee views
        await db.query(`CREATE VIEW fee_min AS SELECT * FROM fee_window('minute')`)
        await db.query(`CREATE VIEW fee_hour AS SELECT * FROM fee_window('hour')`)
        await db.query(`CREATE VIEW fee_day AS SELECT * FROM fee_window('day')`)
        await db.query(`CREATE VIEW fee_week AS SELECT * FROM fee_window('week')`)

        // Calculating change between current and previous value
        await db.query(`
            CREATE FUNCTION change (currentAmount NUMERIC, previousAmount NUMERIC)
            RETURNS NUMERIC AS $$
            BEGIN RETURN
                CASE
                WHEN (previousAmount = 0 OR previousAmount IS NULL) AND currentAmount = 0 
                    THEN 0
                WHEN (previousAmount = 0 OR previousAmount IS NULL)
                    THEN 100
                ELSE (currentAmount - previousAmount) / previousAmount * 100
                END;
            END; $$ 
            LANGUAGE plpgsql;
        `)

        // Volume change for each pool and block
        await db.query(`
            CREATE VIEW volume_change AS
            SELECT
                curr.block_height,
                curr.pool_id,
                curr.timestamp,
                change(curr.volume, prev.volume) AS change
            FROM volume AS curr
            INNER JOIN volume AS prev ON
                curr.pool_id = prev.pool_id AND
                curr.block_height = prev.block_height + 1;
        `)

        // Minute volume change for each pool and timestamp
        await db.query(`
            CREATE VIEW volume_change_min AS 
            SELECT DISTINCT ON (pool_id, timeframe)
                pool_id,
                timeframe,
                change(volume, LAG(volume) OVER (PARTITION BY pool_id ORDER BY timeframe)) AS change
            FROM volume_min;
        `)

        // Hour volume change for each pool and timestamp
        await db.query(`
            CREATE VIEW volume_change_hour AS 
            SELECT DISTINCT ON (pool_id, timeframe)
                pool_id,
                timeframe,
                change(volume, LAG(volume) OVER (PARTITION BY pool_id ORDER BY timeframe)) AS change
            FROM volume_hour;
        `)

        // Day volume change for each pool and timestamp
        await db.query(`
            CREATE VIEW volume_change_day AS
            SELECT DISTINCT ON (pool_id, timeframe)
                pool_id,
                timeframe,
                change(volume, LAG(volume) OVER (PARTITION BY pool_id ORDER BY timeframe)) AS change
            FROM volume_day;
        `)

        // Week volume change for each pool and timestamp
        await db.query(`
            CREATE VIEW volume_change_week AS
            SELECT DISTINCT ON (pool_id, timeframe)
                pool_id,
                timeframe,
                change(volume, LAG(volume) OVER (PARTITION BY pool_id ORDER BY timeframe)) AS change
            FROM volume_week;
        `)
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
        await db.query(`DROP FUNCTION candlestick_prepare`)
        await db.query(`DROP FUNCTION candlestick_window`)
        await db.query(`DROP VIEW candlestick_min`)
        await db.query(`DROP VIEW candlestick_hour`)
        await db.query(`DROP VIEW candlestick_day`)
        await db.query(`DROP VIEW candlestick_week`)
        await db.query(`DROP FUNCTION volume_prepare_raw`)
        await db.query(`DROP FUNCTION volume_window_raw`)
        await db.query(`DROP VIEW volume_raw_min`)
        await db.query(`DROP VIEW volume_raw_hour`)
        await db.query(`DROP VIEW volume_raw_day`)
        await db.query(`DROP VIEW volume_raw_week`)
        await db.query(`DROP FUNCTION reserved_prepare_raw`)
        await db.query(`DROP FUNCTION reserved_window_raw`)
        await db.query(`DROP VIEW reserved_raw_min`)
        await db.query(`DROP VIEW reserved_raw_hour`)
        await db.query(`DROP VIEW reserved_raw_day`)
        await db.query(`DROP VIEW reserved_raw_week`)
        await db.query(`DROP FUNCTION token_price_prepare`)
        await db.query(`DROP FUNCTION token_price_window`)
        await db.query(`DROP VIEW token_price_min`)
        await db.query(`DROP VIEW token_price_hour`)
        await db.query(`DROP VIEW token_price_day`)
        await db.query(`DROP VIEW token_price_week`)
        await db.query(`DROP VIEW fee_raw`)
        await db.query(`DROP FUNCTION fee_prepare_raw`)
        await db.query(`DROP FUNCTION fee_window_raw`)
        await db.query(`DROP VIEW fee_raw_min`)
        await db.query(`DROP VIEW fee_raw_hour`)
        await db.query(`DROP VIEW fee_raw_day`)
        await db.query(`DROP VIEW fee_raw_week`)
        await db.query(`DROP VIEW volume`)
        await db.query(`DROP FUNCTION volume_prepare`)
        await db.query(`DROP FUNCTION volume_window`)
        await db.query(`DROP VIEW volume_min`)
        await db.query(`DROP VIEW volume_hour`)
        await db.query(`DROP VIEW volume_day`)
        await db.query(`DROP VIEW volume_week`)
        await db.query(`DROP VIEW reserved`)
        await db.query(`DROP FUNCTION reserved_prepare`)
        await db.query(`DROP FUNCTION reserved_window`)
        await db.query(`DROP VIEW reserved_min`)
        await db.query(`DROP VIEW reserved_hour`)
        await db.query(`DROP VIEW reserved_day`)
        await db.query(`DROP VIEW reserved_week`)
        await db.query(`DROP VIEW fee`)
        await db.query(`DROP FUNCTION fee_prepare`)
        await db.query(`DROP FUNCTION fee_window`)
        await db.query(`DROP VIEW fee_min`)
        await db.query(`DROP VIEW fee_hour`)
        await db.query(`DROP VIEW fee_day`)
        await db.query(`DROP VIEW fee_week`)
        await db.query(`DROP FUNCTION change`)
        await db.query(`DROP VIEW volume_change`)
        await db.query(`DROP VIEW volume_change_min`)
        await db.query(`DROP VIEW volume_change_hour`)
        await db.query(`DROP VIEW volume_change_day`)
        await db.query(`DROP VIEW volume_change_week`)
    }
}
