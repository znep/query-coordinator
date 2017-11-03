import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import uuid from 'uuid';
import DatasetFieldset from 'components/DatasetFieldset/DatasetFieldset';
import SourceMessage from 'components/SourceMessage/SourceMessage';
import { getCurrentRevision } from 'reduxStuff/actions/loadRevision';
import styles from './HrefForm.scss';

function hrefIsEmpty(href) {
  const hasAnyUrls = !!Object.values(href.urls).filter(val => val.url && val.href).length;
  return !(href.title || href.description || href.data_dictionary_type || href.data_dictionary || hasAnyUrls);
}

// This form strives to let the UI derrive from the data, so in order to control
// the UI, it changes the data--namely the "hrefs" array. When the component loads,
// it initializes "hrefs" as an empty array. Then right before the component mounts,
// it creates an empty href and puts it in the array. This way, if we have no saved
// data, we can still show the user an empty form.

// Once the form mounts, it checks dsmapi to see if there is any saved href data
// on the revision. If there is, it overwrites the empty href we put into the state
// earlier. If not, then it does nothing.

// Finally, because of the stupid modal thing, the button that submits this form
// does not live inside of this form. So we need a way to get the form state out
// of this form so that it can be shared with sibling components. We do this
// by syncing the local state of this form to the redux store. That way, we can
// connect the button that submits the form to the store, pull out the form data,
// and send it to the server. It may be better to change this behavior and instead
// of storing form state in local component state and the redux store, just store it
// in the redux store. But for now, using local state as a buffer works well considering
// that the "Add URL" and "Add Dataset" buttons would have to stick empty values into
// the redux store otherwise.
class HrefForm extends Component {
  constructor() {
    super();
    this.state = {
      hrefs: [],
      currentId: 1
    };

    _.bindAll(this, [
      'handleAddDataset',
      'handleAddURL',
      'handleChangeUrl',
      'handleChangeHref',
      'handleRemoveFirstDataset',
      'handleRemoveOtherDataset',
      'handleRemoveFirstURL',
      'handleRemoveOtherURL'
    ]);
  }

  componentWillMount() {
    const datasetNum = this.state.hrefs.length + 1;

    this.setState({
      hrefs: [this.initializeHref(datasetNum)]
    });
  }

  componentDidMount() {
    getCurrentRevision(this.props.params).then(r => {
      if (r && r.href && r.href.length) {
        const newHrefs = r.href.map((href, idx) => ({ ...href, id: idx + 1 })).map(href => {
          if (_.isEmpty(href.urls)) {
            return {
              ...href,
              urls: {
                [uuid()]: {
                  url: '',
                  filetype: ''
                }
              }
            };
          } else {
            return {
              ...href,
              urls: Object.keys(href.urls).reduce(
                (acc, key) => ({
                  ...acc,
                  [uuid()]: {
                    url: href.urls[key],
                    filetype: key
                  }
                }),
                {}
              )
            };
          }
        });

        this.setState({
          hrefs: newHrefs,
          currentId: r.href.length + 1
        });
      }
    });
  }

  componentWillUpdate(nextProps, nextState) {
    const { syncStateToStore, hrefs: oldHrefs } = this.props;
    const { hrefs: newHrefs } = nextState;

    const nonEmptyOldHrefs = oldHrefs.filter(href => !hrefIsEmpty(href));
    const nonEmptyNewHrefs = newHrefs.filter(href => !hrefIsEmpty(href));

    const oldUrls = nonEmptyOldHrefs.map(href => href.urls);
    const newUrls = nonEmptyNewHrefs.map(href => href.urls);

    // this lifecycle method is called on props and state changes; we use it to
    // sync local state to the store because of the stupid modal save button
    // that we must use to submit this form
    if (!_.isEqual(nonEmptyOldHrefs, nonEmptyNewHrefs) || !_.isEqual(oldUrls, newUrls)) {
      syncStateToStore({ href: nonEmptyNewHrefs });
    }
  }

  componentWillUnmount() {
    const { clearFlash } = this.props;
    clearFlash();
  }

  initializeHref(datasetNum, id) {
    const idIsDefined = id != null;

    const datasetTitle = I18n.show_sources.dataset_title.format(datasetNum);

    const href = {
      id: idIsDefined ? id : this.state.currentId,
      data_dictionary: '',
      data_dictionary_type: '',
      title: datasetTitle,
      description: '',
      urls: {
        [uuid()]: {
          url: '',
          filetype: ''
        }
      }
    };

    if (!idIsDefined) {
      this.setState({
        currentId: this.state.currentId + 1
      });
    }

    return href;
  }

  handleAddDataset() {
    // hanlder for the button that adds a new dataset fieldset
    const datasetNum = this.state.hrefs.length + 1;

    this.props.markFormDirty();

    this.setState({
      hrefs: [...this.state.hrefs, this.initializeHref(datasetNum)]
    });
  }

  handleAddURL(id) {
    // handler for the button that creates a new url field in the form
    const href = this.state.hrefs.find(h => h.id === id);

    const newHref = {
      ...href,
      urls: {
        ...href.urls,
        [uuid()]: {
          url: '',
          filetype: ''
        }
      }
    };

    const newHrefs = [...this.state.hrefs.filter(h => h.id !== id), newHref];

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  handleRemoveFirstDataset(id) {
    this.props.markFormDirty();

    const newHref = this.initializeHref(1, id);

    const newHrefs = [...this.state.hrefs.filter(h => h.id !== id), newHref];

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  handleRemoveOtherDataset(id) {
    this.props.markFormDirty();

    const newHrefs = this.state.hrefs.filter(h => h.id !== id);

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  handleRemoveFirstURL(datasetId, urlId) {
    this.props.markFormDirty();

    const href = this.state.hrefs.find(h => h.id === datasetId);

    const newHref = {
      ...href,
      urls: {
        ...href.urls,
        [urlId]: {
          url: '',
          filetype: ''
        }
      }
    };

    const newHrefs = [...this.state.hrefs.filter(h => h.id !== datasetId), newHref];

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  handleRemoveOtherURL(datasetId, urlId) {
    this.props.markFormDirty();

    const href = this.state.hrefs.find(h => h.id === datasetId);

    const newHref = {
      ...href,
      urls: _.omit(href.urls, urlId)
    };

    const newHrefs = [...this.state.hrefs.filter(h => h.id !== datasetId), newHref];

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  handleChangeUrl(id) {
    // Since urls are nested objects, they need to be udpated a little differently
    // that the other href attributes, hence this dedicated method
    return urlId => newValue => {
      this.props.markFormDirty();

      const href = this.state.hrefs.find(h => h.id === id);

      const newUrls = {
        ...href.urls,
        [urlId]: newValue
      };

      const newHref = {
        ...href,
        urls: newUrls
      };

      const newHrefs = [...this.state.hrefs.filter(h => h.id !== id), newHref];

      this.setState({
        hrefs: _.orderBy(newHrefs, 'id')
      });
    };
  }

  handleChangeHref(id, fieldname, newValue) {
    // generic handler for all href attributes except for url
    this.props.markFormDirty();

    const href = this.state.hrefs.find(h => h.id === id);

    const newHref = {
      ...href,
      [fieldname]: newValue
    };

    const newHrefs = [...this.state.hrefs.filter(h => h.id !== id), newHref];

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  render() {
    const { errors, schemaExists, blobExists } = this.props;

    if (schemaExists || blobExists) {
      return <SourceMessage sourceExists />;
    }

    return (
      <section className={styles.container}>
        <h2 className={styles.bigHeading}>{I18n.show_sources.title}</h2>
        <div className={styles.subtitle}>{I18n.show_sources.subtitle}</div>
        <form onSubmit={e => e.preventDefault()}>
          <h3 className={styles.mediumHeading}>{I18n.show_sources.add_ext_dataset}</h3>
          {this.state.hrefs.map((href, idx) => (
            <DatasetFieldset
              key={href.id}
              href={href}
              errors={errors}
              handleRemoveFirstURL={this.handleRemoveFirstURL}
              handleRemoveOtherURL={this.handleRemoveOtherURL}
              handleXClick={
                idx === 0
                  ? () => this.handleRemoveFirstDataset(href.id)
                  : () => this.handleRemoveOtherDataset(href.id)
              }
              handleChangeUrl={this.handleChangeUrl(href.id)}
              handleChangeHref={this.handleChangeHref}
              handleAddURL={e => {
                e.preventDefault();
                this.handleAddURL(href.id);
              }} />
          ))}
        </form>
        <button className={styles.addDatasetButton} onClick={this.handleAddDataset}>
          {I18n.show_sources.add_dataset}
        </button>
      </section>
    );
  }
}

HrefForm.propTypes = {
  hrefs: PropTypes.arrayOf(PropTypes.object),
  params: PropTypes.object.isRequired,
  syncStateToStore: PropTypes.func.isRequired,
  markFormDirty: PropTypes.func.isRequired,
  markFormClean: PropTypes.func.isRequired,
  clearFlash: PropTypes.func.isRequired,
  errors: PropTypes.arrayOf(PropTypes.object).isRequired,
  schemaExists: PropTypes.bool.isRequired,
  blobExists: PropTypes.bool.isRequired
};

export default HrefForm;
