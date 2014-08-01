describe('jquery_extensions', function() {
  describe('$.fn.dimensions', function() {
    it('should return the same dimensions as are set', function() {
      var div = $('<div>').
        height(30).
        width(30);
      var dimensions = div.dimensions();
      expect(dimensions.width).to.equal(30);
      expect(dimensions.height).to.equal(30);
    });
  });
  describe('$.commaify', function() {
    it('should convert integers correctly', function() {
      expect($.commaify(20000)).to.equal('20,000');
      expect($.commaify(2000000)).to.equal('2,000,000');
    });
    it('should convert decimals correctly', function() {
      expect($.commaify(20000.1234)).to.equal('20,000.1234');
    });
    it('should convert string numbers correctly', function() {
      expect($.commaify('20000.1234')).to.equal('20,000.1234');
    });
  });
  describe('String.prototype.format', function() {
    it('should insert correctly', function() {
      expect('{0}, {1}, {2}, {3}, {4}'.format(1, 2, 3, 4, 5)).to.equal('1, 2, 3, 4, 5');
    });
  });
  describe('String.prototype.capitaliseEachWord', function() {
    it('should capitalize a string correctly', function() {
      expect('asdf dfkj skja sdjfa jasldkfjalsd'.capitaliseEachWord()).to.
        equal('Asdf Dfkj Skja Sdjfa Jasldkfjalsd');
    });
    it('should downcase an all caps string', function() {
      expect('SDFS SKDF'.capitaliseEachWord()).to.equal('Sdfs Skdf');
    });
  });
  describe('String.prototype.visualSize', function() {
    var string = 'Batman is pretty cool!'
    it('should agree with helper methods', function() {
      var size = string.visualSize();
      expect(size.width).to.equal(string.visualLength());
      expect(size.height).to.equal(string.visualHeight());
    });
  });
  describe('$.relativeToPx', function(){
    var types = {
      '3rem': 48,
      '30pt': 40,
      '30px': 30,
      '1000': 1000
    };
    _.each(types, function(expected, given){
      it('should convert ' + given + ' to ' + expected + 'px', function() {
        expect($.relativeToPx(given)).to.equal(expected);
      });
    });
  });

  describe('when trying to capitalize words', function() {

    it('should capitalize the words when they are present', function() {
      expect($.capitalizeWithDefault('these are some WORDS')).to.equal('These Are Some Words');
    });

    it('should use the placeholder when the words are blank', function() {
      expect($.capitalizeWithDefault('', 'placeholder')).to.equal('placeholder');
    });

    it('should use a default placeholder when none is specified', function() {
      expect($.capitalizeWithDefault('')).to.equal('(Blank)');
    });

  });

  describe('$.fn.flyout', function() {
    beforeEach(function() {
      $('body').append('<div id="test-root"><div id="container">' +
          '<div class="cell"></div><div class="cell">' +
        '</div></div>');
    });
    it('should flyout on the mouseenter event and close on the mouseleave event', function(done) {
      $('#container').flyout({
        selector: '.cell',
        direction: 'bottom',
        html: 'Mooo!'
      });
      $('#container .cell').first().trigger('mouseenter');
      expect($('.flyout').length).to.equal(1);
      $('#container .cell').trigger('mouseleave');
      _.defer(function() {
        expect($('.flyout').length).to.equal(0);
        done();
      })
    });
    it('should handle functions for all values', function() {
      var count = 0;
      var expectedCount = 0;
      function incr(val) {
        expectedCount += 1;
        return function() {
          count += 1;
          return val;
        }
      }
      $('#container').flyout({
        selector: '.cell',
        direction: incr('left'),
        title: incr('right'),
        html: incr('Moo'),
        table: incr([[1,2]]),
        interact: incr('false')
      });
      $('#container .cell').first().trigger('mouseenter');
      expect(count).to.equal(expectedCount);
    });
    it('should insert html', function() {
      $('#container').flyout({
        selector: '.cell',
        direction: 'bottom',
        html: 'Mooo!'
      });
      $('#container .cell').first().trigger('mouseenter');
      expect($('.flyout').first().text()).to.equal('Mooo!');
    });
    it('should insert title', function() {
      $('#container').flyout({
        selector: '.cell',
        direction: 'bottom',
        title: 'Mooo!'
      });
      $('#container .cell').first().trigger('mouseenter');
      expect($('.flyout .flyout-title').first().text()).to.equal('Mooo!');
    });
    it('should respect direction', function() {
      $('#container').flyout({
        selector: '.cell',
        direction: 'right',
        title: 'Mooo!'
      });
      $('#container .cell').first().trigger('mouseenter');
      expect($('.flyout').first().hasClass('right')).to.equal(true);
    });
    it('should respect interact', function() {
      $('#container').flyout({
        selector: '.cell',
        direction: 'right',
        title: 'Mooo!',
        interact: true
      });
      $('#container .cell').first().trigger('mouseenter');
      expect($('.flyout').first().hasClass('nointeract')).to.equal(false);
    });
    it('should default parent to cell', function() {
      $('#container').flyout({
        selector: '.cell',
        direction: 'right',
        title: 'Woof'
      });
      $('#container .cell').first().trigger('mouseenter');
      expect($('.flyout').parent().hasClass('cell')).to.equal(true);
    });
    it('should respect parent', function() {
      $('#container').flyout({
        selector: '.cell',
        direction: 'right',
        title: 'Woof',
        parent: $('#container')
      });
      $('#container .cell').first().trigger('mouseenter');
      expect($('.flyout').parent().attr('id')).to.equal('container');
    });
    afterEach(function() {
      $('#container').remove();
    });
  });

  describe('socratic easing function', function() {
    var ease = $.easing.socraticEase;
    it('should return 0 for 0 input', function() {
      expect(ease(0)).to.be.zero;
    });
    it('should return 1 for 1 input', function() {
      expect(ease(1)).to.equal(1);
    });
  });
});
