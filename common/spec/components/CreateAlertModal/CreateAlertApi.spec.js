import airbrake from 'common/airbrake';
import CreateAlertApi from 'common/components/CreateAlertModal/api/CreateAlertApi';

let validationApiStub = null;
let createApiStub = null;

describe('CreateAlertApi', () => {

  describe('CreateAlertApi.validate', () => {

    describe('successful response', () => {
      let mockResponse = new Response(
        JSON.stringify({ valid:true }), { status: 200 }
      );

      beforeEach(() => {
        validationApiStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        validationApiStub.restore();
      });

      it('should hit query validate url as post method', () => {
        CreateAlertApi.validate({});
        const request = window.fetch.args[0][1];
        sinon.assert.calledOnce(validationApiStub);
        assert.equal(window.fetch.args[0][0], '/api/notifications_and_alerts/alerts/validate_raw_soql');
        assert.equal(request.method, 'POST');
        validationApiStub.restore();
      });

    });

    describe('unsuccessful response', () => {
      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        validationApiStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        validationApiStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return CreateAlertApi.validate({}).then(
          () => {
            throw new Error('Unexpected resolution');
          },
          (error) => {
            validationApiStub.restore();
            assert.equal(error.toString(), 'Error');
          }
        );
      });
    });
  });

  describe('CreateAlertApi.create', () => {
    describe('successful response', () => {
      let mockResponse = new Response(JSON.stringify({ data: [] }), { status: 200 });

      beforeEach(() => {
        createApiStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        createApiStub.restore();
      });

      it('should hit alert create url as post method', () => {
        CreateAlertApi.create({});
        const request = window.fetch.args[0][1];
        assert.equal(request.method, 'POST');
        assert.equal(window.fetch.args[0][0], '/api/notifications_and_alerts/alerts');
        createApiStub.restore();
      });
    });

    describe('unsuccessful response', () => {
      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        createApiStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        createApiStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      it('throws a connection error', () => {
        return CreateAlertApi.create({}).then(
          () => {
            throw new Error('Unexpected resolution');
          },
          (error) => {
            assert.equal(error.toString(), 'Error');
            createApiStub.restore();
          }
        );
      });
    });
  });
});