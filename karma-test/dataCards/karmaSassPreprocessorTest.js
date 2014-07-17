describe('karma-sass-preprocessor', function() {
  beforeEach(module('dataCards/main.sass'));
  describe('with one dependency', function() {
    beforeEach(inject());
    it('should insert the main.sass file', function() {
      expect($("style.sass#dataCards-main-sass").length).to.equal(1)
    });
  });
  describe('with two dependencies', function() {
    beforeEach(module('dataCards/column-chart.sass'));
    beforeEach(inject());
    it('should insert two sass files', function() {
      expect($("style.sass#dataCards-main-sass").length).to.equal(1);
      expect($("style.sass#dataCards-column-chart-sass").length).to.equal(1);
    });
  });
  describe('with a duplicate dependency', function() {
    beforeEach(module('dataCards/main.sass'));
    beforeEach(inject());
    it('should only insert once', function() {
      expect($("style.sass#dataCards-main-sass").length).to.equal(1);
    });
  });
  afterEach(function() {
    $("style.sass").remove();
  });
});
