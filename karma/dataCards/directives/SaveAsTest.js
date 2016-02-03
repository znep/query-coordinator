describe('SaveAs', function() {
  'use strict';

  var scope;
  var testHelpers;
  var Mockumentary;
  var ServerConfig;
  var saveAsEventSubject;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    inject([
      'testHelpers',
      'Mockumentary',
      'ServerConfig',
      function(_testHelpers, _Mockumentary, _ServerConfig) {
        testHelpers = _testHelpers;
        Mockumentary = _Mockumentary;
        ServerConfig = _ServerConfig;
      }
    ]);
  });

  beforeEach(function() {
    ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
  });

  function createElement(html, datasetOverrides) {
    var saveAs;
    var element = angular.element(html);

    inject(function($compile, $rootScope) {
      saveAsEventSubject = new Rx.Subject();
      scope = $rootScope.$new();
      scope.page = Mockumentary.createPage(null, datasetOverrides);
      scope.savePageAs = sinon.spy(_.constant(saveAsEventSubject));
      saveAs = $compile(element)(scope);
      scope.$digest();
    });

    return saveAs;
  }

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should clean up after itself when the scope is destroyed', inject(function(WindowState) {
    var element = createElement('<save-as page="page"></save-as>');
    var cleanedUp = false;
    scope.$on('cleaned-up', function() {
      cleanedUp = true;
    });

    expect(cleanedUp).to.be.false;

    scope.$broadcast('$destroy');

    expect(cleanedUp).to.be.true;
  }));

  describe('"Save As" button', function() {
    var elementTemplate = '<save-as has-changes="{0}" page="page"></save-as>';

    it('should make the tool panel active when clicked', function() {
      var $saveAs = createElement(elementTemplate.format('true'));
      var $toolPanel = $saveAs.find('.tool-panel-main');
      expect($toolPanel.hasClass('active')).to.be.false;
      $saveAs.find('.tool-panel-toggle-btn').click();
      expect($toolPanel.hasClass('active')).to.be.true;
    });

    // https://github.com/ariya/phantomjs/issues/10427
    xit('should focus the name input when clicked', function(done) {
      var $saveAs = createElement(elementTemplate.format('true'));
      var $toolPanel = $saveAs.find('.tool-panel-main');
      expect($toolPanel.hasClass('active')).to.be.false;
      $saveAs.find('.tool-panel-toggle-btn').click();
      _.defer(function() {
        expect($toolPanel.find('#save-as-name:focus')).to.exist;
        done();
      });
    });
  });

  describe('active tool panel', function() {
    var $saveAs;
    var $toolPanel;

    beforeEach(function() {
      $saveAs = createElement('<save-as has-changes="true" save-page-as="savePageAs" page="page"></save-as>');
      $saveAs.isolateScope().panelActive = true;
      $toolPanel = $saveAs.find('.tool-panel-main');
    });

    it('should become inactive when the "Cancel" button is clicked', function() {
      var cancelSpy = sinon.spy($saveAs.isolateScope(), 'cancel');
      $toolPanel.find('button[data-action="cancel"]').trigger('click');
      scope.$apply();
      expect(cancelSpy.calledOnce).to.be.true;
      expect($toolPanel.hasClass('active')).to.be.false;
    });

    it('should become inactive when the "Save As" button is clicked', function() {
      $saveAs.find('.tool-panel-toggle-btn').click();
      scope.$apply();
      expect($toolPanel.hasClass('active')).to.be.false;
    });

    it('should highlight the name input as an error if none is provided when the "Save" button is clicked', function() {
      $saveAs.find('button[data-action="save"]').click();
      scope.$apply();
      expect($saveAs.find('#save-as-name').hasClass('form-error')).to.be.true;
    });

    it('should call the savePageAs callback when a name is provided and the "Save" button is clicked', function() {
      var TEST_INPUT = 'test input';
      var $saveAsName = $saveAs.find('#save-as-name');
      $saveAsName.val(TEST_INPUT).trigger('keyup');
      $saveAs.find('button[data-action="save"]').click();

      scope.$apply();

      expect($saveAsName.hasClass('form-error')).to.be.false;
      expect(scope.savePageAs.calledOnce).to.be.true;
      var savePageAsCall = scope.savePageAs.getCall(0);
      expect(savePageAsCall.calledWithExactly(TEST_INPUT, '', undefined, undefined)).to.be.true;
    });

    it('should call the savePageAs callback only once if the user clicks the "Save" button multiple times', function() {
      var TEST_INPUT = 'test input';
      var $saveAsName = $saveAs.find('#save-as-name');
      $saveAsName.val(TEST_INPUT).trigger('keyup');
      $saveAs.find('button[data-action="save"]').click();

      scope.$apply();

      expect($saveAsName.hasClass('form-error')).to.be.false;
      expect(scope.savePageAs.calledOnce).to.be.true;

      $saveAs.find('button[data-action="save"]').click();
      $saveAs.find('button[data-action="save"]').click();
      $saveAs.find('button[data-action="save"]').click();

      scope.$apply();

      expect($saveAsName.hasClass('form-error')).to.be.false;
      expect(scope.savePageAs.calledOnce).to.be.true;
    });

    it('should show a loading spinner when a name is provided and the "Save" button is clicked', function() {
      var TEST_INPUT = 'test input';
      var $saveAsName = $saveAs.find('#save-as-name');
      $saveAsName.val(TEST_INPUT).trigger('keyup');
      var $saveButton = $saveAs.find('button[data-action="save"]');
      $saveButton.click();

      scope.$apply();

      expect($saveAsName.hasClass('form-error')).to.be.false;
      expect(scope.savePageAs.calledOnce).to.be.true;
      var $spinner = $saveButton.find('spinner.save-button-flyout-target');
      expect($spinner.length).to.equal(1);
    });

    it('should clear an input error when text is typed', function() {
      $saveAs.find('button[data-action="save"]').click();
      scope.$apply();
      $saveAs.find('#save-as-name').val('input').trigger('keyup');
      scope.$apply();
      expect($saveAs.find('#save-as-name').hasClass('form-error')).to.be.false;
    });

    it('should become inactive if the area outside of the panel is clicked', function() {
      testHelpers.TestDom.append($saveAs);
      testHelpers.fireMouseEvent($saveAs.find('.tool-panel')[0], 'click');
      expect($toolPanel.hasClass('active')).to.be.false;
    });

    it('should not become inactive if the area outside of the panel is clicked and the save button is not idle', function() {
      testHelpers.TestDom.append($saveAs);
      $saveAs.isolateScope().saveStatus = 'saving';
      $saveAs.isolateScope().$digest();
      testHelpers.fireMouseEvent($saveAs.find('.tool-panel')[0], 'click');
      expect($toolPanel.hasClass('active')).to.be.true;
    });
  });

  describe('visibility alert', function() {
    var element;

    function setup(userCanApproveNominations, datasetIsPrivate, obeId) {
      var datasetOverrides = {
        obeId: obeId,
        permissions: {
          isPublic: !datasetIsPrivate
        }
      };

      window.currentUser = {
        rights: userCanApproveNominations ? ['approve_nominations'] : []
      };

      element = createElement('<save-as has-changes="true" save-page-as="savePageAs" page="page"></save-as>', datasetOverrides);
      element.isolateScope().panelActive = true;
      testHelpers.TestDom.append(element);
    }

    it('should show a message if the user cannot approve nominations and the dataset is not private', function() {
      setup(false, false, 'asdf-fdsa');
      expect(element.find('.visibility-alert').html()).to.match(/You don\'t have permissions/);
    });

    it('should not show a message if the user can approve nominations and the dataset is not private', function() {
      setup(true, false, 'asdf-fdsa');
      expect(element.find('.visibility-alert')).to.not.exist;
    });

    it('should show a message if the user can approve nominations and the dataset is private', function() {
      setup(true, true, 'asdf-fdsa');
      expect(element.find('.visibility-alert').html()).to.match(/This Data Lens is based on the private dataset/);
    });

    it('should show a message if the user cannot approve nominations and the dataset is private', function() {
      setup(false, true, 'asdf-fdsa');
      expect(element.find('.visibility-alert').html()).to.match(/This Data Lens is based on the private dataset/);
    });
  });
});
