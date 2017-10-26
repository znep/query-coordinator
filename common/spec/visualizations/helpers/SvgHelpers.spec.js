import * as SvgHelpers from 'common/visualizations/helpers/SvgHelpers';

describe('SvgHelpers', () => {
  describe('createElement(tagName)', () => {
    it('should create an element with correct SVG namespace', () => {
      const element = SvgHelpers.createSvgElement('g');

      expect(element.namespaceURI).to.equal('http://www.w3.org/2000/svg');
    });
  });

  describe('wrapText(fontFamily, fontSize, text, availableWidth)', () => {
    const FONT_FAMILY = 'Arial';
    const FONT_SIZE = 12;

    it('should return array of strings with relative positions', () => {
      const text = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.';
      const rows = SvgHelpers.wrapText(FONT_FAMILY, FONT_SIZE, text, 100);

      expect(rows.length).to.be.above(2);
      expect(rows[0].x).to.equal(0);
      expect(rows[0].y).to.be.above(0);
      expect(rows[1].y).to.equal(rows[0].y * 2);
    });

    it('should return string as is with positions if the given string is smaller than the max width', () => {
      const text = 'Hello';
      const rows = SvgHelpers.wrapText(FONT_FAMILY, FONT_SIZE, text, 500);

      expect(rows.length).to.equal(1);
      expect(rows[0].text).to.equal(text);
      expect(rows[0].x).to.equal(0);
      assert.isNumber(rows[0].y);
    });
  });

  describe('calculateElementSize(element)', () => {
    function createSquare(x, y, size) {
      let rect = SvgHelpers.createSvgElement('rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', size);
      rect.setAttribute('height', size);

      return rect;
    }

    it('should calculate the size of the given element even its not attached to page', () => {
      const group = SvgHelpers.createSvgElement('g');
      group.appendChild(createSquare(0, 0, 50));
      group.appendChild(createSquare(50, 50, 50));

      const groupSize = SvgHelpers.calculateElementSize(group);
      expect(groupSize.width).to.equal(100);
      expect(groupSize.height).to.equal(100);
    });
  });

  describe('textBasedColumnLayout(textAttributes)', function() {
    it('should be able to divide the given container into columns', () => {
      const layout = SvgHelpers.textBasedColumnLayout({});
    });
  });
});
