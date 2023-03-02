import { QualifiedName } from "@subsquid/substrate-processor"

export interface EventRaw {
    id: string
    name: QualifiedName
    args: RawEventData
    pos: number
    call?: Call
}

export interface Call {
    id: string
    name: QualifiedName
    args: any
    origin: CallOrigin
    pos: number
    success: boolean
    error?: any
}

export interface CallOrigin {
    __kind: string
    value: {__kind: string} & any
}

export interface RawEventData {
    address: string,
    topics:string[],
    data: string,
}

export interface ERC20Data {
    name: string;
    symbol: string;
    decimals: number;
}