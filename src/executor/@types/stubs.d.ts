// Stub type declarations for third-party modules
// Runtime types resolved via AgentWork's node_modules

declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  export function v3(name: string, version: string): string;
}

declare module 'better-sqlite3' {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement<T = any> {
    run(...params: any[]): RunResult;
    get(...params: any[]): T;
    all(...params: any[]): T[];
  }

  class BetterSqlite3 {
    constructor(path: string, options?: any);
    exec(sql: string): void;
    prepare<T = any>(sql: string): Statement<T>;
    pragma(pragma: string): any;
    close(): void;
  }

  export default BetterSqlite3;
}

declare module 'express' {
  import { IncomingMessage, ServerResponse } from 'http';

  export interface Request extends IncomingMessage {
    body: any;
    params: Record<string, string>;
    query: Record<string, string>;
  }

  export interface Response extends ServerResponse {
    json(body?: any): Response;
    status(code: number): Response;
    send(body?: any): Response;
  }

  export type RequestHandler = (req: Request, res: Response, next?: () => void) => void;

  export interface Router {
    get(path: string, ...handlers: RequestHandler[]): Router;
    post(path: string, ...handlers: RequestHandler[]): Router;
    put(path: string, ...handlers: RequestHandler[]): Router;
    delete(path: string, ...handlers: RequestHandler[]): Router;
    use(...handlers: any[]): Router;
  }

  export interface Application extends Router {
    listen(port: number, cb?: () => void): any;
  }

  export function Router(): Router;
  export default function(): Application;
}
