import { ethers } from "ethers";
import * as ss58 from "@subsquid/ss58";
import axios from "axios";

const TOKEN_CONTRACT_DATA_QUERY = `query TokenContractData($accountId: String!) {
    verifiedContractById(id: $accountId) {
      contractData
    }
  }
  `
const getContractDataQry = (accountId: string) => {
    return {
      query: TOKEN_CONTRACT_DATA_QUERY,
      variables: { accountId },
    };
  };

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

const convertIconUrl = (tokenUrl:string):string=>{
    const ipfsProtocol = "ipfs://";
    if (tokenUrl?.startsWith(ipfsProtocol)) {
      return `https://cloudflare-ipfs.com/ipfs/${tokenUrl.substring(ipfsProtocol.length)}`
    }
    return tokenUrl;
  }

export const getTokenIcon = async(address:string)=>{
    const requestBody  = {
        method: "post",
        url: process.env.EXPLORER_INDEXER,
        headers: {
          "Content-Type": "application/json",
        },
        data: getContractDataQry(address),
      };
      const response = await axios(requestBody);
      return convertIconUrl(response.data.data.verifiedContractById.contractData.iconUrl);
}

