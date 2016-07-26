type TypeName = string

type SourceColumn = { // eslint-disable-line no-unused-vars
  name: string,
  index: number,
  suggestion: TypeName,
  numProcessed: number,
  typeCounts: { [key: TypeName]: number }
}

export type FileId = string

export type Summary
  = { // normal tabular
      headers: number,
      columns: Array<SourceColumn>,
      locations: Array<{ latitude: number, longitude: number }>,
      sample: Array<Array<string>>,
    }
  | { // geo
      totalFeatureCount: number,
      layers: Array<GeoLayer>
    }

export type GeoLayer = {
  name: string,
  referenceSystem: string
}

export type OperationName
  = 'UploadData'
  | 'DownloadData'
  | 'UploadBlob'
  | 'ConnectToEsri'
  | 'UploadGeospatial'
  | 'LinkToExternal'
  | 'CreateFromScratch'
