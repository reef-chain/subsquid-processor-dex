// This migration adds additional views for pool data
module.exports = class Data1685343581086 {
    name = 'Data1685343581086'

    async up(db) {
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
            BEGIN RETURN QUERY
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
            BEGIN RETURN QUERY
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
            BEGIN RETURN QUERY
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
            BEGIN RETURN QUERY
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
            BEGIN RETURN QUERY
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
            BEGIN RETURN QUERY
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
    }

    async down(db) {
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
    }
}
