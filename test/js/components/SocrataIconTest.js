import SocrataIcon from 'components/SocrataIcon';
import { renderPureComponent } from '../helpers';

describe('SocrataIcon', () => {
  let component;
  let element;

  beforeEach(() => {
    component = SocrataIcon({ name: 'info' });
    element = renderPureComponent(component);
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  it('renders .socrata-icon', () => {
    expect(element).to.have.class('socrata-icon');
  });

  it('renders an SVG icon', () => {
    expect(element).to.contain('svg');
  });

  describe('when given a name that doesn\'t exist', () => {
    it('throws', () => {
      expect(() => SocrataIcon({ name: 'rawrenstein' })).to.throw();
    });
  });
});
