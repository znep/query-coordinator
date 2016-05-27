function getIconClassForDisplayType(displayType) {
  if (_.isEmpty(displayType)) {
    return 'icon-dataset';
  }

  switch (displayType) {
    case 'grouped':
    case 'filter':
      return 'icon-filter';

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

export { getIconClassForDisplayType };
