import SCButton from 'components/SCButton';
import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

const classes = (element) => [].slice.call(element.classList);

const SUPPORTED_STYLES = {
  primary: 'btn-primary',
  alternate: 'btn-alternate',
  alternate2: 'btn-alternate-2',
  simple: 'btn-simple'
};

const SUPPORTED_SIZES = {
  small: 'btn-sm',
  extraSmall: 'btn-xs'
};


describe('components/SCButton', function() {
  it('should show children as content', function()  {
    const props = {
      children: ['Hello world!']
    };

    const element = renderComponentWithStore(SCButton, props);
    expect(element.textContent).to.eq('Hello world!');
  });

  describe('style', function() {
    it('should be default when not specified', function() {
      const element = renderComponentWithStore(SCButton, {  })
      expect(classes(element)).to.contain('btn-default');
    });

    Object.keys(SUPPORTED_STYLES).forEach(function(style) {
      it('should support ' + style, function() {
        var props = {};
        props[style] = true;

        const element = renderComponentWithStore(SCButton, props);
        expect(classes(element)).to.contain(SUPPORTED_STYLES[style]);
      });
    });
  });

  describe('sizes', function() {
    Object.keys(SUPPORTED_SIZES).forEach(function(size) {
      it('should support ' + size + ' size', function() {
        var props = {};
        props[size] = true;

        const element = renderComponentWithStore(SCButton, props);
        expect(classes(element)).to.contain(SUPPORTED_SIZES[size]);
      });
    })
  });

  it('should hide content if inProgress is true', function() {
    var props = {
      inProgress: true,
      children: ['Content']
    };

    const element = renderComponentWithStore(SCButton, props);
    expect(element.textContent).to.eq('');
  });
});

