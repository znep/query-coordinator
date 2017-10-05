import _ from 'lodash';
import airbrake from 'common/airbrake';
import AlertPreferenceStore from 'common/notifications/store/AlertPreferenceStore';

let getPreferenceStub = null;
let setPreferenceStub = null;

describe('AlertPreferenceStore', () => {

  describe('AlertPreferenceStore.get', () => {

    describe('successful response', () => {
      let mockResponse = new Response(
        JSON.stringify ({data:[
          {'name': 'test_asset'},
          {'name': 'test_all_asset', type: 'meta-test', 'value': 'true'}
        ]}), {status: 200}
      );

      beforeEach(() => {
        getPreferenceStub = sinon.stub(window, 'fetch', _.constant(Promise.resolve(mockResponse)))
      });

      afterEach(() => {
        getPreferenceStub.restore();
      });

      it('should hit preference url as get method and return decoded preference', () => {
        let expectedOutput = {
          test_asset: {enable_email: false, enable_product_notification: false},
          test_all_asset: {
            enable_email: false,
            enable_product_notification: false,
            sub_categories: {'meta-test': {enable: true}}
          }
        };
        return AlertPreferenceStore.get().then((res) => {
          const request = window.fetch.args[0][1];
          sinon.assert.calledOnce(getPreferenceStub);
          assert.equal(window.fetch.args[0][0], '/api/notifications_and_alerts/preferences');
          assert.equal(request.method, 'GET');
          assert.deepEqual(res, expectedOutput);
          getPreferenceStub.restore();

        });
      })

    });

    describe('unsuccessful response', () => {
      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        getPreferenceStub = sinon.stub(window, 'fetch', _.constant(Promise.resolve({status: 500})));
      });

      afterEach(() => {
        getPreferenceStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return AlertPreferenceStore.get().then(
          () => {
            throw new Error('Unexpected resolution')
          },
          (error) => {
            getPreferenceStub.restore();
            assert.equal(error.toString(), 'Error');
          }
        );
      });
    });
  });

  describe('AlertPreferenceStore.set', () => {
    describe('successful response', () => {
      let mockResponse = new Response(JSON.stringify ({data: []}), {status: 200});

      beforeEach(() => {
        setPreferenceStub = sinon.stub(window, 'fetch', _.constant(Promise.resolve(mockResponse)))
      });

      afterEach(() => {
        setPreferenceStub.restore();
      });

      it('should hit preference url as post method', () => {
        AlertPreferenceStore.set().then(()=> {
          const request = window.fetch.args[0][1];
          assert.equal(request.method, 'POST');
          assert.equal(window.fetch.args[0][0], '/api/notifications_and_alerts/preferences');
          setPreferenceStub.restore();
        });

      });
    });

    describe('unsuccessful response', () => {
      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        setPreferenceStub = sinon.stub(window, 'fetch', _.constant(Promise.resolve({status: 500})))
      });

      afterEach(() => {
        setPreferenceStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      it('throws a connection error', () => {
        return AlertPreferenceStore.set().then(
          () => {
            throw new Error('Unexpected resolution')
          },
          (error) => {
            assert.equal(error.toString(), 'Error');
            setPreferenceStub.restore();
          }
        );
      });
    });
  });
});
