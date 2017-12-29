import _ from 'lodash';
import airbrake from 'common/airbrake';
import MyAlertsApi from 'common/notifications/api/MyAlertsApi';

let getAlertsStub = null;

describe('MyAlertsApi', () => {

  describe('MyAlertsApi.get', () => {

    describe('successful response', () => {
      let mockResponse = new Response(JSON.stringify({ data: [] }), { status: 200 });

      beforeEach(() => {
        getAlertsStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        getAlertsStub.restore();
      });

      it('should hit alerts url as get method and return alerts', () => {
        return MyAlertsApi.get().then((res) => {
          const request = window.fetch.args[0][1];
          sinon.assert.calledOnce(getAlertsStub);
          assert.equal(window.fetch.args[0][0], '/api/notifications_and_alerts/alerts');
          assert.equal(request.method, 'GET');
          getAlertsStub.restore();
        });
      });

    });

    describe('unsuccessful response', () => {
      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        getAlertsStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        getAlertsStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return MyAlertsApi.get().then(
          () => {
            throw new Error('Unexpected resolution');
          },
          (error) => {
            getAlertsStub.restore();
            assert.equal(error.toString(), 'Error');
          }
        );
      });
    });
  });

});
