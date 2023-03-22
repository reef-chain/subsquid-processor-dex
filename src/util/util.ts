import { ethers } from "ethers";
import * as ss58 from "@subsquid/ss58";

export const REEF_CONTRACT_ADDRESS = '0x0000000000000000000000000000000001000000';

export const toChecksumAddress = (address: string): string => ethers.utils.getAddress(address.trim().toLowerCase());

export const hexToNativeAddress = (address: string | undefined): string => {
    if (!address) return '0x';
    try {
        const buffer = Buffer.from(address.split('0x')[1], "hex");
        return ss58.codec('substrate').encode(new Uint8Array(buffer));
    } catch (error) {
        console.error("Error converting hex value to native address:", error);
        return '0x';
    }
}