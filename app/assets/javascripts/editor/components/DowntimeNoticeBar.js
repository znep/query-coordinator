import $ from 'jQuery';
import moment from 'moment';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { downtimeStore } from '../stores/DowntimeStore';

$.fn.downtimeNoticeBar = DowntimeNoticeBar;

export default function DowntimeNoticeBar() {
  var $this = $(this);
  var $container = $('<span>', { 'class': 'container' });
  var $message = $('<span>', { 'class': 'message' });
  var $close = $('<a>', { 'class': 'icon-close' });

  $container.append($('<span>', { 'class': 'icon-warning' }));
  $container.append($message);
  $container.append($close);
  $this.append($container);

  function render() {
    var downtimes = downtimeStore.getUnacknowledgedDowntimes();
    var shouldDisplay = downtimes.length > 0;

    if (shouldDisplay) {
      var downtime = downtimes.shift();
      $message.html(
        StorytellerUtils.format(
          I18n.t('editor.downtime'),
          moment(downtime.downtime_start).format('LLLL [UTC]Z'),
          moment(downtime.downtime_end).format('LLLL [UTC]Z')
        )
      );

      $close.one('click', function() {
        dispatcher.dispatch({
          action: Actions.DOWNTIME_ACKNOWLEDGE,
          downtime: downtime
        });
      });
    }

    $(document.body).toggleClass('downtime-notice', shouldDisplay);
    $this.toggleClass('visible', shouldDisplay);
  }

  downtimeStore.addChangeListener(render);
  render();

  return this;
}
