/* global datasetMetadata */
import React from 'react';
import classNames from 'classnames/bind';
import _ from 'lodash';
import CardContainer from '../cardContainer/cardContainer';

const TABLE_UNSORTABLE_PHYSICAL_DATATYPES = ['geo_entity', 'point'];

class PageContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filters: this.props.filters,
      shortDescriptionHidden: false,
      longDescriptionHidden: true
    };
  }

  prepareCardList() {
    var firstCard = _.sortBy(
      _.filter(datasetMetadata.columns, function(column) {
        return TABLE_UNSORTABLE_PHYSICAL_DATATYPES.indexOf(column.physicalDatatype) < 0;
      }), 'position')[0];

    var _addToComponentListFunctions = {
      timeline: function(baseValues, card) {
        let values = _.extend(baseValues, {
          componentClass: 'timeline-chart-upper-wrapper',
          containerClass: 'timeline-chart-upper-container'
        });

        return <CardContainer
          key={ values.id }
          cardType={ card.cardType }
          chartValues={ values }
          filters={ this.state.filters }
          fieldName={ card.fieldName} />;
      },
      feature: function(baseValues, card) {
        let values = _.extend(baseValues, {
          componentClass: 'feature-map-wrapper',
          containerClass: 'map-container'
        });

        return <CardContainer
          key={ values.id }
          cardType={ card.cardType }
          chartValues={ values }
          filters={ this.state.filters }
          fieldName={ card.fieldName} />;
      },
      choropleth: function(baseValues, card) {
        let values = _.extend(baseValues, {
          componentClass: 'choropleth-upper-wrapper',
          containerClass: 'choropleth-upper-container',
          computedColumnName: card.computedColumn,
          geojsonUid: datasetMetadata.columns[card.computedColumn].computationStrategy.parameters.region.substring(1)
        });
        return <CardContainer
          key={ values.id }
          cardType={ card.cardType }
          chartValues={ values }
          filters={ this.state.filters }
          fieldName={ card.fieldName } />;
      },
      column: function(baseValues, card) {
        let values = _.extend(baseValues, {
          componentClass: 'column-chart-upper-wrapper',
          containerClass: 'column-chart-upper-container'
        });

        return <CardContainer
          key={ values.id }
          cardType={ card.cardType }
          chartValues={ values }
          filters={ this.state.filters }
          fieldName={ card.fieldName} />;
      },
      table: function(baseValues, card) {
        let values = _.extend(baseValues, {
          componentClass: 'socrata-table-wrapper',
          containerClass: 'socrata-table-container',
          unitLabel: datasetMetadata.columns[(card.aggregationField || card.fieldName)].name,
          orderColumnName: _.findKey(datasetMetadata.columns, firstCard)
        });

        cardComponents.push(<CardContainer
          key={ values.id }
          cardType={ card.cardType }
          chartValues={ values }
          filters={ this.state.filters }
          fieldName={ card.fieldName} />);
      },
      histogram: function(baseValues, card) {
        let values = _.extend(baseValues, {
          componentClass: 'distribution-chart-upper-wrapper',
          containerClass: 'distribution-chart-upper-container'
        });

        return <CardContainer
          key={ values.id }
          cardType={ card.cardType }
          chartValues={ values }
          filters={ this.state.filters }
          fieldName={ card.fieldName} />;
      }
    };

    // Get table cards
    var _cardsWithTables = _.filter(this.props.cards, { cardType: 'table' });
    // Get expanded cards
    var _cardsExpanded = _.filter(this.props.cards, { expanded: true });
    // Exclude table & expanded cards from the rest
    var _cardsOther = _.reject(this.props.cards, function(card) {
      return card.cardType == 'table' || card.expanded;
    });
    // Join cards with the order; EXPANDED + REGULAR + TABLE
    var allCardsWithOrder = _cardsExpanded.concat(_cardsOther).concat(_cardsWithTables);

    // Loop through cards and create react components
    var cardComponents = [];

    var self = this;
    _.each(allCardsWithOrder, (card) => {
      var idSelector = new RegExp('{0}_{1}_'.format(card.cardType, (card.aggregationField || card.fieldName)));
      var idNumber = _(cardComponents).
        sortBy('props.chartValues.id').
        filter((thisCard) => { return idSelector.test(_.get(thisCard, 'props.chartValues.id)')); }).
        value().
        length;

      var baseValues = {
        domain: datasetMetadata.domain,
        datasetUid: datasetMetadata.id,
        filters: self.props.filters,
        unit: {
          one: _.get(datasetMetadata, 'rowDisplayUnit', 'row'),
          other: socrata.utils.pluralize(_.get(datasetMetadata, 'rowDisplayUnit', 'row'), 2)
        },
        id: '{0}_{1}_{2}'.format(card.cardType, (card.aggregationField || card.fieldName), idNumber),
        metadata: datasetMetadata.columns[card.fieldName],
        aggregationMetadata: _.get(datasetMetadata.columns,
          card.aggregationField || card.computedColumn || card.fieldName),
        computedColumnMetadata: _.get(datasetMetadata.columns, card.computedColumn, {}),
        columnName: card.fieldName,
        computedColumn: card.computedColumn,
        aggregationFunction: card.aggregationFunction,
        aggregationField: card.aggregationField
      };

      if (!_.isUndefined(_addToComponentListFunctions[card.cardType])) {
        cardComponents.push(
          _addToComponentListFunctions[card.cardType].bind(this)(_.cloneDeep(baseValues), card)
        );
      }
    });

    return cardComponents;
  }

  componentDidMount() {
    $(document).on('appliedFilters.qfb.socrata', (event, data) => {
      this.setState({ filters: data.filters });
    });
  }

  componentWillUnmount() {
    $(document).off('appliedFilters.qfb.socrata');
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

  render() {
    let cardList = this.prepareCardList();

    if (datasetMetadata.description.length > 85) {
      let intro = datasetMetadata.description.substring(0, 85);

      let shortDescriptionClass = classNames('intro', 'padding', { hidden: this.state.shortDescriptionHidden });
      let longDescriptionClass = classNames('all', { hidden: this.state.longDescriptionHidden });

      return <div>
        <p className={ shortDescriptionClass }>
          <span className="dl-description intro-short">{ intro }</span>
          <span onClick={ this.onClickShowMore.bind(this) } className="text-link">Show more</span>
        </p>
        <div className={ longDescriptionClass }>
          <p className="padding">
            <span className="dl-description">{ datasetMetadata.description }</span>
            <span onClick={ this.onClickShowLess.bind(this) } className="text-link">Collapse details</span>
          </p>
        </div>
        { cardList }
      </div>;
    } else {
      return <div>
        <p className="intro padding">
          <span className="dl-description">{ datasetMetadata.description }</span>
        </p>
        { cardList }
      </div>;
    }
  }
}

PageContainer.propTypes = {
  filters: React.PropTypes.array.isRequired,
  cards: React.PropTypes.array.isRequired
};

export default PageContainer;
