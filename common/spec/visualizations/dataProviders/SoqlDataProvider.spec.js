import _ from 'lodash';
import $ from 'jquery';
import SoqlDataProvider from 'common/visualizations/dataProviders/SoqlDataProvider';

describe('SoqlDataProvider', () => {
  const VALID_DOMAIN = 'example.com';
  const VALID_DATASET_UID = 'test-test';

  const INVALID_DOMAIN = null;
  const INVALID_DATASET_UID = null;

  const QUERY_COLUMNS = ['NAME_ALIAS', 'VALUE_ALIAS'];
  const QUERY_STRING = 'SELECT testName AS NAME_ALIAS, testValue AS VALUE_ALIAS WHERE testValue > 0 LIMIT 200';

  const ERROR_STATUS = 400;
  const ERROR_MESSAGE = 'Bad request';

  const SUCCESS_STATUS = 200;

  // `.query()` mock data
  const NAME_ALIAS = 'SOQL_DATA_PROVIDER_NAME_ALIAS';
  const VALUE_ALIAS = 'SOQL_DATA_PROVIDER_VALUE_ALIAS';
  const ERROR_BARS_LOWER_ALIAS = 'SOQL_DATA_PROVIDER_ERROR_BARS_LOWER_ALIAS';
  const ERROR_BARS_UPPER_ALIAS = 'SOQL_DATA_PROVIDER_ERROR_BARS_UPPER_ALIAS';

  const SAMPLE_QUERY_REQUEST_ERROR = JSON.stringify({
    'message': 'query.soql.no-such-column',
    'errorCode': 'query.soql.no-such-column',
    'data': {
      'data': {
        'column': 'ncategory',
        'dataset': 'alpha.90',
        'position': {
          'row': 1,
          'column': 8,
          'line': 'SELECT `ncategory` as SOQL_DATA_PROVIDER_NAME_ALIAS,COUNT(*) as SOQL_DATA_PROVIDER_VALUE_ALIAS GROUP BY `category` ORDER BY COUNT(*) DESC NULL LAST LIMIT 200\n       ^'
        }
      }
    }
  });

  const SAMPLE_QUERY_REQUEST_RESPONSE = JSON.stringify([
    {
      'SOQL_DATA_PROVIDER_NAME_ALIAS': 'Street and Sidewalk Cleaning',
      'SOQL_DATA_PROVIDER_VALUE_ALIAS': '103412'
    },
    {
      'SOQL_DATA_PROVIDER_NAME_ALIAS': 'Graffiti Private Property',
      'SOQL_DATA_PROVIDER_VALUE_ALIAS': '31161'
    }
  ]);

  const SAMPLE_ERROR_BARS_QUERY_REQUEST_RESPONSE = JSON.stringify([
    {
      'SOQL_DATA_PROVIDER_NAME_ALIAS': 'Street and Sidewalk Cleaning',
      'SOQL_DATA_PROVIDER_VALUE_ALIAS': '103412',
      'SOQL_DATA_PROVIDER_ERROR_BARS_LOWER_ALIAS' : '5000',
      'SOQL_DATA_PROVIDER_ERROR_BARS_UPPER_ALIAS': '15000'
    },
    {
      'SOQL_DATA_PROVIDER_NAME_ALIAS': 'Graffiti Private Property',
      'SOQL_DATA_PROVIDER_VALUE_ALIAS': '31161',
      'SOQL_DATA_PROVIDER_ERROR_BARS_LOWER_ALIAS' : '5000',
      'SOQL_DATA_PROVIDER_ERROR_BARS_UPPER_ALIAS': '15000'
    }
  ]);

  const EXPECTED_QUERY_REQUEST_COLUMNS = [NAME_ALIAS, VALUE_ALIAS];

  const EXPECTED_QUERY_REQUEST_ROWS = [
    ['Street and Sidewalk Cleaning', '103412'],
    ['Graffiti Private Property', '31161']
  ];

  const EXPECTED_QUERY_REQUEST_ERROR_BARS = [
    ['Street and Sidewalk Cleaning', '5000', '15000'],
    ['Graffiti Private Property', '5000', '15000']
  ];

  // `.getRows()` mock data
  const SAMPLE_ROW_REQUEST_ERROR = JSON.stringify({
    'message': 'query.soql.no-such-column',
    'errorCode': 'query.soql.no-such-column',
    'data': {
      'data': {
        'column': 'npoint',
        'dataset': 'alpha.90',
        'position': {
          'row': 1,
          'column': 38,
          'line': "SELECT * ORDER BY distance_in_meters(`npoint`,'POINT(-122.36434936523439 37.81005519477107)') ASC NULL LAST LIMIT 1 OFFSET 0\n                                     ^"
        }
      }
    }
  });

  const SAMPLE_ROW_REQUEST_RESPONSE = JSON.stringify([
    {
      'address': 'Intersection of TREASURE ISLAND RD and',
      'case_id': '501753',
      'category': 'General Requests',
      'closed': '2009-12-30T09:13:10.000',
      'neighborhood': 'Treasure Island/YBI',
      'opened': '2009-09-09T06:50:28.000',
      'point': {
        'type': 'Point',
        'coordinates': [-122.36357929, 37.808938925]
      },
      'request_details': 'tida - tida - request_for_service',
      'request_type': 'tida - tida - request_for_service',
      'responsible_agency': 'PUC - Electric/Power - G - Hold',
      'source': 'Voice In',
      'status': 'Closed',
      'supervisor_district': '6',
      'updated': '2009-12-30T09:13:10.000',
      'can_be_blank': 'not blank this time'
    },
    {
      'address': '83 S King St',
      'case_id': '12345',
      'category': 'General Requests',
      'closed': '2009-12-30T09:13:10.000',
      'neighborhood': 'Treasure Island/YBI',
      'opened': '2009-09-09T06:50:28.000',
      'point': {
        'type': 'Point',
        'coordinates': [-120, 30]
      },
      'request_details': 'foo',
      'request_type': 'bar',
      'responsible_agency': 'baz',
      'source': 'BATMAN',
      'status': 'Closed',
      'supervisor_district': '1',
      'updated': '2009-12-30T09:13:10.000'
    }
  ]);

  const SAMPLE_DATASET_METADATA = {
    'columns':
      Object.keys(JSON.parse(SAMPLE_ROW_REQUEST_RESPONSE)[0]).map((columnName) => {
        return {
          fieldName: columnName
        };
      })
  };

  const SAMPLE_METADATA_ERROR = JSON.stringify({
    'code' : 'not_found',
    'error' : true,
    'message' : 'Cannot find view with id 56p4-vdcc.jso'
  });

  const EXPECTED_ROW_COUNT = 100;

  const SAMPLE_ROW_COUNT_RESPONSE = JSON.stringify([{ __count_alias__: EXPECTED_ROW_COUNT }]);

  let server;

  function _respondWithError(payload) {
    server.respond([ERROR_STATUS, { 'Content-Type': 'application/json' }, payload]);
  }

  function _respondWithSuccess(payload) {
    server.respond([SUCCESS_STATUS, { 'Content-Type': 'application/json' }, payload]);
  }

  describe('constructor', () => {
    describe('when called with invalid configuration options', () => {
      it('should throw', () => {
        assert.throw(() => {
          const soqlDataProvider = new SoqlDataProvider({
            domain: INVALID_DOMAIN,
            datasetUid: VALID_DATASET_UID
          });
        });

        assert.throw(() => {
          const soqlDataProvider = new SoqlDataProvider({
            domain: VALID_DOMAIN,
            datasetUid: INVALID_DATASET_UID
          });
        });
      });
    });
  });

  describe('`.query()`', () => {
    describe('on request error', () => {
      const soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      let soqlDataProvider;

      beforeEach(() => {
        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(() => {
        server.restore();
      });

      describe('cross-domain request', () => {
        it('should not provide the X-Socrata-Federation header', () => {
          soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
          assert.lengthOf(server.requests, 1);
          assert.notProperty(
            server.requests[0].requestHeaders,
            'X-Socrata-Federation'
          );
        });
      });

      describe('same-domain request', () => {
        it('should provide the X-Socrata-Federation header', () => {
          soqlDataProvider = new SoqlDataProvider({
            domain: window.location.hostname,
            datasetUid: VALID_DATASET_UID
          });
          soqlDataProvider.query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS);
          assert.lengthOf(server.requests, 1);
          assert.propertyVal(
            server.requests[0].requestHeaders,
            'X-Socrata-Federation',
            'Honey Badger'
          );
        });
      });

      it('should return an object containing "status", "message" and "soqlError" properties', (done) => {
        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            (data) => {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            (error) => {

              assert.property(error, 'status');
              assert.property(error, 'message');
              assert.property(error, 'soqlError');
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });

      it('should include the correct request error status', (done) => {
        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            (data) => {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            (error) => {

              assert.equal(error.status, ERROR_STATUS);
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });

      it('should include the correct request error message', (done) => {
        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {

              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });

      it('should include the correct soqlError object', (done) => {

        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {

              assert.deepEqual(error.soqlError, JSON.parse(SAMPLE_QUERY_REQUEST_ERROR));
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });
    });

    describe('on request success', (done) => {
      const soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      let soqlDataProvider;

      beforeEach(() => {
        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(() => {
        server.restore();
      });

      it('should return an object containing columns and rows', (done) => {
        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            (data) => {

              assert.property(data, 'columns');
              assert.property(data, 'rows');
              done();
            },
            (error) => {

              // Fail the test since we expected an success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_QUERY_REQUEST_RESPONSE);
      });

      it('should return the expected columns', (done) => {
        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            (data) => {

              assert.deepEqual(data.columns, EXPECTED_QUERY_REQUEST_COLUMNS);
              done();
            },
            (error) => {

              // Fail the test since we expected an success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_QUERY_REQUEST_RESPONSE);
      });

      it('should return the expected rows', (done) => {
        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS).
          then(
            (data) => {

              assert.deepEqual(data.rows, EXPECTED_QUERY_REQUEST_ROWS);
              done();
            },
            (error) => {

              // Fail the test since we expected an success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_QUERY_REQUEST_RESPONSE);
      });

      it('should return the expected errorBars', (done) => {
        soqlDataProvider.
          query(QUERY_STRING, NAME_ALIAS, VALUE_ALIAS, ERROR_BARS_LOWER_ALIAS, ERROR_BARS_UPPER_ALIAS).
          then(
            (data) => {

              assert.deepEqual(data.errorBars, EXPECTED_QUERY_REQUEST_ERROR_BARS);
              done();
            },
            (error) => {

              // Fail the test since we expected an success response.
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_ERROR_BARS_QUERY_REQUEST_RESPONSE);
      });
    });
  });

  describe('.rawQuery()', () => {
    const soqlDataProviderOptions = {
      domain: VALID_DOMAIN,
      datasetUid: VALID_DATASET_UID
    };
    let soqlDataProvider;

    beforeEach(() => {
      server = sinon.fakeServer.create();
      soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
    });

    afterEach(() => {
      server.restore();
    });

    describe('on request error', () => {
      it('should include the correct request error status and message', (done) => {
        soqlDataProvider.
          rawQuery(QUERY_STRING).
          then(
            (data) => {

              // Fail the test since we expected an error response.
              assert.isTrue(undefined);
              done();
            },
            (error) => {
              assert.equal(error.status, ERROR_STATUS);
              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_QUERY_REQUEST_ERROR);
      });
    });

    describe('on request success', () => {
      it('should return the raw data', (done) => {
        soqlDataProvider.
          rawQuery(QUERY_STRING).
          then(
            (data) => {
              assert.deepEqual(JSON.stringify(data), SAMPLE_QUERY_REQUEST_RESPONSE);
              done();
            },
            (error) => {
              assert.isTrue(undefined);
              done();
            }
          ).catch(
            done
          );

        _respondWithSuccess(SAMPLE_QUERY_REQUEST_RESPONSE);
      });
    });
  });

  describe('`.getRows()`', () => {
    describe('on request error', () => {
      const soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      let soqlDataProvider;

      beforeEach(() => {
        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(() => {
        server.restore();
      });

      describe('cross-domain request', () => {
        it('should not provide the X-Socrata-Federation header', () => {
          soqlDataProvider.getRows(QUERY_COLUMNS, QUERY_STRING);
          assert.lengthOf(server.requests, 1);
          assert.notProperty(
            server.requests[0].requestHeaders,
            'X-Socrata-Federation'
          );
        });
      });

      describe('same-domain request', () => {
        it('should provide the X-Socrata-Federation header', () => {
          soqlDataProvider = new SoqlDataProvider({
            domain: window.location.hostname,
            datasetUid: VALID_DATASET_UID
          });
          soqlDataProvider.getRows(QUERY_COLUMNS, QUERY_STRING);
          assert.lengthOf(server.requests, 1);
          assert.propertyVal(
            server.requests[0].requestHeaders,
            'X-Socrata-Federation',
            'Honey Badger'
          );
        });
      });

      it('should return an object containing "status", "message" and "soqlError" properties', (done) => {
        soqlDataProvider.
          getRows(QUERY_COLUMNS, QUERY_STRING).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {

              assert.property(error, 'status');
              assert.property(error, 'message');
              assert.property(error, 'soqlError');
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct request error status', (done) => {
        soqlDataProvider.
          getRows(QUERY_COLUMNS, QUERY_STRING).
          then(
            (data) => {
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {

              assert.equal(error.status, ERROR_STATUS);
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct request error message', (done) => {
        soqlDataProvider.
          getRows(QUERY_COLUMNS, QUERY_STRING).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {
              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct soqlError object', (done) => {

        soqlDataProvider.
          getRows(QUERY_COLUMNS, QUERY_STRING).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {
              assert.deepEqual(error.soqlError, JSON.parse(SAMPLE_ROW_REQUEST_ERROR));
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });
    });

    describe('on request success', (done) => {
      const soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      let soqlDataProvider;

      const columnsToRetrieve = [
        'address', // Exists, always non null
        'point',   // Exists, always non null
        'can_be_blank', // Sometimes is null.
        'always_blank' // Always null.
      ];

      const expectedRowResults = [
        [
          'Intersection of TREASURE ISLAND RD and',
          {
            'type': 'Point',
            'coordinates': [-122.36357929, 37.808938925]
          },
          'not blank this time',
          undefined
        ],
        [
          '83 S King St',
          {
            'type': 'Point',
            'coordinates': [-120, 30]
          },
          undefined,
          undefined
        ]
      ];


      beforeEach(() => {
        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(() => {
        server.restore();
      });

      it('should return an object containing columns and rows', (done) => {
        soqlDataProvider.
          getRows(columnsToRetrieve, QUERY_STRING).
          then(
            (data) => {

              assert.property(data, 'columns');
              assert.property(data, 'rows');
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_REQUEST_RESPONSE);
      });

      it('should return the expected columns', (done) => {
        soqlDataProvider.
          getRows(columnsToRetrieve, QUERY_STRING).
          then(
            (data) => {

              assert.deepEqual(data.columns, columnsToRetrieve);
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_REQUEST_RESPONSE);
      });

      it('should return the expected rows', (done) => {
        soqlDataProvider.
          getRows(columnsToRetrieve, QUERY_STRING).
          then(
            (data) => {

              assert.deepEqual(data.rows, expectedRowResults);
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_REQUEST_RESPONSE);
      });
    });
  });

  describe('.getTableData()', () => {
    const soqlDataProviderOptions = {
      domain: VALID_DOMAIN,
      datasetUid: VALID_DATASET_UID
    };

    // These tests don't resolve any data requests -
    // we only care about what query gets generated.
    describe('resultant query', () => {
      let soqlDataProvider;
      let server;

      beforeEach(() => {
        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(() => {
        server.restore();
      });

      describe('cross-domain request', () => {
        it('should not provide the X-Socrata-Federation header', () => {
          soqlDataProvider.getTableData(['a'], [{ columnName: 'a', ascending: true }], 0, 10);
          assert.lengthOf(server.requests, 1);
          assert.notProperty(
            server.requests[0].requestHeaders,
            'X-Socrata-Federation'
          );
        });
      });

      describe('same-domain request', () => {
        it('should provide the X-Socrata-Federation header', () => {
          soqlDataProvider = new SoqlDataProvider({
            domain: window.location.hostname,
            datasetUid: VALID_DATASET_UID
          });
          soqlDataProvider.getTableData(['a'], [{ columnName: 'a', ascending: true }], 0, 10);
          assert.lengthOf(server.requests, 1);
          assert.propertyVal(
            server.requests[0].requestHeaders,
            'X-Socrata-Federation',
            'Honey Badger'
          );
        });
      });

      // function getTableData (columnNames, order, offset, limit) { ... }
      const argumentsAndExpectedQueryPairs = [
        {
          args: [['foo', 'bar'], [{ columnName: 'foo', ascending: true }], 0, 10],
          resultantQueryParts: ['$select=*', '$order=`foo`+ASC', '$offset=0', '$limit=10']
        },
        {
          args: [['bar', 'foo'], [{ columnName: 'foo', ascending: false }], 100, 88],
          resultantQueryParts: ['$select=*', '$order=`foo`+DESC', '$offset=100', '$limit=88']
        },
        {
          args: [['baz'], [{ columnName: 'what', ascending: false }], 10, 2],
          resultantQueryParts: ['$select=*', '$order=`what`+DESC', '$offset=10', '$limit=2']
        }
      ];

      argumentsAndExpectedQueryPairs.map((pair) => { // eslint-disable-line array-callback-return
        const args = pair.args;
        const resultantQueryParts = pair.resultantQueryParts;

        it('should query', () => {
          soqlDataProvider.getTableData.apply(soqlDataProvider, args);

          assert.lengthOf(server.requests, 1);
          const { url } = server.requests[0];

          assert.include(url, '$$read_from_nbe=true');
          assert.include(url, '$$version=2.1');
        });

        resultantQueryParts.map((queryPart) => { // eslint-disable-line array-callback-return
          it('given arguments {0} should produce query part {1}'.format(args.join(), queryPart), () => {
            soqlDataProvider.getTableData.apply(soqlDataProvider, args);

            assert.lengthOf(server.requests, 1);
            const { url } = server.requests[0];
            assert.include(url, queryPart);
          });
        });
      });
    });

    describe('on request error', () => {
      let soqlDataProvider;

      beforeEach(() => {
        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(() => {
        server.restore();
      });

      it('should return an object containing "status", "message" and "soqlError" properties', (done) => {

        soqlDataProvider.
          getTableData(['a'], [{ columnName: 'a', ascending: true }], 0, 10).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {

              assert.property(error, 'status');
              assert.property(error, 'message');
              assert.property(error, 'soqlError');
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct request error status', (done) => {
        soqlDataProvider.
          getTableData(['a'], [{ columnName: 'a', ascending: true }], 0, 10).
          then(
            (data) => {
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {

              assert.equal(error.status, ERROR_STATUS);
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct request error message', (done) => {
        soqlDataProvider.
          getTableData(['a'], [{ columnName: 'a', ascending: true }], 0, 10).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {
              assert.equal(error.message.toLowerCase(), ERROR_MESSAGE.toLowerCase());
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });

      it('should include the correct soqlError object', (done) => {
        soqlDataProvider.
          getTableData(['a'], [{ columnName: 'a', ascending: true }], 0, 10).
          then(
            (data) => {
              // Fail the test since we expected an error response.
              done('Request succeeded, we did not expect it to.');
            },
            (error) => {
              assert.deepEqual(error.soqlError, JSON.parse(SAMPLE_ROW_REQUEST_ERROR));
              done();
            }
          ).catch(
            done
          );

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });
    });

    describe('on request success', (done) => {
      const soqlDataProviderOptions = {
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      };
      let soqlDataProvider;

      beforeEach(() => {
        server = sinon.fakeServer.create();
        soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
      });

      afterEach(() => {
        server.restore();
      });

      it('should return the expected columns', (done) => {
        soqlDataProvider.
          getTableData(['columnA', 'columnB'], [{ columnName: 'columnA', ascending: true }], 0, 10).
          then(
            (data) => {

              assert.deepEqual(data.columns, ['columnA', 'columnB']);
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_REQUEST_RESPONSE);
      });

      it('should return the expected rows', (done) => {
        soqlDataProvider.
          getTableData(['columnA', 'columnB'], [{ columnName: 'columnA', ascending: true }], 0, 10).
          then(
            (data) => {

              assert.deepEqual(data.rows, [
                ['column A value 1', 'column B value 1'],
                ['column A value 2', 'column B value 2']
              ]);
              done();
            },
            done
          ).catch(done);

        _respondWithSuccess(
          JSON.stringify([
            {
              'columnA': 'column A value 1',
              'columnB': 'column B value 1',
              'someOtherColumn': 'some other value 1'
            },
            {
              'columnA': 'column A value 2',
              'columnB': 'column B value 2',
              'someOtherColumn': 'some other value 2'
            }
          ])
        );
      });
    });
  });

  describe('getRowCount()', () => {
    let soqlDataProvider;
    const soqlDataProviderOptions = {
      domain: VALID_DOMAIN,
      datasetUid: VALID_DATASET_UID
    };

    beforeEach(() => {
      server = sinon.fakeServer.create();
      soqlDataProvider = new SoqlDataProvider(soqlDataProviderOptions);
    });

    afterEach(() => {
      server.restore();
    });

    it('should query the NBE by default', () => {
      soqlDataProvider.getRowCount(); // Discard response, we don't care.
      const { url } = server.requests[0];

      assert.lengthOf(server.requests, 1);
      assert.include(url, '$$read_from_nbe=true');
      assert.include(url, '$$version=2.1');
    });

    it('should query the OBE if configured', () => {
      soqlDataProvider = new SoqlDataProvider({
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID,
        readFromNbe: false
      });
      soqlDataProvider.getRowCount(); // Discard response, we don't care.
      const { url } = server.requests[0];

      assert.lengthOf(server.requests, 1);
      assert.notInclude(url, '$$read_from_nbe=true');
      assert.notInclude(url, '$$version=2.1');
    });

    describe('on request error', () => {
      it('should return an object containing "status", "message" and "soqlError" properties', (done) => {
        soqlDataProvider.getRowCount().then(
          done,
          (error) => {
            assert.property(error, 'status');
            assert.equal(error.status, ERROR_STATUS);
            done();
          }
        ).catch(done);

        _respondWithError(SAMPLE_ROW_REQUEST_ERROR);
      });
    });

    describe('on request success', () => {
      it('should return an Array containing an Object with key `count`.', (done) => {
        soqlDataProvider.getRowCount().then(
          (count) => {
            assert.equal(count, EXPECTED_ROW_COUNT);
            done();
          },
          done
        ).catch(done);

        _respondWithSuccess(SAMPLE_ROW_COUNT_RESPONSE);
      });
    });
  });

  describe('getColumnStats()', () => {
    let soqlDataProvider;

    const moneyColumn = {
      fieldName: 'moneyColumn',
      dataTypeName: 'money'
    };

    const numberColumn = {
      fieldName: 'numberColumn',
      dataTypeName: 'number'
    };

    const textColumn = {
      fieldName: 'textColumn',
      dataTypeName: 'text'
    };

    const fakeColumn = {
      fieldName: 'soFakeYouDontEvenKnow',
      dataTypeName: 'elusive'
    };

    const calendarDateColumn = {
      fieldName: 'calendarDateColumn',
      dataTypeName: 'calendar_date'
    };

    beforeEach(() => {
      server = sinon.fakeServer.create();
      soqlDataProvider = new SoqlDataProvider({
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      });
    });

    afterEach(() => {
      server.restore();
    });

    it('errors if input is not an array', () => {
      assert.throw(() => soqlDataProvider.getColumnStats());
      assert.throw(() => soqlDataProvider.getColumnStats({}));
    });

    it('fetches stats for money columns', () => {
      soqlDataProvider.getColumnStats([moneyColumn]);
      const { url } = server.requests[0];
      assert.lengthOf(server.requests, 1);
      assert.match(url, /select.+min/);
      assert.match(url, /select.+max/);
    });

    it('fetches stats for number columns', () => {
      soqlDataProvider.getColumnStats([numberColumn]);
      const { url } = server.requests[0];
      assert.lengthOf(server.requests, 1);
      assert.match(url, /select.+min/);
      assert.match(url, /select.+max/);
    });

    it('fetches stats for number column from core metadata if available', () => {
      soqlDataProvider.getColumnStats([{
        dataTypeName: 'number',
        cachedContents: {
          smallest: 1,
          largest: 10
        }
      }]).then(
        (stats) => {
          assert.equal(stats[0].rangeMin, 1);
          assert.equal(stats[0].rangeMax, 10);
        }
      );
      assert.lengthOf(server.requests, 0);
    });

    it('fetches stats for calendar_date columns', () => {
      soqlDataProvider.getColumnStats([calendarDateColumn]);
      const { url } = server.requests[0];
      assert.lengthOf(server.requests, 1);
      assert.match(url, /select.+min/);
      assert.match(url, /select.+max/);
    });

    it('fetches stats for calendar_date column from core metadata if available', () => {
      soqlDataProvider.getColumnStats([{
        dataTypeName: 'calendar_date',
        cachedContents: {
          smallest: '2017-01-31T00:00:00',
          largest: '2019-12-31T00:00:00'
        }
      }]).then(
        (stats) => {
          assert.equal(stats[0].rangeMin, '2017-01-31T00:00:00');
          assert.equal(stats[0].rangeMax, '2019-12-31T00:00:00');
        }
      );
      assert.lengthOf(server.requests, 0);
    });

    it('fetches stats for text columns', () => {
      soqlDataProvider.getColumnStats([textColumn]);
      const { url } = server.requests[0];
      assert.lengthOf(server.requests, 1);
      assert.match(url, /select.+count/);
    });

    it('fetches stats for text column from core metadata if available', () => {
      return soqlDataProvider.getColumnStats([{
        dataTypeName: 'text',
        cachedContents: {
          top: [{ item: 'best', count: 10 }]
        }
      }]).then(
        (stats) => {
          assert.deepEqual(stats[0].top, [{ item: 'best', count: 10 }]);
          assert.lengthOf(server.requests, 0);
        }
      );
    });

    it('only fetches stats for number, calendar_date, and text columns', () => {
      soqlDataProvider.getColumnStats([textColumn, numberColumn, calendarDateColumn, fakeColumn]);
      assert.lengthOf(server.requests, 3);
    });

    it('passes through errors', (done) => {
      soqlDataProvider.getColumnStats([numberColumn]).then((a) => {
        throw new Error('Expected promise to reject');
      }).catch(() => done());

      _respondWithError('');
    });
  });

  describe('match()', () => {
    let soqlDataProvider;

    beforeEach(() => {
      server = sinon.fakeServer.create();
      soqlDataProvider = new SoqlDataProvider({
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      });
    });

    it('fetches a limit 1 query', () => {
      soqlDataProvider.match('columnName', 'something');
      assert.lengthOf(server.requests, 1);
    });

    it('rejects when term is not found', (done) => {
      soqlDataProvider.match('columnName', 'something').
        then(done).
        catch(() => done());

      server.respond([200, { 'Content-Type': 'application/json' }, '[]']);
    });

    it('resolves when term is found', (done) => {
      soqlDataProvider.match('columnName', 'something').
        then(() => done()).
        catch(done);

      server.respond([200, { 'Content-Type': 'application/json' }, '[{"columnName": "value"}]']);
    });
  });

  describe('cache behavior', () => {

    let soqlDataProvider;

    const textColumn = {
      fieldName: 'textColumn',
      dataTypeName: 'text'
    };

    beforeEach(() => {
      server = sinon.fakeServer.create();
      soqlDataProvider = new SoqlDataProvider({
        domain: VALID_DOMAIN,
        datasetUid: VALID_DATASET_UID
      });
    });

    afterEach(() => {
      server.restore();
    });

    it('only performs one request even though the data are requested multiple times', () => {
      soqlDataProvider.getColumnStats([textColumn, textColumn, textColumn, textColumn]);
      assert.lengthOf(server.requests, 1);
    });

  });

});
