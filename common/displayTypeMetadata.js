function getIconNameForDisplayType(displayType, isPublished = true) {
  switch (displayType) {
    case 'filter':
    case 'grouped':
      return 'filter';

    case 'federated_href':
    case 'href':
      return 'external';

    case 'data_lens':
    case 'datalens':
    case 'visualization':
      return 'cards';

    case 'story':
      return 'story';

    case 'data_lens_map':
    case 'geomap':
    case 'intensitymap':
    case 'map':
      return 'map';

    case 'annotatedtimeline':
    case 'areachart':
    case 'barchart':
    case 'chart':
    case 'columnchart':
    case 'data_lens_chart':
    case 'imagesparkline':
    case 'linechart':
    case 'piechart':
      return 'bar-chart';

    case 'calendar':
      return 'date';

    case 'form':
      return 'list2';

    case 'attachment':
    case 'blob':
    case 'file':
      return 'attachment';

    case 'blist':
    case 'dataset':
    case 'federated':
    case 'table':
      return isPublished ? 'dataset' : 'working-copy';

    case 'data_asset':
      return 'db-collection';

    case 'measure':
      return 'op-measure';

    default:
      return displayType;
  }
}

// This is only used for a mixpanel event.
// Don't use this to find a string for the UI! Use i18n!
function getSemanticNameForDisplayType(displayType) {
  switch (displayType) {
    case 'grouped':
    case 'filter':
      return 'Filtered View';

    case 'href':
      return 'External';

    case 'data_lens':
      return 'Data Lens';

    case 'story':
      return 'Story';

    case 'map':
    case 'intensitymap':
    case 'geomap':
    case 'data_lens_map':
      return 'Map';

    case 'chart':
    case 'annotatedtimeline':
    case 'imagesparkline':
    case 'areachart':
    case 'barchart':
    case 'columnchart':
    case 'linechart':
    case 'piechart':
    case 'data_lens_chart':
      return 'Chart';

    case 'measure':
      return 'Measure';

    default:
      return 'Unknown';
  }
}


const getIconClassForDisplayType = (displayType, isPublished = true) =>
  `socrata-icon-${getIconNameForDisplayType(displayType, isPublished)}`;


export {
  getIconNameForDisplayType,
  getIconClassForDisplayType,
  getSemanticNameForDisplayType
};
