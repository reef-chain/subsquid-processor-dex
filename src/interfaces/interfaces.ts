import { QualifiedName } from "@subsquid/substrate-processor"

export interface EventRaw {
    id: string
    name: QualifiedName
    args: RawEventData
    pos: number
}

export interface RawEventData {
    address: string,
    topics:string[],
    data: string,
}