export function parseQuery(query: string) {
  // TODO handle querying for :enter and :leave states

  // replace @ references to child animations
  (query.match(/@[0-z_*-]+/gi) || []).map((match) => {
    query = query.replace(
      match,
      `[animation-name` +
        (match.substring(1) !== '*' ? `='${match.substring(1)}']` : ']')
    );
  });

  return query;
}
