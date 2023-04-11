module.exports = class Data1681205959671 {
    name = 'Data1681205959671'

    async up(db) {
        await db.query(`ALTER TABLE "pool_event" DROP COLUMN "hash"`)
        await db.query(`ALTER TABLE "pool_event" ADD "block_height" integer NOT NULL`)
        await db.query(`ALTER TABLE "pool_event" ADD "index_in_block" integer NOT NULL`)
        await db.query(`CREATE INDEX "IDX_0606826978378661ed61b308e2" ON "pool_event" ("block_height") `)
    }

    async down(db) {
        await db.query(`ALTER TABLE "pool_event" ADD "hash" text`)
        await db.query(`ALTER TABLE "pool_event" DROP COLUMN "block_height"`)
        await db.query(`ALTER TABLE "pool_event" DROP COLUMN "index_in_block"`)
        await db.query(`DROP INDEX "public"."IDX_0606826978378661ed61b308e2"`)
    }
}
