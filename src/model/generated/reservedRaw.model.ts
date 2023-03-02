import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Pool} from "./pool.model"

@Index_(["blockId", "pool"], {unique: true})
@Entity_()
export class ReservedRaw {
    constructor(props?: Partial<ReservedRaw>) {
        Object.assign(this, props)
    }

    /**
     * <blockHeight>-<poolId>
     */
    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    blockId!: string

    @Column_("text", {nullable: true})
    eventId!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Pool, {nullable: true})
    pool!: Pool

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    reserved1!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    reserved2!: bigint

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
