# Reef DEX indexer Squid

[Substrate processor](https://docs.subsquid.io/develop-a-squid/substrate-processor/) for Reef DEXes based on Uniswap V2 contracts.
Built upon [squid Frontier EVM template](https://github.com/subsquid/squid-frontier-evm-template) and adapted to be used with Reef network.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Compile typescript files
make build

# 3. Start target Postgres database and detach
make up

# 4. Start the processor
make process

# 5. The command above will block the terminal
#    being busy with fetching the chain data, 
#    transforming and storing it in the target database.
#
#    To start the graphql server open the separate terminal
#    and run
make serve
```
## Public archive

Subsquid provides archive data sources with API playgrounds available on the [Aquarium Archive](https://app.subsquid.io/aquarium/archives) page.


## Self-hosted archive

```bash
make archive-up
```

To drop the archive, run

```bash
make archive-down
```

The archive gateway will be started at port `8888`, and it can immediately be used with the processor (even if it's not in sync):

```typescript
processor.setDataSource({
  archive: `http://localhost:8888/graphql`,
});
```

Additionally, an explorer GraphQL API and a playground will be started at `http://localhost:4350/graphql`. While optional, it's a useful tool for debugging and on-chain data exploration.

## Dev flow

### 1. Define database schema

Start development by defining the schema of the target database via `schema.graphql`.
Schema definition consists of regular graphql type declarations annotated with custom directives.
Full description of `schema.graphql` dialect is available [here](https://docs.subsquid.io/schema-spec).

### 2. Generate TypeORM classes

Mapping developers use TypeORM [EntityManager](https://typeorm.io/#/working-with-entity-manager)
to interact with target database during data processing. All necessary entity classes are
generated by the squid framework from `schema.graphql`. This is done by running `make codegen`
command.

### 3. Generate database migration

All database changes are applied through migration files located at `db/migrations`.
`squid-typeorm-migration(1)` tool provides several commands to drive the process.
It is all [TypeORM](https://typeorm.io/#/migrations) under the hood.

```bash
# Connect to database, analyze its state and generate migration to match the target schema.
# The target schema is derived from entity classes generated earlier.
# Don't forget to compile your entity classes beforehand!
npx squid-typeorm-migration generate
or
make migration

# Create template file for custom database changes
npx squid-typeorm-migration create

# Apply database migrations from `db/migrations`
npx squid-typeorm-migration apply
or
make migrate

# Revert the last performed migration
npx squid-typeorm-migration revert   
```

### 4. Import ABI contract and generate interfaces to decode events

It is necessary to import the respective ABI definition to decode EVM logs.

To generate a type-safe facade class to decode EVM logs, use `squid-evm-typegen(1)`:

```bash
npx squid-evm-typegen src/abi src/abi/ERC1155.json
```

And replace the following code in generated the generated `abi.support.ts` file:

```js
let result = await this._chain.client.call('eth_call', [
      {to: this.address, data},
      '0x'+this.blockHeight.toString(16)
])
```
by

```js
let result = await this._chain.client.call('evm_call', [
      {to: this.address, data, from: undefined, storageLimit: 0}
])
```

### View tables

Currently Subsquid does not have a direct support for views generation. In order to create and expose custom view tables:

1. Create a custom script with the corresponding insertions of functions and views to the database and place it in `db/migrations` directory.

2. Add in the `schema.graphql` entities with the structure of the view tables to expose the views in the GraphQL API.

**IMPORTANT**: To prevent the generation of the models for the view tables, the view entities should be commented in the `schema.graphql` file every time the TypeORM classes are generated with the `make codegen` command.

## Project conventions

Squid tools assume a certain project layout.

* All compiled js files must reside in `lib` and all TypeScript sources in `src`.
The layout of `lib` must reflect `src`.
* All TypeORM classes must be exported by `src/model/index.ts` (`lib/model` module).
* Database schema must be defined in `schema.graphql`.
* Database migrations must reside in `db/migrations` and must be plain js files.
* `sqd(1)` and `squid-*(1)` executables consult `.env` file for a number of environment variables.

## Graphql server extensions

It is possible to extend `squid-graphql-server(1)` with custom
[type-graphql](https://typegraphql.com) resolvers and to add request validation.
More details will be added later.

## Disclaimer

This is alpha-quality software. Expect some bugs and incompatible changes in coming weeks.
