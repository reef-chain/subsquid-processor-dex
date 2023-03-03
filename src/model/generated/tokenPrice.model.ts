import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Index_(["blockHeight", "token"], {unique: true})
@Entity_()
export class TokenPrice {
    constructor(props?: Partial<TokenPrice>) {
        Object.assign(this, props)
    }

    /**
     * <blockHeight>-<tokenAddress>
     */
    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    blockHeight!: number

    @Column_("text", {nullable: false})
    token!: string

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    price!: BigDecimal

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
