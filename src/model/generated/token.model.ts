import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"

@Entity_()
export class Token {
    constructor(props?: Partial<Token>) {
        Object.assign(this, props)
    }

    /**
     * Address
     */
    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    decimals!: number

    @Column_("text", {nullable: false})
    name!: string

    @Column_("text", {nullable: false})
    symbol!: string

    @Column_("bool", {nullable: true})
    approved!: boolean | undefined | null

    @Column_("text", {nullable: true})
    iconUrl!: string | undefined | null
}
