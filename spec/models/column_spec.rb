require 'rails_helper'

describe Column do
  include TestHelperMethods

  describe 'self.get_derived_view_columns' do
    let(:test_view) do
      View.new({
        'id' => 'peng-uins',
        'columns' => [{
          'fieldName' => 'broccoli',
          'renderTypeName' => 'potato'
        }]
      })
    end

    it 'invokes get_cardinality_for_derived_view_column for each column on the provided view' do
      expect_any_instance_of(Column).to receive(:get_cardinality_for_derived_view_column).
        and_return(100)
      result = Column.get_derived_view_columns(test_view)

      expect(result['broccoli'][:cardinality]).to eq(100)
    end

    it 'adds physicalDatatype for each column on the provided view' do
      allow_any_instance_of(Column).to receive(:get_cardinality_for_derived_view_column)
      result = Column.get_derived_view_columns(test_view)

      expect(result['broccoli'][:physicalDatatype]).to eq('potato')
    end
  end

  describe 'get_cardinality_for_derived_view_column' do
    let(:test_column) { Column.new({ 'fieldName' => 'broccoli' }) }
    let(:expected_path) do
      [
        'http://localhost:8080/id/peng-uins.json?$$query_timeout_seconds=10&',
        '$$read_from_nbe=true&$$version=2.1&',
        '$query=select%20broccoli,%20count(*)%20group%20by%20broccoli%20limit%20101%20%7C%3E%20select%20count(*)'
      ].join('')
    end

    it 'requests cardinality using grouped by and read_from_nbe=true for the column' do
      stub_request(:get, expected_path).to_return(
        :status => 200,
        :headers => {},
        :body => JSON::dump([{ 'count_1' => 9 }])
      )
      result = test_column.get_cardinality_for_derived_view_column('peng-uins')

      expect(result).to eq(9)
    end

    it 'returns a default cardinality if it encounters an error with the request' do
      stub_request(:get, expected_path).to_raise(CoreServer::Error)
      result = test_column.get_cardinality_for_derived_view_column('peng-uins')

      expect(result).to eq(100)
    end
  end
end
