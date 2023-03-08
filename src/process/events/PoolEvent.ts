import { utils } from 'ethers';
import { ctx } from '../../processor';
import PoolEventBase from './PoolEventBase';
import { PoolEvent as PoolEventModel } from '../../model';
import { Pool, PoolType } from '../../model';
import { RawEventData } from '../../interfaces/interfaces';

export interface PoolEventData {
  poolId: string;
  blockHeight: number;
  eventId: string;
  timestamp: Date;
}

export interface PairEvent extends PoolEventData {
  rawData: RawEventData;
  topic0: string;
}

class PoolEvent extends PoolEventBase<utils.LogDescription> {
  // Needed
  poolId: string;

  blockHeight: number;

  timestamp: Date;

  type: PoolType;

  // Optional attributes for childe classes
  toAddress?: string;

  senderAddress?: string;

  amount1?: string;

  amount2?: string;

  amountIn1?: string;

  amountIn2?: string;

  reserved1?: string;

  reserved2?: string;

  supply?: string;

  totalSupply?: string;

  constructor(pairData: PoolEventData, type: PoolType) {
    super(pairData.eventId);
    this.type = type;
    this.poolId = pairData.poolId;
    this.blockHeight = pairData.blockHeight;
    this.timestamp = pairData.timestamp;
  }

  // Available for child classes before saving
  // eslint-disable-next-line
  async process(event: utils.LogDescription): Promise<void> { }

  // Saving pool event to database
  async save(): Promise<void> {
    const pool = await ctx.store.get(Pool, this.poolId);
    if (!pool) throw new Error(`Pool with id ${this.poolId} not found`);

    const poolEvent = new PoolEventModel({
      id: this.evmEventId,
      pool,
      toAddress: this.toAddress,
      senderAddress: this.senderAddress,
      type: this.type,
      amount1: BigInt(this.amount1 || '0'),
      amount2: BigInt(this.amount2 || '0'),
      amountIn1: BigInt(this.amountIn1 || '0'),
      amountIn2: BigInt(this.amountIn2 || '0'),
      reserved1: BigInt(this.reserved1 || '0'),
      reserved2: BigInt(this.reserved2 || '0'),
      supply: BigInt(this.supply || '0'),
      totalSupply: BigInt(this.totalSupply || '0'),
      timestamp: this.timestamp,
    });

    await ctx.store.save(poolEvent);
  }

  async combine(event: utils.LogDescription): Promise<void> {
    await this.process(event);
    await this.save();
  }
}

export default PoolEvent;
