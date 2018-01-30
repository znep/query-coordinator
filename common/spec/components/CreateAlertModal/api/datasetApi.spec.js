import airbrake from 'common/airbrake';
import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';

describe('datasetApi', () => {
  let getColumnsStub;
  let getTopValuesByColumnStub;
  let airBrakeStub;
  let consoleErrorStub;

  describe('datasetApi.getColumns', () => {
    describe('successful response', () => {
      const mockResponse = new Response(
        JSON.stringify({
          'columns': [
            {
              'name': 'test_asset',
              'dataTypeName': 'test_dataTypeName',
              'fieldName': 'test_filed_name'
            }
          ]
        }), { status: 200 }
      );

      beforeEach(() => {
        getColumnsStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        getColumnsStub.restore();
      });

      it('should get dataset columns in dataset', () => {
        const expectedOutput = [{
          column_type: 'test_dataTypeName',
          title: 'test_asset',
          value: 'test_filed_name'
        }];

        return datasetApi.getColumns({ viewId: 'test-tset' }).then((res) => {
          const request = window.fetch.args[0][1];
          assert.equal(request.method, 'GET');
          assert.equal(window.fetch.args[0][0], '/api/views/test-tset.json');
          assert.deepEqual(res, expectedOutput);
          getColumnsStub.restore();
        });
      });
    });

    describe('unsuccessful response', () => {

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        getColumnsStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        getColumnsStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return datasetApi.getColumns({ viewId: 'test-tset' }).then(
          () => {
            throw new Error('Unexpected resolution');
          },
          (error) => {
            getColumnsStub.restore();
            assert.equal(error.toString(), 'Error');
          }
          );
      });
    });
  });

  describe('datasetApi.getTopValuesByColumn', () => {

    describe('successful response', () => {
      const mockResponse = new Response(
        JSON.stringify([{ 'test_column': 'test_column' }]), { status: 200 });

      beforeEach(() => {
        getTopValuesByColumnStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        getTopValuesByColumnStub.restore();
      });

      it('should get top values by column in dataset using get method', () => {
        const params = { column: 'test_column', limit: 10, viewId: 'test-tset' };
        const expectedOutput = [{
          title: 'test_column',
          value: 'test_column'
        }];

        return datasetApi.getTopValuesByColumn(params).then((res) => {
          const request = window.fetch.args[0][1];
          assert.equal(request.method, 'GET');
          assert.equal(
            window.fetch.args[0][0],
            '/resource/test-tset.json?$select=test_column&$group=test_column&$limit=10');
          assert.deepEqual(res, expectedOutput);
          getTopValuesByColumnStub.restore();
        });
      });
    });

    describe('unsuccessful response', () => {
      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        getTopValuesByColumnStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        getTopValuesByColumnStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return datasetApi.getTopValuesByColumn({ column: 'point', limit: 10, viewId: 'test-tset' }).then(
          () => {
            throw new Error('Unexpected resolution');
          },
          (error) => {
            getTopValuesByColumnStub.restore();
            assert.equal(error.toString(), 'Error');
          }
          );
      });
    });
  });

  describe('datasetApi.getMigration', () => {
    let getMigrationStub;

    describe('successful response', () => {
      const mockResponse = new Response(JSON.stringify({ valid:true }), { status: 200 });

      beforeEach(() => {
        getMigrationStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        getMigrationStub.restore();
      });

      it('should get migration info of the dataset', () => {

        return datasetApi.getMigration({ viewId: 'test-tset' }).then((res) => {
          const request = window.fetch.args[0][1];
          assert.equal(request.method, 'GET');
          assert.equal(window.fetch.args[0][0], '/api/migrations/test-tset.json');
          getMigrationStub.restore();
        });
      });
    });

    describe('unsuccessful response', () => {

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        getMigrationStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        getMigrationStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return datasetApi.getMigration({ viewId: 'test-tset' }).then(
          (res) => {
            assert.deepEqual(res, {});
          },
          (error) => {
            getColumnsStub.restore();
            assert.equal(error.toString(), 'Error');
          }
          );
      });
    });
  });

  describe('datasetApi.getMatchingColumnValues', () => {
    let getColumnValuesStub;

    describe('successful response', () => {
      const mockResponse = new Response(JSON.stringify([{ 'test': 'test' }]), { status: 200 });

      beforeEach(() => {
        getColumnValuesStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        getColumnValuesStub.restore();
      });

      it('should get column values from dataset using get method', () => {
        const params = { column: 'test', searchText: 'test', viewId: 'test-tset' };
        const expectedOutput = [{
          title: 'test',
          value: 'test'
        }];

        return datasetApi.getMatchingColumnValues(params).then((res) => {
          const request = window.fetch.args[0][1];
          assert.equal(request.method, 'GET');
          assert.equal(
            window.fetch.args[0][0],
            '/resource/test-tset.json?$select=test&$group=test&$$read_from_nbe=true&$where=UPPER(test) like \'%25TEST%25\''
            );
          assert.deepEqual(res, expectedOutput);
          getColumnValuesStub.restore();
        });
      });
    });

    describe('unsuccessful response', () => {
      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        getColumnValuesStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        getColumnValuesStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return datasetApi.getMatchingColumnValues({ viewId: 'test-tset' }).then(
          (res) => {
            throw new Error('Unexpected resolution');
          },
          (error) => {
            getColumnsStub.restore();
            assert.equal(error.toString(), 'Error');
          }
          );
      });
    });
  });

  describe('datasetApi.geoSearch', () => {
    let geoSearchStub;

    describe('successful response', () => {
      const mockResponse = new Response(
        JSON.stringify({
          'features': [
            {
              'place_name': 'test_place',
              'geometry': 'test_geometry'
            }
          ]
        }), { status: 200 }
        );

      beforeEach(() => {
        geoSearchStub = sinon.stub(window, 'fetch').returns(Promise.resolve(mockResponse));
      });

      afterEach(() => {
        geoSearchStub.restore();
      });

      it('should get places using geo search', () => {
        const expectedOutput = [{
          geometry: 'test_geometry',
          title: 'test_place',
          value: 'test_place'
        }];

        return datasetApi.geoSearch('test', 'RANDOM TOKEN').then((res) => {
          const request = window.fetch.args[0][1];
          assert.equal(request.method, 'GET');
          assert.equal(
            window.fetch.args[0][0],
            'https://a.tiles.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=RANDOM TOKEN'
            );
          assert.deepEqual(res, expectedOutput);
          geoSearchStub.restore();
        });
      });

      it('should retrun empty array if access token is undefined', () => {
        return datasetApi.geoSearch('test', null).then((res) => {
          assert.deepEqual(res, []);
          geoSearchStub.restore();
        });
      });
    });

    describe('unsuccessful response', () => {
      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        geoSearchStub = sinon.stub(window, 'fetch').returns(Promise.resolve({ status: 500 }));
      });

      afterEach(() => {
        geoSearchStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return datasetApi.geoSearch('test', 'RANDOM TOKEN').then(
          (res) => {
            throw new Error('Unexpected resolution');
          },
          (error) => {
            getColumnsStub.restore();
            assert.equal(error.toString(), 'Error');
          }
          );
      });
    });
  });
});
