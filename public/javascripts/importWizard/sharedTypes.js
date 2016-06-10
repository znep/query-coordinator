type TypeName = string

type SourceColumn = { // eslint-disable-line no-unused-vars
  name: string,
  index: number,
  suggestion: TypeName,
  numProcessed: number,
  typeCounts: { [key: TypeName]: number }
}

export type OperationName
  = 'UploadData'
  | 'UploadBlob'
  | 'ConnectToEsri'
  | 'UploadGeospatial'
  | 'LinkToExternal'
  | 'CreateFromScratch'
