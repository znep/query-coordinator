require 'rails_helper'
require_relative '../../lib/common_metadata_methods'

describe CommonMetadataMethods do

  class DummyClass
    include CommonMetadataMethods
  end

  let(:dummy_class_instance) { DummyClass.new }

  describe '#domain_metadata' do

    before :each do
      allow(CurrentDomain).to receive(:configuration).with('view_categories').and_return(configuration)
      allow(I18n).to receive(:locale).and_return(:es)
    end

    let(:configuration) { double('Configuration') }

    context 'when the domain has no view_categories configuration' do

      it 'returns an empty array' do
        allow(CurrentDomain).to receive(:configuration).with('view_categories').and_return(nil)
        expect(dummy_class_instance.domain_metadata).to eq({:categories => []})
      end

    end

    context 'when the domain supports only one locale' do

      it 'returns an array of category names' do
        allow(configuration).to receive(:properties).and_return({
          'Business' => {
            'enabled' => true
          },
          'Government' => {
            'enabled' => true
          },
          'Personal' => {
            'enabled' => false
          }
        })
        expect(dummy_class_instance.domain_metadata[:categories].sort).to eq(%w(Business Government))
      end

    end

    context 'when the domain supports multiple locales' do

      it 'returns an array of category names when all categories have labels for the current locale' do
        allow(configuration).to receive(:properties).and_return({
          'Business' => {
            'enabled' => true,
            'locale_strings' => {
              'en' => 'Business',
              'es' => 'Negocio'
            }
          },
          'Government' => {
            'enabled' => true,
            'locale_strings' => {
              'en' => 'Government',
              'es' => 'Gobierno'
            }
          },
          'Personal' => {
            'enabled' => false,
            'locale_strings' => {
              'en' => 'Personal',
              'es' => 'Personal'
            }
          }
        })
        expect(dummy_class_instance.domain_metadata[:categories].sort).to eq(%w(Gobierno Negocio))
      end

      it 'returns the category key when a label is not defined for a category in the current locale' do
        allow(configuration).to receive(:properties).and_return({
          'Business' => {
            'enabled' => true,
            'locale_strings' => {
              'en' => 'Business',
              'es' => ''
            }
          },
          'Government' => {
            'enabled' => true,
            'locale_strings' => {
              'en' => 'Government',
              'es' => 'Gobierno'
            }
          },
          'Personal' => {
            'enabled' => false,
            'locale_strings' => {
              'en' => 'Personal',
              'es' => 'Personal'
            }
          }
        })
        expect(dummy_class_instance.domain_metadata[:categories].sort).to eq(%w(Business Gobierno))
      end

    end

  end

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
