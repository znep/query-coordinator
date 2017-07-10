import { expect, assert } from 'chai';
import TransformStatus from 'components/Table/TransformStatus'; // eslint-disable-line no-unused-vars
import { normal } from 'lib/displayState';
import React from 'react';

describe('components/Table/TransformStatus', () => {
  const renderInTable = element =>
    renderPureComponent(
      <table>
        <thead>
          <tr>{element}</tr>
        </thead>
      </table>
    );

  const defaultProps = {
    path: {
      sourceId: 0,
      inputSchemaId: 0,
      outputSchemaId: 0
    },
    displayState: normal(1, 382),
    isIgnored: false
  };

  describe('when there are no errors', () => {
    it('renders correctly when source is done and column is done', () => {
      const element = renderInTable(
        <TransformStatus
          {...defaultProps}
          transform={{
            output_soql_type: 'text',
            contiguous_rows_processed: 5000
          }}
          columnId={50}
          totalRows={5000}
        />
      );
      expect(element.querySelector('.success')).to.not.equal(null);
      expect(element.querySelectorAll('.progressBar')).to.not.equal(null);
      expect(element.innerText).to.equal(
        I18n.show_output_schema.column_header.no_errors_exist
      );
    });

    it('renders correctly when source is done and column is in progress', () => {
      const element = renderInTable(
        <TransformStatus
          {...defaultProps}
          transform={{
            output_soql_type: 'text',
            contiguous_rows_processed: 2500
          }}
          columnId={50}
          totalRows={5000}
        />
      );
      expect(element.innerText).to.equal(
        I18n.show_output_schema.column_header.scanning
      );
      const progressBar = element.querySelector('.progressBar');
      expect(progressBar.style.width).to.equal('50%');
    });

    it('renders correctly when source is in progress, column is in progress', () => {
      const element = renderInTable(
        <TransformStatus
          {...defaultProps}
          transform={{
            output_soql_type: 'text',
            contiguous_rows_processed: 2500
          }}
          columnId={50}
          totalRows={undefined}
        />
      );
      expect(element.innerText).to.equal(
        I18n.show_output_schema.column_header.scanning
      );
      expect(element.querySelectorAll('.progress-bar-done')).to.not.equal(null);
      // TODO: ^^ think of a better class name. really means bar is not visible
      // can be because it's done or we're not showing it because the source is in progress
    });

    it('renders correctly when neither source progress nor column progress is known', () => {
      const element = renderInTable(
        <TransformStatus
          {...defaultProps}
          transform={{
            output_soql_type: 'text',
            id: 5
          }}
          columnId={50}
          totalRows={undefined}
        />
      );
      expect(element.innerText).to.equal(
        I18n.show_output_schema.column_header.scanning
      );
      expect(element.querySelectorAll('.progress-bar-done')).to.not.equal(null);
      // TODO: ^^ think of a better class name. really means bar is not visible
      // can be because it's done or we're not showing it because the source is in progress
    });
  });

  describe('when there are errors', () => {
    it('renders correctly when source is done and column is done', () => {
      const element = renderInTable(
        <TransformStatus
          {...defaultProps}
          transform={{
            output_soql_type: 'text',
            contiguous_rows_processed: 5000,
            num_transform_errors: 5
          }}
          columnId={50}
          totalRows={5000}
        />
      );
      expect(element.querySelector('.error')).to.not.equal(null);
      expect(element.querySelectorAll('.progress-bar-done')).to.not.equal(null);
      expect(element.querySelector('.statusText').innerText).to.equal(
        `5${I18n.show_output_schema.column_header.errors_exist}`
      );
    });

    it('renders correctly when source is done and column is in progress', () => {
      const element = renderInTable(
        <TransformStatus
          {...defaultProps}
          transform={{
            output_soql_type: 'text',
            contiguous_rows_processed: 2500,
            num_transform_errors: 5
          }}
          columnId={50}
          totalRows={5000}
        />
      );

      expect(element.querySelector('.statusText').innerText).to.equal(
        `5${I18n.show_output_schema.column_header.errors_exist_scanning}`
      );

      const sos = I18n.show_output_schema;
      expect(element.innerText).to.equal(
        `5${sos.column_header
          .errors_exist_scanning}${sos.column_header.column_status_flyout.error_msg_plural.format(
          { num_errors: 5, type: 'Text' }
        )}\n${sos.click_to_view}`
      );

      const progressBar = element.querySelector('.progressBar');
      expect(progressBar.style.width).to.equal('50%');
    });

    it('renders correctly when source is in progress, column is in progress', () => {
      const element = renderInTable(
        <TransformStatus
          {...defaultProps}
          transform={{
            output_soql_type: 'text',
            contiguous_rows_processed: 2500,
            num_transform_errors: 5
          }}
          columnId={50}
          totalRows={undefined}
        />
      );
      expect(element.querySelector('.statusText').innerText).to.equal(
        `5${I18n.show_output_schema.column_header.errors_exist_scanning}`
      );
      expect(element.querySelectorAll('.progress-bar-done')).to.not.equal(null);
      // TODO: ^^ think of a better class name. really means bar is not visible
      // can be because it's done or we're not showing it because the source is in progress
    });
  });
});
