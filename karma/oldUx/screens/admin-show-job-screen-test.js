var adminShowJobScreen = require('screens/admin-show-job');

describe('adminShowJobScreen', function() {

  describe('replaceTimestamps', function() {

    it('replaces timestamps with versions in the right timezone', function() {
      var testTimestampEpochSecs = 1453510021;
      var $testDom = $(`
        <div style="position: absolute; right: 0; top: 2px;">
          <p class="import-status-label">
            <span class="import-status-icon import-status-icon-failure icon-failed"></span>
            Failed
          </p>
          <p class="result-time-stamp time-stamp" data-epoch-seconds="${testTimestampEpochSecs}">
            <span>22 Jan 2016 at 16:47:01 -08:00</span>
            (5 days ago)
          </p>
        </div>
      `);

      adminShowJobScreen.replaceTimestamps($testDom);

      expect($testDom.find('.result-time-stamp.time-stamp span')[0].innerText).
          to.equal(moment.unix(testTimestampEpochSecs).format('D MMM YYYY [at] HH:mm:ss Z'));

    });

  });

});
