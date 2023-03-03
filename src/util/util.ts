import { ethers } from "ethers";

export const REEF_CONTRACT_ADDRESS = '0x0000000000000000000000000000000001000000';

export const toChecksumAddress = (address: string): string => ethers.utils.getAddress(address.trim().toLowerCase());
