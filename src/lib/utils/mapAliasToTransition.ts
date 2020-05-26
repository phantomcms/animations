export function mapAliasToTransition(alias: string) {
  switch (alias) {
    case ':enter':
      return 'void => *';
    case ':leave':
      return '* => void';
    default:
      throw new Error(`Transition alias '${name}' not recognized`);
  }
}
