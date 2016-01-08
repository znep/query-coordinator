describe('karma-scss-preprocessor', function() {
  beforeEach(angular.mock.module('dataCards/main.scss'));
  describe('with one dependency', function() {
    beforeEach(inject());
    it('should insert the main.scss file', function() {
      expect($("style.scss#dataCards-main-scss").length).to.equal(1)
    });
  });
  describe('with two dependencies', function() {
    beforeEach(angular.mock.module('dataCards/cards.scss'));
    beforeEach(inject());
    it('should insert two scss files', function() {
      expect($("style.scss#dataCards-main-scss").length).to.equal(1);
      expect($("style.scss#dataCards-cards-scss").length).to.equal(1);
    });
  });
  describe('with a duplicate dependency', function() {
    beforeEach(angular.mock.module('dataCards/main.scss'));
    beforeEach(inject());
    it('should only insert once', function() {
      expect($("style.scss#dataCards-main-scss").length).to.equal(1);
    });
  });
  afterEach(function() {
    $("style.scss").remove();
  });
});
