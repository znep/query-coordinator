function getIconClassForDisplayType(displayType) {
  switch (displayType) {
    case 'grouped':
    case 'filter':
      return 'socrata-icon-filter';

    case 'href':
      return 'socrata-icon-external';

    case 'data_lens':
    case 'datalens':
    case 'visualization':
      return 'socrata-icon-cards';

    case 'story':
      return 'socrata-icon-story';

    case 'map':
    case 'intensitymap':
    case 'geomap':
    case 'data_lens_map':
      return 'socrata-icon-map';

    case 'chart':
    case 'annotatedtimeline':
    case 'imagesparkline':
    case 'areachart':
    case 'barchart':
    case 'columnchart':
    case 'linechart':
    case 'piechart':
    case 'data_lens_chart':
      return 'socrata-icon-bar-chart';

    case 'calendar':
      return 'socrata-icon-date';

    case 'form':
      return 'socrata-icon-list-2';

    default:
      return 'socrata-icon-dataset';
  }
}

export { getIconClassForDisplayType };
