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


// match https://github.com/socrata/core/blob/246c2cf811e81a0ac780e391632e56d77b4f0696/unobtainium/src/main/java/com/blist/models/views/ImportSource.java#L17-L17
export type OperationName
  = 'UPLOAD_DATA'
  | 'UPLOAD_BLOB'
  | 'CONNECT_TO_ESRI'
  | 'UPLOAD_GEO'
  | 'LINK_EXTERNAL'
  | 'CREATE_FROM_SCRATCH'
