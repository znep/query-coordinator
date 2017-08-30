require 'rails_helper'

describe CardTypeMapping do

  # For 'new' card type mapping logic, see:
  # https://docs.google.com/a/socrata.com/document/d/13KWv-5xugmWr-w4vnfXjIus4n9zLWOUEU1KxxnhMSrw

  let(:column_type) { nil }
  let(:cardinality) { 10 }
  let(:dataset_size) { 2500 }
  let(:computation_strategy) { nil }
  let(:is_derived_view) { false }
  # TODO: add tests that depend on is_derived_view, see ce8eaaee7edc3da7cac92667ec3246b1b1109b78

  class DummyClass
    include CardTypeMapping
  end

  let(:dummy_class_instance) { DummyClass.new }

  shared_examples 'a column that maps to card type' do |expected_card_type|
    it "#{expected_card_type}" do
      column = stub_column(column_type, cardinality)
      column[:computationStrategy] = computation_strategy if computation_strategy

      computed_card_type = dummy_class_instance.default_card_type_for(column.with_indifferent_access, dataset_size, is_derived_view)

      expect(computed_card_type).to eq(expected_card_type)
    end
  end

  shared_examples 'a column with available card types' do |expected_card_types|
    it "#{expected_card_types}" do
      column = stub_column(column_type, cardinality)
      column[:computationStrategy] = computation_strategy if computation_strategy

      computed_card_types = dummy_class_instance.available_card_types_for(column.with_indifferent_access, dataset_size)

      expect(computed_card_types).to contain_exactly(*expected_card_types)
    end
  end

  # money

  describe 'money columns' do
    let(:column_type) { 'money' }

    it_behaves_like 'a column with available card types', %w(histogram column search)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'histogram' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'histogram' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # boolean

  describe 'boolean columns' do
    let(:column_type) { 'boolean' }

    it_behaves_like 'a column with available card types', %w(column)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'column'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'column' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'column' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'column'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'column' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'column' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # fixed_timestamp

  describe 'fixed_timestamp columns' do
    let(:column_type) { 'fixed_timestamp' }

    it_behaves_like 'a column with available card types', %w(timeline)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'timeline' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'timeline' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # floating_timestamp

  describe 'floating_timestamp columns' do
    let(:column_type) { 'floating_timestamp' }

    it_behaves_like 'a column with available card types', %w(timeline)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'timeline' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'timeline' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # geo_entity

  describe 'geo_entity columns' do
    let(:column_type) { 'geo_entity' }

    it_behaves_like 'a column with available card types', %w(feature)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'feature' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'feature' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # point

  describe 'point columns' do
    let(:column_type) { 'point' }

    it_behaves_like 'a column with available card types', %w(feature choropleth)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'feature'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'feature' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'feature' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # multipolygon

  describe 'multipolygon columns' do
    let(:column_type) { 'multipolygon' }

    it_behaves_like 'a column with available card types', %w(invalid)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'invalid' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'invalid' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # multiline

  describe 'multiline columns' do
    let(:column_type) { 'multiline' }

    it_behaves_like 'a column with available card types', %w(invalid)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'invalid'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'invalid' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'invalid' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # text

  describe 'text columns' do
    let(:column_type) { 'text' }

    it_behaves_like 'a column with available card types', %w(column search)
    it_behaves_like 'a column with available card types', %w(choropleth) do
      let(:computation_strategy) do
        { :type => 'georegion_match_on_string' }
      end
    end

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'column'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'search' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'column' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'column'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'column' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'search' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end

    describe 'with georegion_match_on_string computation strategy' do
      let(:computation_strategy) do
        {
          'parameters' => {
            'region' => '_abcd-efgh',
            'geometryLabel' => 'label',
            'column' => 'name'
          },
          'type' => 'georegion_match_on_string'
        }
      end

      it_behaves_like 'a column that maps to card type', 'choropleth'
    end
  end

  # calendar_date

  describe 'calendar_date columns' do
    let(:column_type) { 'calendar_date' }

    it_behaves_like 'a column with available card types', %w(timeline)

    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'timeline'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'timeline' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'timeline' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end
  end

  # number

  describe 'number columns' do
    let(:column_type) { 'number' }

    it_behaves_like 'a column with available card types', %w(column search histogram)
    it_behaves_like 'a column with available card types', %w(choropleth) do
      let(:computation_strategy) do
        { :type => 'georegion_match_on_string' }
      end
    end


    describe 'in large datasets' do
      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram'
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram' do
          let(:cardinality) { 500 }
        end
      end
    end

    describe 'in small datasets' do
      let(:dataset_size) { 10 }

      describe 'with low cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram' do
          let(:cardinality) { 5 }
        end
      end

      describe 'with high cardinality' do
        it_behaves_like 'a column that maps to card type', 'histogram'
      end
    end

    describe 'in a single row dataset' do
      it_behaves_like 'a column that maps to card type', 'histogram' do
        let(:cardinality) { 1 }
        let(:dataset_size) { 1 }
      end
    end

    describe 'with cardinality at threshold' do
      it_behaves_like 'a column that maps to card type', 'histogram' do
        let(:cardinality) { 35 }
        let(:dataset_size) { 35 }
      end
    end

    describe 'with georegion_match_on_string computation strategy' do
      let(:computation_strategy) do
        {
          'parameters' => {
            'region' => '_abcd-efgh',
            'geometryLabel' => 'label'
          },
          'type' => 'georegion_match_on_string'
        }
      end

      it_behaves_like 'a column that maps to card type', 'choropleth'
    end

    describe 'with georegion_match_on_point computation strategy' do
      let(:computation_strategy) do
        {
          'parameters' => {
            'region' => '_abcd-efgh',
            'geometryLabel' => 'label'
          },
          'type' => 'georegion_match_on_point'
        }
      end

      it_behaves_like 'a column that maps to card type', 'choropleth'
    end
  end

  describe 'bad columns' do
    describe 'with unrecognized physical datatype' do
      it 'generates Airbrake notice' do
        expect(Airbrake).to receive(:notify)

        column = stub_column('foo')
        dummy_class_instance.default_card_type_for(column.with_indifferent_access, nil, dataset_size)
      end
    end
    describe 'with missing physical datatype' do
      it 'generates Airbrake notice' do
        expect(Airbrake).to receive(:notify)

        column = {}.with_indifferent_access

        dummy_class_instance.default_card_type_for(column.with_indifferent_access, nil, dataset_size)
      end
    end
  end

  private

  def stub_column(column_type, cardinality = 2500)
    {
      :physicalDatatype => column_type,
      :cardinality => cardinality
    }
  end
end
