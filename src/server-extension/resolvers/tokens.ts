import "reflect-metadata";
import { Arg, Mutation, Resolver } from 'type-graphql';
import type { EntityManager } from 'typeorm'
import { Token } from "../../model";

@Resolver()
export class TokensResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Mutation(() => Boolean)
    async updateTokenApproved(
        @Arg('id') id: string,
        @Arg('approved') approved: boolean,
    ): Promise<Boolean> {
        const manager = await this.tx();
        await manager.update(Token, { id }, { approved });
        return true;  
    }
}