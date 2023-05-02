// This migration adds additional views for pool data
module.exports = class Data1700000000002 {
    name = 'Data1700000000002'

    async up(db) {
        await db.query(`DROP VIEW pool_minute_locked`)
        await db.query(`DROP VIEW pool_hour_locked`)
        await db.query(`DROP VIEW pool_day_locked`)
        await db.query(`DROP FUNCTION pool_locked`)
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
            BEGIN RETURN QUERY
                SELECT
                    p.pool_id,
                    max_p.timeframe,
                    p.reserved1,
                    p.reserved2
                FROM 
                    pool_prepare_locked_data(duration) as p
                    INNER JOIN (
                        SELECT p2.pool_id, MAX(p2.timeframe) AS timeframe
                        FROM pool_prepare_locked_data(duration) as p2
                        GROUP BY p2.pool_id
                    ) AS max_p
                    ON p.pool_id = max_p.pool_id AND p.timeframe = max_p.timeframe
                ORDER BY p.pool_id;
            end; $$
            LANGUAGE plpgsql;
        `)
        await db.query(`CREATE VIEW pool_minute_locked AS SELECT * FROM pool_locked('minute')`)
        await db.query(`CREATE VIEW pool_hour_locked AS SELECT * FROM pool_locked('hour')`)
        await db.query(`CREATE VIEW pool_day_locked AS SELECT * FROM pool_locked('day')`)
    }

    async down(db) {
        await db.query(`DROP FUNCTION pool_locked`)
        await db.query(`DROP VIEW pool_minute_locked`)
        await db.query(`DROP VIEW pool_hour_locked`)
        await db.query(`DROP VIEW pool_day_locked`)
    }
}
