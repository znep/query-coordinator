import React from 'react';
import classNames from 'classnames/bind';
import MobileChartFlyout from '../mobileFlyout/mobileChartFlyout';
import LoadingSpinner from '../loadingSpinner/loadingSpinner';
import CardTimelineChart from '../cardTimelineChart/cardTimelineChart';
import CardDistributionChart from '../cardDistributionChart/cardDistributionChart';
import CardColumnChart from '../cardColumnChart/cardColumnChart';
import CardChoroplethMap from '../cardChoroplethMap/cardChoroplethMap';
import CardFeatureMap from '../cardFeatureMap/cardFeatureMap';
import CardTable from '../cardTable/cardTable';

import './cardContainer.scss';

class CardContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cardType: this.props.cardType,
      chartValues: this.props.chartValues,
      filters: this.props.filters,
      fieldName: this.props.fieldName,
      componentClass: classNames('component-container', this.props.chartValues.containerClass),
      mobileFlyoutVisible: false,
      mobileFlyoutContent: {
        title: null,
        filteredValue: null,
        unFilteredValue: null,
        arrowPosition: null,
        unit: {
          one: null,
          other: null
        }
      },
      mobileFlyoutDotClass: classNames('mobile-flyout-dot', 'hidden'),
      mobileFlyoutDotStyle: {
        left: 0,
        top: 0
      },
      loadingSpinnerVisible: false,
      shortDescriptionHidden: false,
      longDescriptionHidden: true
    };
  }

  controlMobileFlyout(content) {
    if (_.isNull(content)) {
      this.setState({
        mobileFlyoutVisible: false,
        mobileFlyoutClass: classNames('mobile-flyout', { hidden: true }),
        componentClass: classNames('component-container', this.state.chartValues.containerClass, { expanded: false })
      });
    } else {
      this.setState({
        mobileFlyoutVisible: true,
        mobileFlyoutContent: content,
        componentClass: classNames('component-container', this.state.chartValues.containerClass, { expanded: true })
      });
    }
  }

  controlMobileFlyoutDot(content) {
    if (_.isNull(content)) {
      this.setState({
        mobileFlyoutDotClass: classNames('mobile-flyout-dot', { hidden: true })
      });
    } else {
      this.setState({
        mobileFlyoutDotClass: classNames('mobile-flyout-dot', { hidden: false }),
        mobileFlyoutDotStyle: content
      });
    }
  }

  controlLoadingSpinner(isVisible) {
    this.setState({ loadingSpinnerVisible: isVisible });
  }

  onClickShowMore() {
    this.setState({
      longDescriptionHidden: false,
      shortDescriptionHidden: true
    });
  }

  onClickShowLess() {
    this.setState({
      longDescriptionHidden: true,
      shortDescriptionHidden: false
    });
  }

  componentDidMount() {
    this.setState({ initialDescriptionHeight: $(this.refs.longDescription).height() });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ filters: nextProps.filters });
  }

  renderDescription() {
    if (this.state.chartValues.metadata.description.length > 60) {
      let intro = this.state.chartValues.metadata.description.substring(0, 50);
      let shortDescriptionClass = classNames('intro', { hidden: this.state.shortDescriptionHidden });
      let longDescriptionClass = classNames('all', { hidden: this.state.longDescriptionHidden });

      return <article className="intro-text">
        <h5>{ this.state.chartValues.unitLabel }</h5>
        <p className={ shortDescriptionClass }>
          <span className="desc intro-short">{ intro }</span>
          <span onClick={ this.onClickShowMore.bind(this) } className="text-link">Show more</span>
        </p>
        <div className={ longDescriptionClass }>
          <p className="padding">
            <span ref="longDescription" className="desc">{ this.state.chartValues.metadata.description }</span>
            <span onClick={ this.onClickShowLess.bind(this) } className="text-link">Collapse details</span>
          </p>
        </div>
      </article>;
    } else if (this.state.chartValues.metadata.description.length > 0) {
      return <article className="intro-text">
        <h5>{ this.state.chartValues.unitLabel }</h5>
        <p className="intro">
          <span className="desc">{ this.state.chartValues.metadata.description }</span>
        </p>
      </article>;
    } else {
      return <article className="intro-text">
        <h5>{ this.state.chartValues.unitLabel }</h5>
      </article>;
    }
  }

  renderChart() {
    let componentClass = this.state.chartValues.metadata.description.length > 0 ?
      classNames(this.state.chartValues.componentClass, 'mobile', 'with-description') :
      classNames(this.state.chartValues.componentClass, 'mobile');

    switch (this.state.cardType) {
      case 'timeline':
        return <CardTimelineChart
          values={ this.state.chartValues }
          componentClass={ componentClass }
          filters={ this.state.filters }
          controlMobileFlyout={ this.controlMobileFlyout.bind(this) }
          controlMobileFlyoutDot={ this.controlMobileFlyoutDot.bind(this) }
          controlLoadingSpinner={ this.controlLoadingSpinner.bind(this) } />;
      case 'histogram':
        return <CardDistributionChart
          values={ this.state.chartValues }
          componentClass={ componentClass }
          filters={ this.state.filters }
          controlMobileFlyout={ this.controlMobileFlyout.bind(this) }
          controlLoadingSpinner={ this.controlLoadingSpinner.bind(this) } />;
      case 'column':
        return <CardColumnChart
          values={ this.state.chartValues }
          componentClass={ componentClass }
          filters={ this.state.filters }
          controlMobileFlyout={ this.controlMobileFlyout.bind(this) }
          controlLoadingSpinner={ this.controlLoadingSpinner.bind(this) } />;
      case 'choropleth':
        return <CardChoroplethMap
          values={ this.state.chartValues }
          componentClass={ componentClass }
          filters={ this.state.filters }
          controlMobileFlyout={ this.controlMobileFlyout.bind(this) }
          controlLoadingSpinner={ this.controlLoadingSpinner.bind(this) } />;
      case 'feature':
        return <CardFeatureMap
          values={ this.state.chartValues }
          componentClass={ componentClass }
          filters={ this.state.filters }
          controlLoadingSpinner={ this.controlLoadingSpinner.bind(this) } />;
      case 'table':
        return <CardTable
          values={ this.state.chartValues }
          componentClass={ componentClass }
          filters={ this.state.filters }
          controlLoadingSpinner={ this.controlLoadingSpinner.bind(this) } />;
    }
  }

  render() {
    var cardId = 'card-{0}'.format(this.state.fieldName);

    return <div ref="mainContainer" className={ this.state.componentClass } id={ cardId }>
      { this.renderDescription() }
      { this.renderChart() }
      <MobileChartFlyout { ...this.state.mobileFlyoutContent } visible={ this.state.mobileFlyoutVisible }/>
      <div ref="flyoutDot" className={ this.state.mobileFlyoutDotClass }>
        <div className="dot" style={ this.state.mobileFlyoutDotStyle }></div>
      </div>
      <LoadingSpinner visible={ this.state.loadingSpinnerVisible } />
    </div>;
  }
}

CardContainer.propTypes = {
  filters: React.PropTypes.array.isRequired,
  cardType: React.PropTypes.string.isRequired,
  chartValues: React.PropTypes.object.isRequired,
  fieldName: React.PropTypes.string.isRequired
};

export default CardContainer;
