type Row = Record<string, unknown>;
type Filter = { column: string; value: unknown; values?: unknown[] };
export type FakeSupabaseError = { message: string; code?: string };

export interface FakeSupabase {
  from(table: string): FakeQuery;
  upserts: { table: string; value: unknown }[];
  writes: { table: string; operation: "insert" | "update" | "delete" | "upsert"; value?: unknown }[];
}

class FakeQuery implements PromiseLike<{ data: Row[] | null; error: FakeSupabaseError | null }> {
  private filters: Filter[] = [];
  private sortColumn: string | null = null;
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private writeValue: unknown;

  constructor(
    private readonly table: string,
    private readonly rows: Record<string, Row[]>,
    private readonly upserts: FakeSupabase["upserts"],
    private readonly errors: Record<string, FakeSupabaseError>,
    private readonly writes: FakeSupabase["writes"],
  ) {}

  select(): this { return this; }
  is(column: string, value: unknown): this { this.filters.push({ column, value }); return this; }
  insert(value: unknown): this {
    this.operation = "insert";
    this.writeValue = value;
    this.writes.push({ table: this.table, operation: "insert", value });
    return this;
  }
  update(value: unknown): this {
    this.operation = "update";
    this.writeValue = value;
    this.writes.push({ table: this.table, operation: "update", value });
    return this;
  }
  delete(): this {
    this.operation = "delete";
    this.writes.push({ table: this.table, operation: "delete" });
    return this;
  }
  eq(column: string, value: unknown): this { this.filters.push({ column, value }); return this; }
  in(column: string, values: unknown[]): this { this.filters.push({ column, value: undefined, values }); return this; }
  order(column: string): this { this.sortColumn = column; return this; }
  limit(): this { return this; }

  async maybeSingle(): Promise<{ data: Row | null; error: FakeSupabaseError | null }> {
    const error = this.errors[`${this.table}.${this.operation}`] || this.errors[this.table] || null;
    if (!error) this.applyUpdate();
    return { data: this.result()[0] || null, error };
  }

  upsert(value: unknown): this {
    this.operation = "upsert";
    this.writeValue = value;
    this.upserts.push({ table: this.table, value });
    this.writes.push({ table: this.table, operation: "upsert", value });
    return this;
  }

  then<TResult1 = { data: Row[] | null; error: FakeSupabaseError | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[] | null; error: FakeSupabaseError | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const error = this.errors[`${this.table}.${this.operation}`] || this.errors[this.table] || null;
    if (!error) this.applyUpdate();
    return Promise.resolve({ data: this.result(), error }).then(onfulfilled, onrejected);
  }

  private applyUpdate(): void {
    if (this.operation !== "update" || !this.writeValue || typeof this.writeValue !== "object") return;
    for (const row of this.result()) Object.assign(row, this.writeValue);
  }

  private result(): Row[] {
    let result = [...(this.rows[this.table] || [])].filter((row) =>
      this.filters.every((filter) => filter.values
        ? filter.values.includes(row[filter.column])
        : row[filter.column] === filter.value),
    );
    if (this.sortColumn) {
      const column = this.sortColumn;
      result = result.sort((a, b) => Number(a[column]) - Number(b[column]));
    }
    return result;
  }
}

export function createFakeSupabase(
  rows: Record<string, Row[]>,
  errors: Record<string, FakeSupabaseError> = {},
): FakeSupabase {
  const db: FakeSupabase = {
    upserts: [],
    writes: [],
    from(table) { return new FakeQuery(table, rows, db.upserts, errors, db.writes); },
  };
  return db;
}
