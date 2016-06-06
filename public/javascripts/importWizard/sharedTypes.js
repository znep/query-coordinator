type TypeName = string

type SourceColumn = { // eslint-disable-line no-unused-vars
  name: string,
  index: number,
  suggestedType: TypeName,
  numProcessed: number,
  typeCounts: { [key: TypeName]: number }
}
