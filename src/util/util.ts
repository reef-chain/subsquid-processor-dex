import { ethers } from "ethers";
import { ERC20Data } from "../interfaces/interfaces";

export const REEF_CONTRACT_ADDRESS = '0x0000000000000000000000000000000001000000';
export const REEF_DEFAULT_DATA: ERC20Data = {
    decimals: 18,
    symbol: 'REEF',
    name: 'Reef',
};

export const toChecksumAddress = (address: string): string => ethers.utils.getAddress(address.trim().toLowerCase());
