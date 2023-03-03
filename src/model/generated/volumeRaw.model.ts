import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Pool} from "./pool.model"

@Index_(["blockHeight", "pool"], {unique: true})
@Entity_()
export class VolumeRaw {
    constructor(props?: Partial<VolumeRaw>) {
        Object.assign(this, props)
    }

    /**
     * <blockHeight>-<poolId>
     */
    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    blockHeight!: number

    @Index_()
    @ManyToOne_(() => Pool, {nullable: true})
    pool!: Pool

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    volume1!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    volume2!: bigint

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
