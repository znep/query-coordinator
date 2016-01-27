var adminJobsScreen = require('screens/admin-jobs');

describe('adminJobsScreen', function() {

  before(function() {
    blist.translations = {
      core: {
        date_time: {
          current_day_past: 'today',
          single_day_past: 'yesterday'
        }
      }
    }
  });

  describe('replaceTimestamps', function() {
    it('replaces timestamps with versions in the right timezone and dates w/ today, yesterday, or date', function() {
      var now = moment();
      var yesterday = now.clone().subtract(1, 'days');
      var aboutAWeekAgo = now.clone().subtract(1, 'weeks');
      var $testDom = $(`
        <tr>
          <td>
            <span class="started-time" data-epoch-seconds="${now.valueOf()/1000}">12:41:10</span>
            <span class="started-time-relative-day">mm/dd/yyyy</span>
          </td>
          <td>
            <span class="started-time" data-epoch-seconds="${yesterday.valueOf()/1000}">12:41:10</span>
            <span class="started-time-relative-day">mm/dd/yyyy</span>
          </td>
          <td>
            <span class="started-time" data-epoch-seconds="${aboutAWeekAgo.valueOf()/1000}">12:41:10</span>
            <span class="started-time-relative-day">mm/dd/yyyy</span>
          </td>
        </tr>
      `);

      adminJobsScreen.replaceTimestamps($testDom);

      // date
      expect($testDom.find('.started-time-relative-day')[0].innerText).to.equal('Today');
      expect($testDom.find('.started-time-relative-day')[1].innerText).to.equal('Yesterday');
      expect($testDom.find('.started-time-relative-day')[2].innerText).to.equal(aboutAWeekAgo.format('M/D/YYYY'));

      // time
      expect($testDom.find('.started-time')[0].innerText).to.equal(now.format('HH:mm:ss'));
      expect($testDom.find('.started-time')[1].innerText).to.equal(yesterday.format('HH:mm:ss'));
      expect($testDom.find('.started-time')[2].innerText).to.equal(aboutAWeekAgo.format('HH:mm:ss'));
    });
  });

  describe('todayYesterdayOrDate', function() {
    it('returns "today" for a date today', function() {
      var now = moment();
      expect(adminJobsScreen.todayYesterdayOrDate(now)).to.equal('Today');
    });

    it('returns "yesterday" for a date yesterday', function() {
      var yesterday = moment().subtract(1, 'days');
      expect(adminJobsScreen.todayYesterdayOrDate(yesterday)).to.equal('Yesterday');
    });

    it('returns the date for a date before yesterday', function() {
      var weekAgo = moment().subtract(1, 'weeks');
      expect(adminJobsScreen.todayYesterdayOrDate(weekAgo)).to.equal(weekAgo.format('M/D/YYYY'));
    });
  });

});
