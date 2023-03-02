import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Pool} from "./pool.model"

@Index_(["blockId", "pool", "token"], {unique: true})
@Entity_()
export class Candlestick {
    constructor(props?: Partial<Candlestick>) {
        Object.assign(this, props)
    }

    /**
     * <blockHeight>-<poolId>-<token>
     */
    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    blockId!: string

    @Index_()
    @ManyToOne_(() => Pool, {nullable: true})
    pool!: Pool

    @Column_("text", {nullable: false})
    token!: string

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    open!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    high!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    low!: BigDecimal

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    close!: BigDecimal

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
