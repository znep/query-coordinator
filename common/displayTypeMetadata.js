function getIconClassForDisplayType(displayType) {
  switch (displayType) {
    case 'filter':
    case 'grouped':
      return 'socrata-icon-filter';

    case 'href':
      return 'socrata-icon-external';

    case 'data_lens':
    case 'datalens':
    case 'visualization':
      return 'socrata-icon-cards';

    case 'story':
      return 'socrata-icon-story';

    case 'data_lens_map':
    case 'geomap':
    case 'intensitymap':
    case 'map':
      return 'socrata-icon-map';

    case 'annotatedtimeline':
    case 'areachart':
    case 'barchart':
    case 'chart':
    case 'columnchart':
    case 'data_lens_chart':
    case 'imagesparkline':
    case 'linechart':
    case 'piechart':
      return 'socrata-icon-bar-chart';

    case 'calendar':
      return 'socrata-icon-date';

    case 'form':
      return 'socrata-icon-list2';

    case 'blob':
    case 'file':
      return 'socrata-icon-download';

    case 'blist':
    case 'dataset':
    case 'federated':
    case 'table':
      return 'socrata-icon-dataset';

    default:
      return 'socrata-icon-data';
  }
}

export { getIconClassForDisplayType };
