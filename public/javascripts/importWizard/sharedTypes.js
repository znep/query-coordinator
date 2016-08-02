// list from https://github.com/socrata/frontend/blob/c32eab311be4d6d936e0583b9d5daf65517b784e/app/models/column.rb#L29-L32
export type TypeName
  = 'url' // website_url
  | 'html' // formatted_text
  | 'email'
  | 'number'
  | 'calendar_date' // date_time
  | 'date' // date_time
  | 'checkbox'
  | 'stars' // star

export type SourceColumn = {
  name: string,
  index: number,
  suggestion: TypeName,
  processed: number,
  types: { // how many cells in this col parsed correctly for each type
    number: number,
    text: number,
    calendar_date: number,
    money: number,
    percent: number
  }
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
