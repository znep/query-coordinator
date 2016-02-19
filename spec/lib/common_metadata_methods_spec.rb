require 'rails_helper'
require_relative '../../lib/common_metadata_methods'

describe CommonMetadataMethods do

  class DummyClass
    include CommonMetadataMethods
  end

  let(:dummy_class_instance) { DummyClass.new }

  describe '#flag_subcolumns!' do

    it 'flags subcolumns when there is a suffix' do
      columns_with_suffix = {
        'location_1' => {
          :name => 'Location'
        },
        'location_1_city' => {
          :name => 'Location (City)'
        }
      }

      dummy_class_instance.flag_subcolumns!(columns_with_suffix)
      expect(columns_with_suffix['location_1'][:isSubcolumn]).to eq(false)
      expect(columns_with_suffix['location_1_city'][:isSubcolumn]).to eq(true)
    end

    it 'flags subcolumns when there is not a suffix' do
      columns_no_suffix = {
        'location' => {
          :name => 'Location'
        },
        'location_city' => {
          :name => 'Location (City)'
        }
      }

      dummy_class_instance.flag_subcolumns!(columns_no_suffix)
      expect(columns_no_suffix['location'][:isSubcolumn]).to eq(false)
      expect(columns_no_suffix['location_city'][:isSubcolumn]).to eq(true)
    end

  end

end
