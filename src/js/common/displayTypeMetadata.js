function getIconClassForDisplayType(displayType) {
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

    case 'calendar':
      return 'icon-date';

    case 'form':
      return 'icon-list-2';

    default:
      return 'icon-dataset';
  }
}

export { getIconClassForDisplayType };
