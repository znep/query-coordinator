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

    default:
      return displayType;
  }
}

const getIconClassForDisplayType = (displayType, isPublished = true) =>
  `socrata-icon-${getIconNameForDisplayType(displayType, isPublished)}`;


export {
  getIconNameForDisplayType,
  getIconClassForDisplayType
};
