type Row = Record<string, unknown>;
type Filter = { column: string; value: unknown; values?: unknown[] };

export interface FakeSupabase {
  from(table: string): FakeQuery;
  upserts: { table: string; value: unknown }[];
}

class FakeQuery implements PromiseLike<{ data: Row[] | null; error: null }> {
  private filters: Filter[] = [];
  private sortColumn: string | null = null;

  constructor(
    private readonly table: string,
    private readonly rows: Record<string, Row[]>,
    private readonly upserts: FakeSupabase["upserts"],
  ) {}

  select(): this { return this; }
  eq(column: string, value: unknown): this { this.filters.push({ column, value }); return this; }
  in(column: string, values: unknown[]): this { this.filters.push({ column, value: undefined, values }); return this; }
  order(column: string): this { this.sortColumn = column; return this; }

  async maybeSingle(): Promise<{ data: Row | null; error: null }> {
    return { data: this.result()[0] || null, error: null };
  }

  upsert(value: unknown): Promise<{ error: null }> {
    this.upserts.push({ table: this.table, value });
    return Promise.resolve({ error: null });
  }

  then<TResult1 = { data: Row[] | null; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[] | null; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({ data: this.result(), error: null }).then(onfulfilled, onrejected);
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

export function createFakeSupabase(rows: Record<string, Row[]>): FakeSupabase {
  const db: FakeSupabase = {
    upserts: [],
    from(table) { return new FakeQuery(table, rows, db.upserts); },
  };
  return db;
}
