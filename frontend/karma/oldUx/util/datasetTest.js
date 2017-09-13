import sinon from 'sinon';
import { expect, assert } from 'chai';

describe('blist.dataset', function () {
  beforeEach(function() {
    blist.configuration = {};
    blist.feature_flags = {};
    blist.rights = {
      view: {}
    }
    blist.datatypes = {
      text: {}
    };
  });

  it('should instantiate', function() {
    new Dataset();
  });

  describe('cleanCopyIncludingRenderTypeName', function() {

    it('returns a JSON representation of the dataset in which columns have a "renderTypeName" property', function() {
      var dataset = new Dataset({
        columns: [
          {
            id: 1,
            fieldName: 'test',
            dataTypeName: 'text',
            renderTypeName: 'text'
          }
        ]
      });

      var outputWithoutRenderTypeName = dataset.cleanCopy();
      var outputWithRenderTypeName = dataset.cleanCopyIncludingRenderTypeName();

      expect(_.get(outputWithoutRenderTypeName, 'columns[0].renderTypeName', 'wrong')).to.equal('wrong');
      expect(_.get(outputWithRenderTypeName, 'columns[0].renderTypeName', 'wrong')).to.equal('text');

      delete outputWithRenderTypeName.columns[0].renderTypeName;

      expect(outputWithoutRenderTypeName).to.deep.equal(outputWithRenderTypeName);
    });

    it('returns a JSON representation of the column that has a "renderTypeName" property', function() {
      var column = new Column({
        id: 1,
        fieldName: 'test',
        dataTypeName: 'text',
        renderTypeName: 'text'
      });

      var outputWithoutRenderTypeName = column.cleanCopy();
      var outputWithRenderTypeName = column.cleanCopyIncludingRenderTypeName();

      expect(_.get(outputWithoutRenderTypeName, 'renderTypeName', 'wrong')).to.equal('wrong');
      expect(_.get(outputWithRenderTypeName, 'renderTypeName', 'wrong')).to.equal('text');

      delete outputWithRenderTypeName.renderTypeName;

      expect(outputWithoutRenderTypeName).to.deep.equal(outputWithRenderTypeName);
    });

    it('returns a JSON representation of the base model that is identical to a normal clean copy', function() {
      var model = new Model({
        id: 1,
        fieldName: 'test',
        dataTypeName: 'text',
        renderTypeName: 'text'
      });

      var outputWithoutRenderTypeName = model.cleanCopy();
      var outputWithRenderTypeName = model.cleanCopyIncludingRenderTypeName();

      expect(outputWithoutRenderTypeName).to.deep.equal(outputWithRenderTypeName);
    });
  });

  describe('saving', function() {

    describe('when the `enable_2017_grid_refresh` feature flag is set to false', function() {
      var dataset;

      beforeEach(function() {
        delete blist.feature_flags.enable_2017_grid_refresh;
        dataset = new Dataset({metadata:{renderTypeConfig:{}}});
        sinon.stub(dataset, 'makeRequest');
      });

      it('should succeed', function() {
        expect(function() { dataset.save(); }).to.not.throw();
      });
    });

    describe('when the `enable_2017_grid_refresh` feature flag is set to true', function() {
      var dataset;

      beforeEach(function() {
        blist.feature_flags.enable_2017_grid_refresh = true;
        dataset = new Dataset({metadata:{renderTypeConfig:{}}});
        sinon.stub(dataset, 'makeRequest');
      });

      afterEach(function() {
        delete blist.feature_flags.enable_2017_grid_refresh;
      });


      it('should succeed', function() {
        expect(function() { dataset.save(); }).to.not.throw();
      });

      it('should not fail when there is somehow no originalDatasetTypeMetadata to restore', function() {
        delete window.blist.originalDatasetTypeMetadata;

        expect(function() { dataset.save(); }).to.not.throw();
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
        sinon.stub(dataset, 'getNewBackendId').callsFake(function() {
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
        sinon.stub(dataset, 'getNewBackendId').callsFake(function() {
          return $.when('asdf-asdf');
        });
      });

      describe('_fetchViewJson fails', function() {
        beforeEach(function() {
          sinon.stub(dataset, '_fetchViewJson').callsFake(function() {
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
          sinon.stub(dataset, '_fetchViewJson').callsFake(function() {
            return $.when({tableId: 20});
          });
        });

        describe('_lookUpDataLensesByTableId fails', function() {
          beforeEach(function() {
            sinon.stub(dataset, '_lookUpDataLensesByTableId').callsFake(function() {
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
            sinon.stub(dataset, '_lookUpDataLensesByTableId').callsFake(function() {
              return $.when('awesome sauce');
            });
          });

          describe('_onlyDataLenses fails', function() {
            beforeEach(function() {
              sinon.stub(dataset, '_onlyDataLenses').callsFake(function() {
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
              sinon.stub(dataset, '_onlyDataLenses').callsFake(function() {
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

  describe('getDownloadType', function() {
    var dataset;

    beforeEach(function() {
      dataset = new Dataset({id: 'four-four'});
    });

    describe('if the dataset is in the old backend and not geospatial', function() {

      it('should have a download type of normal', function() {
        dataset.newBackend = false;
        expect(dataset.getDownloadType()).to.equal('normal');
      });
    });

    describe('if the dataset is in the new backend and not geospatial', function() {

      it('should have a download type of normal', function() {
        dataset.newBackend = true;
        expect(dataset.getDownloadType()).to.equal('normal');
      });
    });

    describe('if the dataset is in the old backend and is geospatial', function() {

      it('should have a download type of obe_geo', function() {
        dataset.newBackend = false;
        dataset.metadata = { geo: {} };
        expect(dataset.getDownloadType()).to.equal('obe_geo');
      });
    });

    describe('if the dataset is in the new backend and is geospatial', function() {

      it('should have a download type of nbe_geo', function() {
        dataset.newBackend = true;
        dataset.metadata = { geo: {} };
        expect(dataset.getDownloadType()).to.equal('nbe_geo');
      });
    });
  });

  describe('setSearchString', function() {
    var dataset;
    var searchString = 'jaqueline';
    var updateSpy;

    beforeEach(function() {
      dataset = new Dataset({id: 'test-test'});
      updateSpy = sinon.spy(dataset, 'update');
      dataset.setSearchString(searchString, true);
    });

    it('sets searchString on metadata.jsonQuery.search ', function() {
      assert.equal(dataset.metadata.jsonQuery.search, searchString);
    });

    it('sets searchString on itself', function() {
      assert.equal(dataset.searchString, searchString);
    });

    it('sets inDatasetSearch on metadata', function() {
      assert.isTrue(dataset.metadata.inDatasetSearch);
    });

    it('calls #update with metadata', function() {
      sinon.assert.calledOnce(updateSpy);
      var expectedMetadata = {
        jsonQuery: {
          search: searchString
        },
        inDatasetSearch: true
      };

      sinon.assert.calledWithMatch(updateSpy, { metadata: expectedMetadata });
    });
  });

  function generateRejectedPromise(payload) {
    var deferred = $.Deferred();

    deferred.reject(payload);
    return deferred.promise();
  }
});
