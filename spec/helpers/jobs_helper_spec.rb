require 'rails_helper'

describe JobsHelper do

  describe '#event_description' do

    it 'returns a localized description if the translation exists' do
      event = ImportActivityEvent.new({
        :info => {:type => 'no_field_names_in_input'}
      })
      expect(event_description(event)).to eq('Usually this is because the CSV file we have been ' +
              'given is completely empty. Please ensure your file contains data, and try again.')
    end

    it 'interpolates string arguments from error JSON into messages' do
      event = ImportActivityEvent.new({
        :info => {:type => 'too_many_records_in_input', :recordCount => 100, :maxRecordCount => 99}
      })
      expect(event_description(event)).to eq('Your data file exceeded the maximum number of ' +
        'records we can import at once (you have 100; max is 99). ' +
        'Please reduce the record count per-file and try again.')
    end

    it 'joins lists in the interpolation arguments with commas and "and" before interpolation' do
      event = ImportActivityEvent.new({
        :info => {:type => 'field_not_in_dataset', :fieldNames => %w(bac witness_gibberish)}
      })
      expect(event_description(event)).to eq('The field name(s) bac and witness_gibberish could ' +
        'not be found in the dataset you are trying to import into. If you intend to import this ' +
        'column, please double-check your spelling and try again.')

      event2 = ImportActivityEvent.new({
        :info => {:type => 'field_not_in_dataset', :fieldNames => %w(bac witness_gibberish location)}
      })
      expect(event_description(event2)).to eq('The field name(s) bac, witness_gibberish, and location could ' +
        'not be found in the dataset you are trying to import into. If you intend to import this ' +
        'column, please double-check your spelling and try again.')
    end

    it 'returns nil if an interpolation argument is missing' do
      event2 = ImportActivityEvent.new({
        :info => {:type => 'field_not_in_dataset'}
      })
      expect(event_description(event2)).to eq(nil)
    end

    it 'returns nil if there is no translation' do
      event = ImportActivityEvent.new({
        :info => {:type => 'out-of-bagels'}
      })
      expect(event_description(event)).to eq(nil)
    end

  end

  describe '#event_title' do

    it 'returns a localized error message if the translation exists' do
      event = ImportActivityEvent.new({
        :info => {:type => 'field-not-in-dataset'}
      })
      expect(event_title(event)).to eq('Could not find field in dataset')
    end

    it 'returns the error code itself if no translation exists' do
      event = ImportActivityEvent.new({
        :info => {:type => 'feeling-sleepy'}
      })
      expect(event_title(event)).to eq('Error: feeling_sleepy')
    end

  end

end