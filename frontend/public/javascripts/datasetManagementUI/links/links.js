const base = params => {
  let prefix = '';

  if (params.locale) {
    prefix = `/${params.locale}`;
  }

  return `${prefix}/${params.category}/${params.name}/${params.fourfour}`;
};

export const revisionBase = params => `${base(params)}/revisions/${params.revisionSeq}`;

export const home = revisionBase;

export const manageTab = params => `${revisionBase(params)}/manageTab`;

export const metadata = params => `${revisionBase(params)}/metadata`;

export const datasetMetadataForm = params => `${revisionBase(params)}/metadata/dataset`;

export const columnMetadataForm = (params, outputSchemaId, columnId) =>
  `${revisionBase(params)}/metadata/${outputSchemaId}/columns${columnId ? `#${columnId}` : ''}`;

export const sources = params => `${revisionBase(params)}/sources`;

export const urlSource = params => `${sources(params)}/url`;

export const hrefSource = params => `${sources(params)}/href`;

export const showOutputSchema = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
  `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/${outputSchemaId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showParseOptions = params => {
  const { sourceId, inputSchemaId, outputSchemaId } = params;
  return (
    `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}` +
    `/output/${outputSchemaId}/option/parse_options`
  );
};

export const showColumnErrors = (
  params,
  sourceId,
  inputSchemaId,
  outputSchemaId,
  errorsTransformId,
  pageNo
) =>
  `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/column_errors/${errorsTransformId}` +
  `${pageNo ? `/page/${pageNo}` : ''}`;

export const showRowErrors = (params, sourceId, inputSchemaId, outputSchemaId, pageNo) =>
  `${revisionBase(params)}/sources/${sourceId}/schemas/${inputSchemaId}/output/` +
  `${outputSchemaId}/row_errors` +
  `${pageNo ? `/page/${pageNo}` : ''}`;
