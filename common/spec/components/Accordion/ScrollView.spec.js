import React from 'react';
import TestUtils from 'react-dom/test-utils';
import renderComponent from '../../../spec/authoring_workflow/renderComponent';

import { Scrolls, ScrollView } from 'common/components';

describe('ScrollView', () => {
  it('should render a div with all given props', () => {
    const clickHandler = sinon.spy();
    const component = renderComponent(ScrollView, {
      className: 'class-name',
      id: 'some-id',
      onClick: clickHandler,
      children: <span>Hello world</span>
    });

    expect(component.tagName).to.equal('DIV');
    assert(component.classList.contains('class-name'));

    TestUtils.Simulate.click(component);
    assert(clickHandler.called);
  });

  describe('scroll api', () => {
    class DummyView extends React.Component {
      handleClick() {
        this.props.scroll.toView(this.refs.view);
      }

      handleVertical() {
        this.props.scroll.vertical(123);
      }

      handleHorizontal() {
        this.props.scroll.horizontal(123);
      }

      render() {
        return (
          <div ref="view" style={{ height: 200, width: 400 }}>
            <button id="toView" onClick={this.handleClick.bind(this)} value="Button" />
            <button id="vertical" onClick={this.handleVertical.bind(this)} value="Button" />
            <button id="horizontal" onClick={this.handleHorizontal.bind(this)} value="Button" />
          </div>
        );
      }
    }

    const Scroller = Scrolls(DummyView);
    let component;

    beforeEach(() => {
      component = renderComponent(ScrollView, {
        style: { height: 200, width: 200, overflow: 'auto' },
        id: 'component',
        children: [
          <div key="1" style={{ height: 200 }} />,
          <Scroller key="2" />
        ]
      });

      document.body.appendChild(component);
    });

    afterEach(() => {
      document.body.removeChild(component);
    });

    it('should scroll to view', () => {
      const button = component.querySelector('button#toView');

      expect(component.scrollTop).to.equal(0);
      TestUtils.Simulate.click(button);

      expect(component.scrollTop).to.equal(100);
    });

    it('should scroll vertically', () => {
      const button = component.querySelector('button#vertical');

      TestUtils.Simulate.click(button);
      expect(component.scrollTop).to.equal(123);
    });

    it('should scroll horizontally', () => {
      const button = component.querySelector('button#horizontal');

      TestUtils.Simulate.click(button);
      expect(component.scrollLeft).to.equal(123);
    });
  });
});
