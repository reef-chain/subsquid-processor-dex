import "reflect-metadata";
import { Arg, Mutation, Resolver } from 'type-graphql';
import type { EntityManager } from 'typeorm'
import { Pool } from "../../model";

@Resolver()
export class TokensResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Mutation(() => Boolean)
    async updateTokenApproved(
        @Arg('id') id: string,
        @Arg('approved') approved: boolean,
    ): Promise<Boolean> {
        const manager = await this.tx();

        await manager.update(Pool, {token1: id}, { approved1: approved });
        await manager.update(Pool, {token2: id}, { approved2: approved });

        return true;  
    }
}