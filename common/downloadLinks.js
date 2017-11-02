import _ from 'lodash';
import $ from 'jquery';

// These are helpers for creating all the download links for a dataset
// Meant to be looped through with all the `format` values of view.exportFormats

export const getMimeType = (format) => {
  switch (format) {
    case 'csv':
    case 'csv_for_excel':
    case 'csv_for_excel_europe':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'rdf':
      return 'application/rdfxml';
    case 'rss':
      return 'application/rssxml';
    case 'tsv_for_excel':
      return 'text/tab-separated-values';
    case 'xml':
      return 'application/xml';
    default:
      return 'text/csv'; // ¯\_(ツ)_/¯
  }
};

export const getDownloadLink = (viewUid, format, domainCname, protocol) => {
  if (_.isEmpty(viewUid)) { return null; }

  const linkOptions = { format: format, protocol: protocol };
  _.defaults(linkOptions, {
    format: 'csv',
    protocol: 'https'
  });

  let extension;

  const params = {
    accessType: 'DOWNLOAD'
  };

  switch (linkOptions.format) {
    case 'csv_for_excel':
      extension = 'csv';
      params.bom = 'true';
      params.format = 'true';
      break;
    case 'csv_for_excel_europe':
      extension = 'csv';
      params.bom = 'true';
      params.format = 'true';
      params.delimiter = ';';
      break;
    case 'tsv_for_excel':
      extension = 'tsv';
      params.bom = 'true';
      break;
    default:
      extension = linkOptions.format;
  }

  const queryString = $.param(params);
  const url = `/api/views/${viewUid}/rows.${extension}?${queryString}`;

  if (_.isEmpty(domainCname)) {
    return url;
  } else {
    return `${linkOptions.protocol}://${domainCname}${url}`;
  }
};

export const getDownloadType = (format) => {
  switch (format) {
    case 'csv_for_excel':
      return 'CSV for Excel';
    case 'csv_for_excel_europe':
      return 'CSV for Excel (Europe)';
    case 'tsv_for_excel':
      return 'TSV for Excel';
    default:
      return format.toUpperCase();
  }
};
