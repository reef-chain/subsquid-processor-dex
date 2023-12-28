import { BlockHeader } from "@subsquid/substrate-processor";

class PoolEventBase <T> {
  evmEventId: string;

  constructor(eventId: string) {
    this.evmEventId = eventId;
  }
  
  async process(event: T, blockHeight?: number): Promise<void> { }

  async save(): Promise<void> { }

  async combine(event: T, block?: BlockHeader): Promise<void> {
    await this.process(event, block?.height);
    await this.save();
  }
}

export default PoolEventBase;
