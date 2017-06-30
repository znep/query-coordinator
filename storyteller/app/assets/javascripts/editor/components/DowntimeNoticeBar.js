import $ from 'jquery';
import moment from 'moment-timezone';
import jstz from 'jstz';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { downtimeStore, DOWNTIME_MOMENT_FORMAT_STRING } from '../stores/DowntimeStore';

const userTimezoneName = jstz.determine().name();

$.fn.downtimeNoticeBar = DowntimeNoticeBar;

export default function DowntimeNoticeBar() {
  var $this = $(this);
  var $container = $('<span>', { 'class': 'container' });
  var $message = $('<span>', { 'class': 'message' });
  var $close = $('<a>', { 'class': 'socrata-icon-close' });

  $container.append($('<span>', { 'class': 'socrata-icon-warning' }));
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
          formatTimestamp(downtime.downtime_start),
          formatTimestamp(downtime.downtime_end)
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

  function formatTimestamp(timestamp) {
    return moment(timestamp, DOWNTIME_MOMENT_FORMAT_STRING).tz(userTimezoneName).format('LLLL z');
  }

  downtimeStore.addChangeListener(render);
  render();

  return this;
}
