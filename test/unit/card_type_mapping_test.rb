require_relative '../test_helper'

class CardTypeMappingTest < Test::Unit::TestCase

  include CardTypeMapping

  OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE = {
    'amount' => {
      '*' => 'table'
    },
    'category' => {
      'boolean' => 'column',
      'fixed_timestamp' => 'column',
      'floating_timestamp' => 'column',
      'money' => 'column',
      'number' => 'column',
      'text' => 'column',
      'timestamp' => 'column',
      '*' => 'table'
    },
    'identifier' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'search',
      'number' => 'column',
      'text' => 'column',
      'timestamp' => 'timeline',
      '*' => 'table'
    },
    'location' => {
      'number' => 'choropleth',
      'point' => 'feature',
      '*' => 'table'
    },
    'name' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'search',
      'number' => 'column',
      'text' => 'column',
      'timestamp' => 'timeline',
      '*' => 'table'
    },
    'text' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'search',
      'number' => 'column',
      'text' => 'column',
      'timestamp' => 'timeline',
      '*' => 'table'
    },
    'time' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'timeline',
      'number' => 'timeline',
      'text' => 'timeline',
      'timestamp' => 'timeline',
      '*' => 'table'
    }
  }

  OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE = {
    'amount' => {
      '*' => 'table'
    },
    'category' => {
      'boolean' => 'column',
      'fixed_timestamp' => 'column',
      'floating_timestamp' => 'column',
      'money' => 'column',
      'number' => 'search',
      'text' => 'search',
      'timestamp' => 'column',
      '*' => 'table'
    },
    'identifier' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'search',
      'number' => 'search',
      'text' => 'search',
      'timestamp' => 'timeline',
      '*' => 'table'
    },
    'location' => {
      'number' => 'choropleth',
      'point' => 'feature',
      '*' => 'table'
    },
    'name' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'search',
      'number' => 'search',
      'text' => 'search',
      'timestamp' => 'timeline',
      '*' => 'table'
    },
    'text' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'search',
      'number' => 'search',
      'text' => 'search',
      'timestamp' => 'timeline',
      '*' => 'table'
    },
    'time' => {
      'fixed_timestamp' => 'timeline',
      'floating_timestamp' => 'timeline',
      'money' => 'timeline',
      'number' => 'timeline',
      'text' => 'timeline',
      'timestamp' => 'timeline',
      '*' => 'table'
    }
  }

  def fake_column(physicalDatatype, logicalDatatype, cardinality)
    # 'logicalDatatype' is only a valid property name in phase 0.
    # From phase 1 onward it is called 'fred'.
    if metadata_transition_phase_0?
      {
        :physicalDatatype => physicalDatatype,
        :logicalDatatype => logicalDatatype,
        :cardinality => cardinality
      }.with_indifferent_access
    else
      {
        :physicalDatatype => physicalDatatype,
        :fred => logicalDatatype,
        :cardinality => cardinality
      }.with_indifferent_access
    end
  end

  def setup
  end

  def test_card_type_mapping_returns_low_cardinality_default_for_category_column_with_low_cardinality_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500
    physical_datatypes = %w(*)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'amount', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['amount'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'amount', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['amount'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'amount', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['amount'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_high_cardinality_defaults_for_amount_column_with_high_cardinality_in_phases_0_1_and_2
    cardinality = 100
    dataset_size = 2500
    physical_datatypes = %w(*)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'amount', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['amount'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'amount', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['amount'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'amount', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['amount'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_low_cardinality_default_for_category_column_with_low_cardinality_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500
    physical_datatypes = %w(boolean fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'category', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['category'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'category', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['category'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'category', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['category'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_high_cardinality_defaults_for_category_column_with_high_cardinality_in_phases_0_1_and_2
    cardinality = 100
    dataset_size = 2500
    physical_datatypes = %w(boolean fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'category', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['category'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'category', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['category'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'category', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['category'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_low_cardinality_default_for_name_column_with_low_cardinality_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'identifier', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['identifier'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'identifier', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['identifier'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'identifier', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['identifier'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_high_cardinality_defaults_for_identifier_column_with_high_cardinality_in_phases_0_1_and_2
    cardinality = 100
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'identifier', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['identifier'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'identifier', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['identifier'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'identifier', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['identifier'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_low_cardinality_default_for_location_column_with_low_cardinality_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500
    physical_datatypes = %w(number point *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'location', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['location'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'location', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['location'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'location', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['location'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_high_cardinality_defaults_for_location_column_with_high_cardinality_in_phases_0_1_and_2
    cardinality = 100
    dataset_size = 2500
    physical_datatypes = %w(number point *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'location', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['location'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'location', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['location'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'location', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['location'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_low_cardinality_default_for_name_column_with_low_cardinality_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'name', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['name'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'name', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['name'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'name', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['name'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_high_cardinality_defaults_for_name_column_with_high_cardinality_in_phases_0_1_and_2
    cardinality = 100
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'name', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['name'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'name', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['name'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'name', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['name'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_low_cardinality_default_for_text_column_with_low_cardinality_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'text', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['text'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'text', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['text'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'text', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['text'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_high_cardinality_defaults_for_text_column_with_high_cardinality_in_phases_0_1_and_2
    cardinality = 100
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number text timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'text', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['text'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'text', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['text'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'text', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['text'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_expected_value_for_text_column_with_cardinality_equal_to_dataset_size_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 15

    stub_feature_flags_with(:metadata_transition_phase, '0')
    computed_card_type = card_type_for(
      fake_column('text', 'text', cardinality),
      :logicalDatatype,
      dataset_size
    )
    assert_equal(nil, computed_card_type)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    computed_card_type = card_type_for(
      fake_column('text', 'text', cardinality),
      :fred,
      dataset_size
    )
    assert_equal(nil, computed_card_type)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    computed_card_type = card_type_for(
      fake_column('text', 'text', cardinality),
      :fred,
      dataset_size
    )
    assert_equal(nil, computed_card_type)
  end

  def test_card_type_mapping_returns_low_cardinality_default_for_time_column_with_low_cardinality_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'time', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['time'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'time', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['time'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'time', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_LOW_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['time'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_high_cardinality_defaults_for_time_column_with_high_cardinality_in_phases_0_1_and_2
    cardinality = 100
    dataset_size = 2500
    physical_datatypes = %w(fixed_timestamp floating_timestamp money number timestamp *)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'time', cardinality),
        :logicalDatatype,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['time'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'time', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['time'][physical_datatype], computed_card_type)
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    physical_datatypes.each do |physical_datatype|
      computed_card_type = card_type_for(
        fake_column(physical_datatype, 'time', cardinality),
        :fred,
        dataset_size
      )
      assert_equal(OLD_HIGH_CARDINALITY_CARD_TYPE_BY_PHYSICAL_DATATYPE['time'][physical_datatype], computed_card_type)
    end
  end

  def test_card_type_mapping_returns_invalid_card_type_for_multipolygon_column_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '0')
    computed_card_type = card_type_for(
      fake_column('multipolygon', 'location', cardinality),
      :logicalDatatype,
      dataset_size
    )
    assert_nil(computed_card_type)
  end

  def test_card_type_mapping_returns_invalid_card_type_for_multiline_column_in_phases_0_1_and_2
    cardinality = 15
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '0')
    computed_card_type = card_type_for(
      fake_column('multiline', 'location', cardinality),
      :logicalDatatype,
      dataset_size
    )
    assert_nil(computed_card_type)
  end


  # For 'new' card type mappping logic used in metadata transition phase 3, see:
  # https://docs.google.com/a/socrata.com/document/d/13KWv-5xugmWr-w4vnfXjIus4n9zLWOUEU1KxxnhMSrw/edit#

  # Boolean

  def test_card_type_mapping_returns_expected_value_for_boolean_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('boolean', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('column', computed_card_type)
  end

  # Fixed_timestamp

  def test_card_type_mapping_returns_expected_value_for_fixed_timestamp_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('fixed_timestamp', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('timeline', computed_card_type)
  end

  # Floating_timestamp

  def test_card_type_mapping_returns_expected_value_for_floating_timestamp_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('floating_timestamp', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('timeline', computed_card_type)
  end

  # Geo_entity

  def test_card_type_mapping_returns_expected_value_for_geo_entity_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('geo_entity', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('feature', computed_card_type)
  end

  # Money

  def test_card_type_mapping_returns_expected_value_for_money_column_with_one_row_in_phase_3
    dataset_size = 1

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('money', nil, 1),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('money', nil, 1),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_low_cardinality_money_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('money', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('column', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_low_cardinality_and_globally_unique_money_column_in_phase_3
    dataset_size = 15

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('money', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('money', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_cardinality_equal_to_threshold_money_column_in_phase_3
    dataset_size = 2500

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('money', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('money', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_cardinality_equal_to_threshold_and_globally_unique_money_column_in_phase_3
    dataset_size = 35

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('money', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('money', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_high_cardinality_money_column_in_phase_3
    dataset_size = 2500

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('money', nil, 500),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('money', nil, 500),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_high_cardinality_and_globally_unique_money_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('money', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('money', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  # Number

  def test_card_type_mapping_returns_expected_value_for_number_column_with_computation_strategy_match_on_string_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_column = fake_column('number', nil, 1)
    computed_column['computationStrategy'] = {
      'parameters' => {
        'region' => '_abcd-efgh',
        'geometryLabel' => 'label'
      },
      'strategy_type' => 'georegion_match_on_string'
    }.with_indifferent_access

    computed_card_type = card_type_for(
      computed_column,
      nil,
      dataset_size
    )
    assert_equal('choropleth', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_number_column_with_computation_strategy_match_on_point_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_column = fake_column('number', nil, 1)
    computed_column['computationStrategy'] = {
      'parameters' => {
        'region' => '_abcd-efgh',
        'geometryLabel' => 'label'
      },
      'strategy_type' => 'georegion_match_on_point'
    }.with_indifferent_access

    computed_card_type = card_type_for(
      computed_column,
      nil,
      dataset_size
    )
    assert_equal('choropleth', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_number_column_with_one_row_in_phase_3
    dataset_size = 1

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('number', nil, 1),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('number', nil, 1),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_low_cardinality_number_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('number', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('column', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_low_cardinality_and_globally_unique_number_column_in_phase_3
    dataset_size = 15

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('number', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('number', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_cardinality_equal_to_threshold_number_column_in_phase_3
    dataset_size = 2500

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('number', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('number', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_cardinality_equal_to_threshold_and_globally_unique_number_column_in_phase_3
    dataset_size = 35

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('number', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('number', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_high_cardinality_number_column_in_phase_3
    dataset_size = 2500

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('number', nil, 500),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('number', nil, 500),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_high_cardinality_and_globally_unique_number_column_in_phase_3
    dataset_size = 2500

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    computed_card_type = card_type_for(
      fake_column('number', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    computed_card_type = card_type_for(
      fake_column('number', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('histogram', computed_card_type)
  end

  # Point

  def test_card_type_mapping_returns_expected_value_for_point_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('point', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('feature', computed_card_type)
  end

  # Multipolygon

  def test_card_type_mapping_returns_expected_value_for_multipolygon_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('multipolygon', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('invalid', computed_card_type)
  end
  #
  # Multiline

  def test_card_type_mapping_returns_expected_value_for_multiline_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('multiline', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('invalid', computed_card_type)
  end

  # Text

  def test_card_type_mapping_returns_expected_value_for_text_column_with_one_row_in_phase_3
    dataset_size = 1

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('text', nil, 1),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_low_cardinality_text_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('text', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('column', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_low_cardinality_and_globally_unique_text_column_in_phase_3
    dataset_size = 15

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('text', nil, 15),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_cardinality_equal_to_threshold_text_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('text', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_cardinality_equal_to_threshold_and_globally_unique_text_column_in_phase_3
    dataset_size = 35

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('text', nil, 35),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_high_cardinality_text_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('text', nil, 500),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)
  end

  def test_card_type_mapping_returns_expected_value_for_high_cardinality_and_globally_unique_text_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_card_type = card_type_for(
      fake_column('text', nil, 2500),
      nil,
      dataset_size
    )
    assert_equal('search', computed_card_type)
  end

  # Unrecognized physical datatype

  def test_card_type_mapping_raises_exception_for_unknown_physical_datatype_column_in_phase_3
    physical_datatype = 'invalid'
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(
        "Could not determine card type: invalid physicalDatatype '\"invalid\"' on column {\"physicalDatatype\"=>\"invalid\", \"fred\"=>nil, \"cardinality\"=>2500}.",
        airbrake[:error_message]
      )
    end
    computed_card_type = card_type_for(
      fake_column(physical_datatype, nil, 2500),
      nil,
      dataset_size
    )
  end

  # No physical datatype

  def test_card_type_mapping_raises_exception_for_column_without_physical_datatype_in_phase_3
    broken_column = { 'broken' => true }
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(
        "Could not determine card type: physicalDatatype property not present on column '#{broken_column}'.",
        airbrake[:error_message]
      )
    end
    computed_card_type = card_type_for(
      broken_column,
      nil,
      dataset_size
    )
  end

  # The following test the collection of available card types rather than the default one.

  def test_card_type_mapping_returns_expected_available_card_types_for_boolean_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('boolean', nil, 2500),
      dataset_size
    )
    assert_equal(['column'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_fixed_timestamp_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('fixed_timestamp', nil, 2500),
      dataset_size
    )
    assert_equal(['timeline'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_floating_timestamp_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('floating_timestamp', nil, 2500),
      dataset_size
    )
    assert_equal(['timeline'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_geo_entity_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('geo_entity', nil, 2500),
      dataset_size
    )
    assert_equal(['feature'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_money_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')

    stub_feature_flags_with(:odux_enable_histogram, false)
    available_card_types = available_card_types_for(
      fake_column('money', nil, 2500),
      dataset_size
    )
    assert_equal(['column', 'search'], available_card_types)

    stub_feature_flags_with(:odux_enable_histogram, true)
    available_card_types = available_card_types_for(
      fake_column('money', nil, 2500),
      dataset_size
    )
    assert_equal(['column', 'histogram'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_computed_match_on_string_number_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_column = fake_column('number', nil, 1)
    computed_column['computationStrategy'] = {
      'parameters' => {
        'region' => '_abcd-efgh',
        'geometryLabel' => 'label'
      },
      'strategy_type' => 'georegion_match_on_string'
    }.with_indifferent_access

    available_card_types = available_card_types_for(
      computed_column,
      dataset_size
    )
    assert_equal(['choropleth'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_computed_match_on_point_number_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    computed_column = fake_column('number', nil, 1)
    computed_column['computationStrategy'] = {
      'parameters' => {
        'region' => '_abcd-efgh',
        'geometryLabel' => 'label'
      },
      'strategy_type' => 'georegion_match_on_point'
    }.with_indifferent_access

    available_card_types = available_card_types_for(
      computed_column,
      dataset_size
    )
    assert_equal(['choropleth'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_multiline_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('multiline', nil, 2500),
      dataset_size
    )
    assert_equal(['invalid'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_multipolygon_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('multipolygon', nil, 2500),
      dataset_size
    )
    assert_equal(['invalid'], available_card_types)
  end


  def test_card_type_mapping_returns_expected_available_card_types_for_number_column_in_phase_3
    dataset_size = 2500

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => false })
    available_card_types = available_card_types_for(
      fake_column('number', nil, 2500),
      dataset_size
    )
    assert_equal(['column', 'search'], available_card_types)

    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    available_card_types = available_card_types_for(
      fake_column('number', nil, 2500),
      dataset_size
    )
    assert_equal(['column', 'histogram'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_point_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('point', nil, 2500),
      dataset_size
    )
    assert_equal(['feature'], available_card_types)
  end

  def test_card_type_mapping_returns_expected_available_card_types_for_text_column_in_phase_3
    dataset_size = 2500

    stub_feature_flags_with(:metadata_transition_phase, '3')
    available_card_types = available_card_types_for(
      fake_column('text', nil, 2500),
      dataset_size
    )
    assert_equal(['column', 'search'], available_card_types)
  end
end
