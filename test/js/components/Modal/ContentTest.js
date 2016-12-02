import _ from 'lodash';
import { renderPureComponent } from '../../helpers';

import Content from 'components/Modal/Content';

describe('Content', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props);
  }

  // TODO: test for rendering children

  it('renders with relevant classes', () => {
    const props = getProps({
      className: 'testing-modal-content'
    });

    element = renderPureComponent(Content(props));

    expect(element).to.exist;
    expect(element).to.have.class('testing-modal-content');
  });
});
