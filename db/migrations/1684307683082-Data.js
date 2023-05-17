module.exports = class Data1684307683082 {
    name = 'Data1684307683082'

    async up(db) {
        await db.query(`ALTER TABLE "pool" ADD "approved1" boolean`)
        await db.query(`ALTER TABLE "pool" ADD "approved2" boolean`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "pool" DROP COLUMN "approved1"`)
        await db.query(`ALTER TABLE "pool" DROP COLUMN "approved2"`)
    }
}
