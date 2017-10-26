import airbrake, { __RewireAPI__ as AirbrakeAPI } from 'common/airbrake';
import ieFilter from 'common/airbrake/filters/ie';
import environmentFilter from 'common/airbrake/filters/environment';

describe('airbrake', function() {
  let consoleErrorStub;

  let notifySpy;
  let addFilterSpy;
  let addReporterSpy;
  let ClientSpy;

  // Logged on all `notify` calls, even when the error eventually gets filtered
  const notifyMatcher = sinon.match(/Airbrake notification:/);

  beforeEach(function() {
    consoleErrorStub = sinon.stub(window.console, 'error');

    notifySpy = sinon.spy();
    addFilterSpy = sinon.spy();
    addReporterSpy = sinon.spy();

    ClientSpy = sinon.spy(function() {
      this.addFilter = addFilterSpy;
      this.notify = notifySpy;
      this.addReporter = addReporterSpy;
    });

    AirbrakeAPI.__Rewire__('AirbrakeJs', ClientSpy);
  });

  afterEach(function() {
    window.console.error.restore();

    AirbrakeAPI.__ResetDependency__('AirbrakeJs');
  });

  describe('#init', function() {
    it('logs an error if projectId is not provided', function() {
      airbrake.init(null, 'PROJECT_KEY');
      assert.isTrue(consoleErrorStub.calledWith('`projectId` is required for airbrake.init()'));
    });

    it('logs an error if projectKey is not provided', function() {
      airbrake.init('PROJECT_ID', null);
      assert.isTrue(consoleErrorStub.calledWith('`projectKey` is required for airbrake.init()'));
    });

    it('adds an IE filter by default', function() {
      airbrake.init('PROJECT_ID', 'PROJECT_KEY');
      sinon.assert.calledWith(addFilterSpy, ieFilter);
    });

    it('adds an environment filter by default', function() {
      airbrake.init('PROJECT_ID', 'PROJECT_KEY');
      sinon.assert.calledWith(addFilterSpy, environmentFilter);
    });

    it('passes projectId, and projectKey to AirbrakeJs', function() {
      airbrake.init('PROJECT_ID', 'PROJECT_KEY');
      sinon.assert.calledWith(ClientSpy, { projectId: 'PROJECT_ID', projectKey: 'PROJECT_KEY' });
    });

    it('adds a default reporter', function() {
      airbrake.init('PROJECT_ID', 'PROJECT_KEY');
      sinon.assert.calledWith(addReporterSpy, sinon.match.func);
    });
  });

  describe('#notify', function() {
    beforeEach(function() {
      airbrake.init('PROJECT_ID', 'PROJECT_KEY');
    });

    it('logs the payload to the console', function() {
      airbrake.notify({ error: 'bah humbug' });
      sinon.assert.calledWith(consoleErrorStub, notifyMatcher, { error: 'bah humbug' });
    });

    it('passes the payload to the AirbrakeJs client', function() {
      const payload = { error: 'foo bar' };
      airbrake.notify(payload);
      sinon.assert.calledWith(notifySpy, payload);
    });
  });

  describe('#addFilter', function() {
    beforeEach(function() {
      airbrake.init('PROJECT_ID', 'PROJECT_KEY');
    });

    it('passes the filter callback to the AirbrakeJs client', function() {
      const fakeFilter = function(notice) { return notice; };

      airbrake.addFilter(fakeFilter);
      sinon.assert.calledWith(addFilterSpy, fakeFilter);
    });
  });
});
