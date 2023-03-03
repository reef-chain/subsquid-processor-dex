import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import {
  BatchContext,
  BatchProcessorItem,
  SubstrateBatchProcessor,
} from "@subsquid/substrate-processor";
import { KnownArchives, lookupArchive } from "@subsquid/archive-registry";
import * as ReefswapV2Factory from "./abi/ReefswapV2Factory";
import * as ReefswapV2Pair from "./abi/ReefswapV2Pair";
import MarketHistory from "./process/historyModules";
import { EventRaw } from "./interfaces/interfaces";
import FactoryEvent from "./process/events/FactoryEvent";
import { PairEvent } from "./process/events/PoolEvent";
import { toChecksumAddress } from "./util/util";
import PoolEventBase from "./process/events/PoolEventBase";
import { utils } from "ethers";
import MintEvent from "./process/events/MintEvent";
import BurnEvent from "./process/events/BurnEvent";
import SwapEvent from "./process/events/SwapEvent";
import SyncEvent from "./process/events/SyncEvent";
import TransferEvent from "./process/events/TransferEvent";
import EmptyEvent from "./process/events/EmptyEvent";
import { Pool } from "./model";

const NETWORK = process.env.NETWORK || 'mainnet';
const RPC_URL = process.env.NODE_RPC_WS;
const AQUARIUM_ARCHIVE_NAME = process.env.ARCHIVE_LOOKUP_NAME as KnownArchives;
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as string;
console.log('NETWORK=', NETWORK, ' RPC=', RPC_URL, ' AQUARIUM_ARCHIVE_NAME=', AQUARIUM_ARCHIVE_NAME, ' FACTORY_ADDRESS=', FACTORY_ADDRESS);
const ARCHIVE = lookupArchive(AQUARIUM_ARCHIVE_NAME);
const START_BLOCK = parseInt(process.env.START_BLOCK || '1');

const database = new TypeormDatabase();
const processor = new SubstrateBatchProcessor()
  .setBlockRange({ from: START_BLOCK })
  .setDataSource({ chain: RPC_URL, archive: ARCHIVE })
  .addEvmLog(FACTORY_ADDRESS, {
    filter: [ReefswapV2Factory.events.PairCreated.topic],
    data: { event: { args: true } }
  })
  .addEvmLog("*", {
    filter: [[
      ReefswapV2Pair.events.Mint.topic, 
      ReefswapV2Pair.events.Burn.topic,
      ReefswapV2Pair.events.Swap.topic, 
      ReefswapV2Pair.events.Sync.topic, 
      ReefswapV2Pair.events.Transfer.topic
    ]],
    data: { event: { args: true } }
  })
  .includeAllBlocks(); ;

export type Item = BatchProcessorItem<typeof processor>;
export type Context = BatchContext<Store, Item>;
export let ctx: Context;

// Avoid type errors when serializing BigInts
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

let isFirstBatch = true;

processor.run(database, async (ctx_) => {
  ctx = ctx_;

  if (isFirstBatch) {
    // Remove all pool rows that are greater then current pool pointer
    const currentBlock = ctx.blocks[0].header.height;

    // Initialize token prices on previous block
    await MarketHistory.init(currentBlock - 1);

    isFirstBatch = false;
  }
  
  for (const block of ctx.blocks) {
    // Process block events
    for (const item of block.items) {
      if (item.name === 'EVM.Log') {
        const eventRaw = item.event as EventRaw;
        if (eventRaw.args.topics[0] === ReefswapV2Factory.events.PairCreated.topic) {
          // Add new pool in DB
          const factoryEvent = new FactoryEvent(eventRaw.id);
          await factoryEvent.combine(eventRaw, block.header);
        } else {
          const pool = await ctx.store.get(Pool, toChecksumAddress(eventRaw.args.address));
          if (pool) {
            // Process pool event
            const pairEvent: PairEvent = {
              poolId: pool.id,
              eventId: eventRaw.id,
              rawData: eventRaw.args,
              blockHeight: block.header.height,
              timestamp: new Date(block.header.timestamp).toDateString(),
              topic0: eventRaw.args.topics[0] || "",
            };
            await processPairEvent(pairEvent);
          }
        }
      }
    }

    // Update token prices and insert new values
    await MarketHistory.save(block.header);
  }
});

const selectPoolEvent = (pairEvent: PairEvent): PoolEventBase<utils.LogDescription> => {
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
  ctx.log.info(`Pair: ${data.name} event detected!`);

  const event = selectPoolEvent(pairEvent);
  await event.combine(data);
};
