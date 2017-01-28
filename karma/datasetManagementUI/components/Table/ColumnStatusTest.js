import ColumnStatus from 'components/Table/ColumnStatus';

describe('components/Table/ColumnStatus', () => {

  const renderInTable = (element) => (
    renderPureComponent(
      <table>
        <thead>
          <tr>{element}</tr>
        </thead>
      </table>
    )
  );

  const pathProp = {
    path: {
      uploadId: 0,
      inputSchemaId: 0,
      outputSchemaId: 0
    }
  };

  describe('when there are no errors', () => {

    it('renders correctly when upload is done and column is done', () => {
      const element = renderInTable(
        <ColumnStatus
          {...pathProp}
          column={{ contiguous_rows_processed: 5000 }}
          totalRows={5000} />
      );
      expect(element.querySelector('.err-info.success')).to.not.be.null;
      expect(element.querySelectorAll('.progress-bar-done')).to.not.be.null;
      expect(element.innerText).to.equal(I18n.show_output_schema.column_header.no_errors_exist);
    });

    it('renders correctly when upload is done and column is in progress', () => {
      const element = renderInTable(
        <ColumnStatus
          {...pathProp}
          column={{ contiguous_rows_processed: 2500 }}
          totalRows={5000} />
      );
      expect(element.innerText).to.equal(I18n.show_output_schema.column_header.scanning);
      const progressBar = element.querySelector('.progress-bar');
      expect(progressBar.style.width).to.equal('50%');
    });

    it('renders correctly when upload is in progress, column is in progress', () => {
      const element = renderInTable(
        <ColumnStatus
          {...pathProp}
          column={{ contiguous_rows_processed: 2500 }}
          totalRows={undefined} />
      );
      expect(element.innerText).to.equal(I18n.show_output_schema.column_header.scanning);
      expect(element.querySelectorAll('.progress-bar-done')).to.not.be.null;
      // TODO: ^^ think of a better class name. really means bar is not visible
      // can be because it's done or we're not showing it because the upload is in progress
    });

    it('renders correctly when neither upload progress nor column progress is known', () => {
      const element = renderInTable(
        <ColumnStatus
          {...pathProp}
          column={{ id: 5 }}
          totalRows={undefined} />
      );
      expect(element.innerText).to.equal(I18n.show_output_schema.column_header.scanning);
      expect(element.querySelectorAll('.progress-bar-done')).to.not.be.null;
      // TODO: ^^ think of a better class name. really means bar is not visible
      // can be because it's done or we're not showing it because the upload is in progress
    });

  });

  describe('when there are errors', () => {

    it('renders correctly when upload is done and column is done', () => {
      const element = renderInTable(
        <ColumnStatus
          {...pathProp}
          column={{ contiguous_rows_processed: 5000, num_transform_errors: 5 }}
          totalRows={5000} />
      );
      expect(element.querySelector('.err-info.error')).to.not.be.null;
      expect(element.querySelectorAll('.progress-bar-done')).to.not.be.null;
      expect(element.innerText).to.equal(`5${I18n.show_output_schema.column_header.errors_exist}`);
    });

    it('renders correctly when upload is done and column is in progress', () => {
      const element = renderInTable(
        <ColumnStatus
          {...pathProp}
          column={{ contiguous_rows_processed: 2500, num_transform_errors: 5 }}
          totalRows={5000} />
      );
      expect(element.innerText).to.equal(`5${I18n.show_output_schema.column_header.errors_exist_scanning}`);
      const progressBar = element.querySelector('.progress-bar');
      expect(progressBar.style.width).to.equal('50%');
    });

    it('renders correctly when upload is in progress, column is in progress', () => {
      const element = renderInTable(
        <ColumnStatus
          {...pathProp}
          column={{ contiguous_rows_processed: 2500, num_transform_errors: 5 }}
          totalRows={undefined} />
      );
      expect(element.innerText).to.equal(`5${I18n.show_output_schema.column_header.errors_exist_scanning}`);
      expect(element.querySelectorAll('.progress-bar-done')).to.not.be.null;
      // TODO: ^^ think of a better class name. really means bar is not visible
      // can be because it's done or we're not showing it because the upload is in progress
    });

  });

});
