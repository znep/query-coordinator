import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';

export class ResultListRow extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderCell'
    ]);
  }

  renderCell(columnName, index) {
    const {
      description,
      isPublished,
      link,
      name,
      // provenance,
      type,
      updatedAt,
      visibleToAnonymous
    } = this.props;

    const cellTag = (value) => (
      <td scope="row" className={columnName} key={`${columnName}-${index}`}>{value}</td>
    );

    switch (columnName) {
      case 'accessLevel':
        return cellTag('TODO');
      case 'discoverable':
        return cellTag('TODO');
      case 'lastUpdatedDate': {
        const dateString = moment(updatedAt).format('LL');
        return cellTag(dateString);
      }
      case 'name':
        return (cellTag(
          <div>
            <a href={link}><span className="name">{name}</span></a>
            <span className="description">{description}</span>
          </div>
        ));
      case 'ownedBy':
        return cellTag('TODO');
      case 'type':
        return cellTag(<span className={getIconClassForDisplayType(type)} />);
      case 'visibility':
        return cellTag(`anonymous? ${visibleToAnonymous.toString()} published? ${isPublished.toString()}`);
      default:
        return cellTag(this.props[columnName]);
    }
  }

  render() {
    return (
      <tr className="result-list-row">
        {this.props.columns.map((columnName, index) => this.renderCell(columnName, index))}
      </tr>
    );
  }
}

ResultListRow.propTypes = {
  category: PropTypes.string,
  columns: PropTypes.array.isRequired,
  description: PropTypes.string,
  isPublished: PropTypes.bool,
  link: PropTypes.string,
  name: PropTypes.string,
  // provenance: PropTypes.string,
  type: PropTypes.string,
  updatedAt: PropTypes.string,
  visibleToAnonymous: PropTypes.bool
};

const mapStateToProps = (state) => {
  return ({
    columns: state.catalog.columns
  });
};

export default connect(mapStateToProps)(ResultListRow);
