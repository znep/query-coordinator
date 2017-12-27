import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import uuid from 'uuid';
import DatasetFieldset from 'components/DatasetFieldset/DatasetFieldset';
import SourceMessage from 'components/SourceMessage/SourceMessage';
import { browserHistory } from 'react-router';
import * as Links from 'links/links';
import styles from './HrefForm.module.scss';

// This form strives to let the UI derrive from the data, so in order to control
// the UI, it changes the data--namely the "hrefs" array. When the component loads,
// it initializes "hrefs" as an empty array. Then right before the component mounts,
// it creates an empty href and puts it in the array. This way, if we have no saved
// data, we can still show the user an empty form.

// The form then checks dsmapi to see if there is any saved href data on the
// revision. If there is, it overwrites the empty href we put into the state
// earlier. If not, then it does nothing.
class HrefForm extends Component {
  constructor() {
    super();

    this.state = {
      hrefs: [],
      currentId: 1,
      errors: []
    };

    _.bindAll(this, [
      'handleAddDataset',
      'handleAddURL',
      'handleChangeUrl',
      'handleChangeHref',
      'handleRemoveFirstDataset',
      'handleRemoveOtherDataset',
      'handleRemoveFirstURL',
      'handleRemoveOtherURL',
      'handleSubmit'
    ]);
  }

  componentWillMount() {
    // TODO: possible race condition?
    const hrefsFromServer = !!this.props.hrefs.length;

    if (hrefsFromServer) {
      this.setState({
        hrefs: this.props.hrefs,
        currentId: this.props.hrefs.length + 1
      });
    } else {
      this.setState({
        hrefs: [this.initializeHref()]
      });
    }
  }

  componentWillUnmount() {
    const { clearFlash } = this.props;
    clearFlash();
  }

  handleSubmit(e) {
    e.preventDefault();

    this.props
      .validateAndSaveHrefs(this.state.hrefs)
      .then(() => {
        this.props.showFlash('success', I18n.show_sources.save_success);
        this.props.markFormClean();
        this.props.setFormErrors([]);
        this.setState({
          errors: []
        });
      })
      .catch(err => {
        const errors = [...this.state.errors, ...err.errors];
        this.props.showFlash('error', I18n.show_sources.save_error);
        this.setState({
          errors
        });
      })
      .then(() => {
        // using this .then in the absence of Promise.finally
        if (this.props.shouldExit && !this.state.errors.length) {
          browserHistory.push(Links.revisionBase(this.props.params));
        }
      });
  }

  initializeHref(datasetNum, id) {
    const idIsDefined = id != null;

    const datasetTitle = datasetNum ? I18n.show_sources.dataset_title.format(datasetNum) : '';

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
    // handler for the button that adds a new dataset fieldset
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

    const newHref = this.initializeHref(null, id);

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
    const { schemaExists, blobExists } = this.props;
    const { errors } = this.state;

    if (schemaExists || blobExists) {
      return <SourceMessage sourceExists />;
    }

    return (
      <section className={styles.container}>
        <h2 className={styles.bigHeading}>{I18n.show_sources.title}</h2>
        <div className={styles.subtitle}>{I18n.show_sources.subtitle}</div>
        <form onSubmit={this.handleSubmit}>
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
          <input type="submit" id="submit-href-form" className={styles.hidden} />
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
  shouldExit: PropTypes.bool.isRequired,
  validateAndSaveHrefs: PropTypes.func.isRequired,
  markFormDirty: PropTypes.func.isRequired,
  markFormClean: PropTypes.func.isRequired,
  setFormErrors: PropTypes.func.isRequired,
  clearFlash: PropTypes.func.isRequired,
  showFlash: PropTypes.func.isRequired,
  schemaExists: PropTypes.bool.isRequired,
  blobExists: PropTypes.bool.isRequired
};

export default HrefForm;
