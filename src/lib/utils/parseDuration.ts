export function parseDuration(duration: string) {
  let value = parseFloat(duration);

  if (!value) {
    return 0;
  }

  if (duration.match(/[0-9]+s$/gi)) {
    value *= 1000;
  }

  return value;
}
