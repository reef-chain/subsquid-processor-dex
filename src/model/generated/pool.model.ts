import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"

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
    @Column_("text", {nullable: false})
    token1!: string

    @Index_()
    @Column_("text", {nullable: false})
    token2!: string

    @Column_("int4", {nullable: false})
    poolDecimal!: number

    @Column_("int4", {nullable: false})
    decimal1!: number

    @Column_("int4", {nullable: false})
    decimal2!: number

    @Column_("text", {nullable: false})
    name1!: string

    @Column_("text", {nullable: false})
    name2!: string

    @Column_("text", {nullable: false})
    symbol1!: string

    @Column_("text", {nullable: false})
    symbol2!: string

    @Column_("bool", {nullable: true})
    approved1!: boolean | undefined | null

    @Column_("bool", {nullable: true})
    approved2!: boolean | undefined | null

    @Index_()
    @Column_("bool", {nullable: false})
    verified!: boolean
}
