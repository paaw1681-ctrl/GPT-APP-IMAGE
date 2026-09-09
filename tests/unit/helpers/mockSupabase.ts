/**
 * Minimalny fake klienta Supabase do testów jednostkowych. Każde wywołanie
 * `.from(table)` zwraca łańcuchowalny obiekt, który jest jednocześnie
 * "thenable" — niezależnie od tego, jakie filtry/select/order zostaną
 * dopisane w łańcuchu, `await` rozwiąże się do zadanej odpowiedzi dla danej
 * tabeli. To wystarcza do testowania logiki biznesowej bez prawdziwej bazy.
 */
export function mockSupabase(responses: Record<string, { data?: unknown; error?: unknown }>) {
  function chain(table: string): unknown {
    const response = responses[table] ?? { data: null, error: null };
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => resolve(response);
        }
        return () => proxy;
      },
    };
    const proxy = new Proxy({}, handler);
    return proxy;
  }

  return {
    from(table: string) {
      return chain(table);
    },
  };
}
