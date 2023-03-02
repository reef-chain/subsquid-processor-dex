import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Pool} from "./pool.model"
import {PoolType} from "./_poolType"

@Entity_()
export class PoolEvent {
    constructor(props?: Partial<PoolEvent>) {
        Object.assign(this, props)
    }

    /**
     * <evmEventId>
     */
    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Pool, {nullable: true})
    pool!: Pool

    @Index_()
    @Column_("text", {nullable: true})
    toAddress!: string | undefined | null

    @Index_()
    @Column_("text", {nullable: true})
    senderAddress!: string | undefined | null

    @Index_()
    @Column_("varchar", {length: 8, nullable: false})
    type!: PoolType

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amount1!: bigint | undefined | null

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amount2!: bigint | undefined | null

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amountIn1!: bigint | undefined | null

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amountIn2!: bigint | undefined | null

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    reserved1!: bigint | undefined | null

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    reserved2!: bigint | undefined | null

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    supply!: bigint | undefined | null

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    totalSupply!: bigint | undefined | null

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
