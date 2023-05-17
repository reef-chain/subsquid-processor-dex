import { Model } from '@subsquid/openreader/lib/model'
import { GraphQLSchema, OperationDefinitionNode } from 'graphql'

interface HttpHeaders extends Iterable<[string, string]> {
    get(name: string): string | null
    has(name: string): boolean
    entries(): Iterator<[string, string]>
    keys(): Iterator<string>
}

interface HttpRequest {
    readonly url: string
    readonly method: string
    readonly headers: HttpHeaders
}

interface RequestCheckContext {
  http: HttpRequest
  operation: OperationDefinitionNode
  operationName: string | null
  schema: GraphQLSchema
  context: Record<string, any>
  model: Model
}

// Interceptor for GraphQL HTTP requests
export async function requestCheck(req: RequestCheckContext): Promise<boolean | string> {
  if (req.operation.operation === 'mutation') {
    // Mutation requests are protected
    return authChecker(req.http);
  }

  return true;
}

const authChecker = (httpReq: HttpRequest): boolean => {
  const secret = process.env.ADMIN_KEY;
  // If no secret set, reject
  if (!secret) return false;

  const authHeader = httpReq.headers.get("authorization");

  return authHeader === `Bearer ${secret}`;
};