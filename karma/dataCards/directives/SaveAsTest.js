describe('<save-as/>', function() {
  'use strict';

  var scope;
  var $window;
  var testHelpers;
  var saveAsEventSubject;

  beforeEach(function() {
    module('/angular_templates/dataCards/saveAs.html');
    module('/angular_templates/dataCards/saveButton.html');
    module('/angular_templates/dataCards/spinner.html');
    module('socrataCommon.services');
    module('dataCards.directives');
    module('dataCards.services');
    module('dataCards.filters');
    module('test');
    inject(['$window', 'testHelpers', function(_$window, _testHelpers) {
      $window = _$window;
      testHelpers = _testHelpers;
    }]);
  });

  function createElement(html) {
    var saveAs;
    var element = angular.element(html);

    inject(function($compile, $rootScope) {
      saveAsEventSubject = new Rx.Subject();
      scope = $rootScope.$new();
      scope.savePageAs = sinon.spy(_.constant(saveAsEventSubject));
      saveAs = $compile(element)(scope);
      scope.$digest();
    });
    return saveAs;
  }

  it('should clean up after itself when the scope is destroyed', inject(function(WindowState) {
    var element = createElement('<save-as></save-as>');
    var cleanedUp = false;
    scope.$on('cleaned-up', function() {
      cleanedUp = true;
    });

    expect(cleanedUp).to.be.false;

    scope.$broadcast('$destroy');

    expect(cleanedUp).to.be.true;
  }));

  describe('"Save As" button', function() {
    var elementTemplate = '<save-as has-changes="{0}"></save-as>';
    it('should be disabled if pageHasChanges is false', function() {
      var $saveAs = createElement(elementTemplate.format('false'));
      var $saveAsButton = $saveAs.find('.tool-panel-toggle-btn');
      expect($saveAsButton.hasClass('disabled')).to.be.true;
    });
    it('should be enabled if pageHasChanges is true', function() {
      var $saveAs = createElement(elementTemplate.format('true'));
      var $saveAsButton = $saveAs.find('.tool-panel-toggle-btn');
      expect($saveAsButton.hasClass('disabled')).to.be.false;
    });
    it('should make the tool panel active when clicked', function() {
      var $saveAs = createElement(elementTemplate.format('true'));
      var $toolPanel = $saveAs.find('.tool-panel-main');
      expect($toolPanel.hasClass('active')).to.be.false;
      $saveAs.find('.tool-panel-toggle-btn').click();
      expect($toolPanel.hasClass('active')).to.be.true;
    });
  });

  describe('active tool panel', function() {
    var $saveAs;
    var $toolPanel;
    beforeEach(function() {
      $saveAs = createElement('<save-as has-changes="true" save-page-as="savePageAs"></save-as>');
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
      expect(savePageAsCall.calledWithExactly(TEST_INPUT, '')).to.be.true;
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

    it('should become inactive if the an area outside of the panel is clicked', function() {
      testHelpers.TestDom.append($saveAs);
      testHelpers.fireMouseEvent($saveAs.find('.tool-panel')[0], 'click');
      expect($toolPanel.hasClass('active')).to.be.false;
      testHelpers.TestDom.clear();
    });

  });

});
