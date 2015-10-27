describe('blist.dataset', function () {
  beforeEach(function() {
    blist.configuration = {};
    blist.feature_flags = {};
  });

  it('should instantiate', function() {
    new Dataset();
  });

  describe('isSpatialDataContainer', function() {

    var dataset;

    beforeEach(function() {
      dataset = new Dataset({id: 'test-test'});
    });

    describe('if dataset has spatially typed column', function() {

      it('should return true', function() {
        dataset.columns = [ {dataTypeName: 'point'}, {dataTypeName: 'date'} ];
        expect(dataset.isSpatialDataContainer()).to.equal(true);
      });
    });

    describe('if dataset has no spatially typed columns', function() {

      it('should return false', function() {
        dataset.columns = [ {dataTypeName: 'text'}, {dataTypeName: 'date'} ];
        expect(dataset.isSpatialDataContainer()).to.equal(false);
      });
    });
  })

  describe('isLayered', function() {
    var dataset;

    beforeEach(function() {
      dataset = new Dataset({id: 'test-test'});
    });

    describe('if the dataset has no layers', function() {

      it('should return false', function() {
        dataset.metadata = { geo: { layers: 'four-four' }};
        expect(dataset.isLayered()).to.equal(false);
      });

    });

    describe('if the view is a derived view with no added datasets or layers', function() {

      it('should return false', function() {
        dataset.displayFormat = { viewDefinitions: [ {uid: 'self' }, {uid: 'self'} ] }
        expect(dataset.isLayered()).to.equal(false);
      });

    });

    describe('if the dataset has direct layers', function() {

      it('should return true', function() {
        dataset.metadata = { geo: { layers: 'four-four,meow-meow' }};
        expect(dataset.isLayered()).to.equal(true);
      });

    });

    describe('if the view has layers from an added dataset', function() {

      it('should return true', function() {
        dataset.displayFormat = { viewDefinitions: [ {uid: 'self' }, {uid: 'meow-meow'} ] }
        expect(dataset.isLayered()).to.equal(true);
      });
    });
  });

  describe('_getRelatedDataLenses', function() {
    var dataset;

    beforeEach(function() {
      dataset = new Dataset({id: 'test-test'});
    });

    describe('if getNewBackendId fails', function() {
      beforeEach(function() {
        sinon.stub(dataset, 'getNewBackendId', function() {
          return generateRejectedPromise('I reject you');
        });
      });

      it('should reject the promise', function(done) {
        var promise = dataset._getRelatedDataLenses(false);

        promise.fail(function(reason) {
          expect(reason).to.equal('I reject you');
          done();
        });
      });
    });

    describe('if getNewBackendId succeeds', function() {
      beforeEach(function() {
        sinon.stub(dataset, 'getNewBackendId', function() {
          return $.when('asdf-asdf');
        });
      });

      describe('_fetchViewJson fails', function() {
        beforeEach(function() {
          sinon.stub(dataset, '_fetchViewJson', function() {
            return generateRejectedPromise('rejection from _fetchViewJson');
          });
        });

        it('should reject the promise', function(done) {
          var promise = dataset._getRelatedDataLenses(false);

          promise.fail(function(reason) {
            expect(reason).to.equal('rejection from _fetchViewJson');
            done();
          });
        });
      });

      describe('_fetchViewJson succeeds', function() {
        beforeEach(function() {
          sinon.stub(dataset, '_fetchViewJson', function() {
            return $.when({tableId: 20});
          });
        });

        describe('_lookUpDataLensesByTableId fails', function() {
          beforeEach(function() {
            sinon.stub(dataset, '_lookUpDataLensesByTableId', function() {
              return generateRejectedPromise('rejection from _lookUpDataLensesByTableId');
            });
          });

          it('should reject the promise', function(done) {
            var promise = dataset._getRelatedDataLenses(false);

            promise.fail(function(reason) {
              expect(reason).to.equal('rejection from _lookUpDataLensesByTableId');
              done();
            });
          });
        });

        describe('_lookUpDataLensesByTableId succeeds', function() {
          beforeEach(function() {
            sinon.stub(dataset, '_lookUpDataLensesByTableId', function() {
              return $.when('awesome sauce');
            });
          });

          describe('_onlyDataLenses fails', function() {
            beforeEach(function() {
              sinon.stub(dataset, '_onlyDataLenses', function() {
                return generateRejectedPromise('rejection from _onlyDataLenses');
              });
            });

            it('should reject the promise', function(done) {
              var promise = dataset._getRelatedDataLenses(false);

              promise.fail(function(reason) {
                expect(reason).to.equal('rejection from _onlyDataLenses');
                done();
              });
            });
          });

          describe('_onlyDataLenses succeeds', function() {
            beforeEach(function() {
              sinon.stub(dataset, '_onlyDataLenses', function() {
                return $.when('awesome dinosaurs');
              });
            });

            it('should return the result from _onlyDataLenses', function(done) {
              var promise = dataset._getRelatedDataLenses(false);

              promise.done(function(result) {
                expect(result).to.equal('awesome dinosaurs');
                done();
              });
            });
          });
        });
      });
    });
  });

  function generateRejectedPromise(payload) {
    var deferred = $.Deferred();

    deferred.reject(payload);
    return deferred.promise();
  }
});
