import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_} from "typeorm"
import {Token} from "./token.model"

@Entity_()
export class Pool {
    constructor(props?: Partial<Pool>) {
        Object.assign(this, props)
    }

    /**
     * Address
     */
    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: true})
    evmEventId!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Token, {nullable: true})
    token1!: Token

    @Index_()
    @ManyToOne_(() => Token, {nullable: true})
    token2!: Token

    @Column_("int4", {nullable: false})
    decimals!: number

    @Index_()
    @Column_("bool", {nullable: false})
    verified!: boolean
}
