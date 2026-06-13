// Minimal ambient types for sql.js (the package ships none) and for the
// webpack-emitted .wasm asset URL. Only the surface the web engine touches.
declare module 'sql.js' {
  export interface SqlJsStatement {
    run(params?: unknown[]): void;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }
  export interface SqlJsDatabase {
    run(sql: string): SqlJsDatabase;
    exec(sql: string): unknown;
    prepare(sql: string): SqlJsStatement;
    close(): void;
  }
  export interface SqlJsStatic {
    Database: { new (data?: ArrayLike<number> | Buffer | null): SqlJsDatabase };
  }
  export interface InitSqlJsConfig {
    locateFile?: (file: string) => string;
  }
  export default function initSqlJs(
    config?: InitSqlJsConfig
  ): Promise<SqlJsStatic>;
}

declare module 'sql.js/dist/sql-wasm-browser.wasm' {
  const url: string;
  export default url;
}
