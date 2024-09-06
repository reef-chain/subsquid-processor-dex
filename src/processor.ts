import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import { DataHandlerContext, SubstrateBatchProcessor } from "@subsquid/substrate-processor";
import { KnownArchives, lookupArchive } from "@subsquid/archive-registry";
import { ethers } from "ethers";
import * as ReefswapV2Factory from "./abi/ReefswapV2Factory";
import * as ReefswapV2Pair from "./abi/ReefswapV2Pair";
import FactoryEvent from "./process/events/FactoryEvent";
import { PairEvent } from "./process/events/PoolEvent";
import PoolEventBase from "./process/events/PoolEventBase";
import MintEvent from "./process/events/MintEvent";
import BurnEvent from "./process/events/BurnEvent";
import SwapEvent from "./process/events/SwapEvent";
import SyncEvent from "./process/events/SyncEvent";
import TransferEvent from "./process/events/TransferEvent";
import EmptyEvent from "./process/events/EmptyEvent";
import { verifyAll } from "./process/events/poolVerification";
import { Pool, PoolType } from "./model";
import { PoolEvent as PoolEventModel } from './model';
import { toChecksumAddress } from "./util/util";

const RPC_URL = process.env.NODE_RPC_WS;
const AQUARIUM_ARCHIVE_NAME = process.env.ARCHIVE_LOOKUP_NAME as KnownArchives;
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as string;
const USE_ONLY_RPC = process.env.USE_ONLY_RPC === 'true';
const ARCHIVE = USE_ONLY_RPC ? undefined : lookupArchive(AQUARIUM_ARCHIVE_NAME, { release: 'ArrowSquid' });
const START_BLOCK = parseInt(process.env.START_BLOCK || '1') || 1;
const VERIFICATION_BATCH_INTERVAL = parseInt(process.env.VERIFICATION_BATCH_INTERVAL || '0');
console.log(`
    RPC URL: ${RPC_URL}
    Reefswap Factory: ${FACTORY_ADDRESS}
    Archive: ${USE_ONLY_RPC ? 'None' : ARCHIVE}
    Veirification interval: ${VERIFICATION_BATCH_INTERVAL}
    Start block: ${START_BLOCK}
`);

const database = new TypeormDatabase();
const fields = {
  event: { phase: true },
  extrinsic: { signature: true },
  block: { timestamp: true }
};
export type Fields = typeof fields;

const processor = new SubstrateBatchProcessor()
  .setBlockRange({ from: START_BLOCK })
  .setDataSource({ chain: { url: RPC_URL!, rateLimit: 10 }, archive: ARCHIVE })
  .addEvmLog({
    address: [FACTORY_ADDRESS],
    topic0: [ReefswapV2Factory.events.PairCreated.topic],
  })
  .addEvmLog({
    address: undefined,
    topic0: [
      ReefswapV2Pair.events.Mint.topic, 
      ReefswapV2Pair.events.Burn.topic,
      ReefswapV2Pair.events.Swap.topic, 
      ReefswapV2Pair.events.Sync.topic, 
      ReefswapV2Pair.events.Transfer.topic
    ],
    extrinsic: true,
  })
  .setFields(fields)
  .includeAllBlocks();

export let ctx: DataHandlerContext<Store, Fields>;

// Avoid type errors when serializing BigInts
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

let isFirstBatch = true;
let nextBatchVerification = 0;

processor.run(database, async (ctx_) => {
  ctx = ctx_;

  const currentBlock = ctx.blocks[0].header.height;

  if (isFirstBatch) {
    FactoryEvent.verify = process.env.VERIFY_POOLS === 'true';
    isFirstBatch = false;

    if (FactoryEvent.verify) {
      await verifyAll();
      nextBatchVerification = currentBlock + VERIFICATION_BATCH_INTERVAL;
    }
  }

  // Verify all unverified every n blocks
  if (nextBatchVerification > 0 && currentBlock >= nextBatchVerification) {
    await verifyAll();
    nextBatchVerification += VERIFICATION_BATCH_INTERVAL;
  }
  
  for (const block of ctx.blocks) {
    ctx.log.info(`Processing block ${block.header.height} [${ctx.blocks[0].header.height} - ${ctx.blocks[ctx.blocks.length - 1].header.height}]`);
    // Process block events
    for (const event of block.events) {
      if (event.args.topics[0] === ReefswapV2Factory.events.PairCreated.topic) {
        // Add new pool in DB
        const factoryEvent = new FactoryEvent(event.id);
        await factoryEvent.combine(event, block.header);

        // Create simulated initial sync event. This is needed to find pool reserves in queries.
        const pool = await ctx.store.get(Pool, factoryEvent.poolAddress!);
        if (!pool) throw new Error(`Pool with id ${factoryEvent.poolAddress!} not created`);
        const initialSyncEvent = new PoolEventModel({
          id: event.id,
          pool,
          blockHeight: block.header.height,
          indexInBlock: 0,
          type: PoolType.Sync,
          reserved1: 0n,
          reserved2: 0n,
          timestamp: new Date(block.header.timestamp!),
        });
        await ctx.store.save(initialSyncEvent);
      } else {
        const pool = await ctx.store.get(Pool, toChecksumAddress(event.args.address));
        if (pool) {
          // Process pool event
          const pairEvent: PairEvent = {
            poolId: pool.id,
            eventId: event.id,
            rawData: event.args,
            blockHeight: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            topic0: event.args.topics[0] || "",
            extrinsic: event.extrinsic!
          };
          await processPairEvent(pairEvent);
        }
      }
    }
    ctx.log.info(`Block ${block.header.height} processed`);
  }
});

const selectPoolEvent = (pairEvent: PairEvent): PoolEventBase<ethers.LogDescription> => {
  switch (pairEvent.topic0) {
      case ReefswapV2Pair.events.Mint.topic:
          return new MintEvent(pairEvent);
      case ReefswapV2Pair.events.Burn.topic:
          return new BurnEvent(pairEvent);
      case ReefswapV2Pair.events.Swap.topic:
          return new SwapEvent(pairEvent);
      case ReefswapV2Pair.events.Sync.topic:
          return new SyncEvent(pairEvent);
      case ReefswapV2Pair.events.Transfer.topic:
          return new TransferEvent(pairEvent);
      default:
          return new EmptyEvent(pairEvent.eventId);
  }
};

const processPairEvent = async (pairEvent: PairEvent): Promise<void> => {
  const data = ReefswapV2Pair.abi.parseLog(pairEvent.rawData);
  if (!data) return;
  ctx.log.info(`Pair: ${data.name} event detected!`);

  const event = selectPoolEvent(pairEvent);
  await event.combine(data);
};
