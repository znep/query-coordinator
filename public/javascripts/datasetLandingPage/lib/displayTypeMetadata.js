function getIconClassForDisplayType(displayType) {
  if (_.isEmpty(displayType)) {
    return 'icon-dataset';
  }

  switch (displayType) {
    case 'grouped':
    case 'filter':
      return 'icon-filter';

    case 'href':
      return 'icon-external';

    case 'data_lens':
      return 'icon-cards';

    case 'story':
      return 'icon-story';

    case 'map':
    case 'intensitymap':
    case 'geomap':
    case 'data_lens_map':
      return 'icon-map';

    case 'chart':
    case 'annotatedtimeline':
    case 'imagesparkline':
    case 'areachart':
    case 'barchart':
    case 'columnchart':
    case 'linechart':
    case 'piechart':
    case 'data_lens_chart':
      return 'icon-bar-chart';

    default:
      return 'icon-dataset';
  }
}

function getSemanticNameForDisplayType(displayType) {
  if (_.isEmpty(displayType)) {
    return 'Unknown';
  }

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

    default:
      return 'Unknown';
  }
}

export { getIconClassForDisplayType, getSemanticNameForDisplayType };
