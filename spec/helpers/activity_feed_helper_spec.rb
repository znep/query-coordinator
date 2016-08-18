# Encoding: utf-8
require 'rails_helper'

describe ActivityFeedHelper do

  describe '#event_description' do

    it 'returns a localized description if the translation exists' do
      event = ImportActivityEvent.new({
        :info => {:type => 'no_field_names_in_input'},
        :status => 'Failure',
        :event_type => 'no_field_names_in_input'
      })
      expect(event_description(event)).to eq('Usually this is because the CSV file we have been ' +
              'given is completely empty. Please ensure your file contains data, and try again.')
    end

    it 'interpolates string arguments from error JSON into messages' do
      event = ImportActivityEvent.new({
        :event_type => 'too_many_records_in_input',
        :status => 'Failure',
        :info => {:type => 'too_many_records_in_input', :recordCount => 100, :maxRecordCount => 99}
      })
      expect(event_description(event)).to eq('Your data file exceeded the maximum number of ' +
        'records we can import at once (you have 100; max is 99). ' +
        'Please reduce the record count per-file and try again.')
    end

    it 'joins lists in the interpolation arguments with commas and "and" before interpolation' do
      event = ImportActivityEvent.new({
        :event_type => 'field_not_in_dataset',
        :status => 'Failure',
        :info => {:type => 'field_not_in_dataset', :fieldNames => %w(bac witness_gibberish)}
      })
      expect(event_description(event)).to eq('The field name(s) bac and witness_gibberish could ' +
        'not be found in the dataset you are trying to import into. If you intend to import this ' +
        'column, please double-check your spelling and try again.')

      event2 = ImportActivityEvent.new({
        :event_type => 'field_not_in_dataset',
        :status => 'Failure',
        :info => {:type => 'field_not_in_dataset', :fieldNames => %w(bac witness_gibberish location)}
      })
      expect(event_description(event2)).to eq('The field name(s) bac, witness_gibberish, and location could ' +
        'not be found in the dataset you are trying to import into. If you intend to import this ' +
        'column, please double-check your spelling and try again.')
    end

    it 'returns nil if an interpolation argument is missing' do
      event2 = ImportActivityEvent.new({
        :event_type => 'field_not_in_dataset',
        :status => 'Failure',
        :info => {:type => 'field_not_in_dataset'}
      })
      expect(event_description(event2)).to eq(nil)
    end

    it 'returns "Completed" if the status is success_with_data_errors' do
      event = ImportActivityEvent.new({
        :status => 'SuccessWithDataErrors',
        :event_type => 'di2-counts',
        :info => {:failCount => 99, :rowCount => 1000}
      })
      expect(event_description(event)).to eq('Your import file has been imported, ' +
        'but out of 1000 total rows, we were unable to load 99 rows into ' +
        'your dataset. If this is unexpected, please download the Failed Rows from the right, ' +
        'and verify that your values match ' +
        '<a href="https://support.socrata.com/hc/en-us/articles/202949918-Importing-Data-Types-and-You-">' +
        'Socrata’s expected formats</a>. You can then re-import just these rows.')
    end

    it 'returns nil if there is no translation' do
      event = ImportActivityEvent.new({
        :event_type => 'out-of-bagels',
        :status => 'Failure',
        :info => {:type => 'out-of-bagels'}
      })
      expect(event_description(event)).to eq(nil)
    end

  end

  describe '#event_title' do

    it 'returns a localized error message if the translation exists' do
      event = ImportActivityEvent.new({
        :event_type => 'field-not-in-dataset',
        :status => 'Failure',
        :info => {:type => 'field-not-in-dataset'}
      })
      expect(event_title(event)).to eq('Could not find field in dataset')
    end

    it 'returns the error code itself if no translation exists' do
      event = ImportActivityEvent.new({
        :event_type => 'feeling-sleepy',
        :status => 'Failure',
        :info => {:type => 'feeling-sleepy'}
      })
      expect(event_title(event)).to eq('Error: feeling_sleepy')
    end

    it 'returns "Completed" if the status is success_with_data_errors' do
      event = ImportActivityEvent.new({
        :status => 'SuccessWithDataErrors',
        :event_type => 'upsert-counts',
        :info => {:failCount => 99, :rowCount => 1000}
      })
      expect(event_title(event)).to eq('Completed')
    end

  end

  describe '#show_restore_button' do

    it "doesn't show restore button on non-deleted events" do
      rspec_stub_feature_flags_with('restore_dataset_button', true)
      event = ImportActivity.new(
        { :activity_type => 'delete', :created_at => Date.today, :first_deleted_in_list => true },
        nil,
        View.new('deleted' => false),
        nil
      )
      expect(display_restore_button(event)).to eq(false)
    end

    it 'shows restore button on recent deleted events that are published default views' do
      rspec_stub_feature_flags_with('restore_dataset_button', true)
      event = ImportActivity.new(
        { :activity_type => 'delete', :created_at => Date.today.to_s, :first_deleted_in_list => true },
        nil,
        View.new(
          'deleted' => true,
          'publicationStage' => 'published',
          'displayType' => 'table',
          'viewType' => 'tabular',
          'flags' => ['default', 'restorable', 'restorePossibleForType']
        ),
        nil
      )
      expect(display_restore_button(event)).to eq(true)
    end

    it 'does not show restore button when not first_deleted_in_list' do
      rspec_stub_feature_flags_with('restore_dataset_button', true)
      event = ImportActivity.new(
        { :activity_type => 'delete', :created_at => Date.today.to_s, :first_deleted_in_list => false },
        nil,
        View.new('deleted' => true),
        nil
      )
      expect(display_restore_button(event)).to eq(false)
    end

    it 'does not show restore button on old deleted events' do
      rspec_stub_feature_flags_with('restore_dataset_button', true)
      event = ImportActivity.new(
        { 
          :activity_type => 'delete',
          :created_at => ((Date.today - APP_CONFIG.restore_dataset_days) - 1).to_s,
          :first_deleted_in_list => true
        },
        nil,
        View.new(
          'deleted' => true,
          'publicationStage' => 'published',
          'displayType' => 'table',
          'viewType' => 'tabular',
          'flags' => ['default']
        ),
        nil
      )
      expect(display_restore_button(event)).to eq(false)
    end

    it 'does not show restore button on non-default views' do
      rspec_stub_feature_flags_with('restore_dataset_button', true)
      event = ImportActivity.new(
        { 
          :activity_type => 'delete',
          :created_at => ((Date.today - APP_CONFIG.restore_dataset_days) - 1).to_s
        },
        nil,
        View.new(
          'deleted' => true,
          'publicationStage' => 'published',
          'displayType' => 'table',
          'viewType' => 'tabular',
          'flags' => []
        ),
        nil
      )
      expect(display_restore_button(event)).to eq(false)
    end

    it 'does not show restore button on unpublished views' do
      rspec_stub_feature_flags_with('restore_dataset_button', true)
      event = ImportActivity.new(
        { 
          :activity_type => 'delete',
          :created_at => ((Date.today - APP_CONFIG.restore_dataset_days) - 1).to_s
        },
        nil,
        View.new(
          'deleted' => true,
          'publicationStage' => 'unpublished',
          'displayType' => 'table',
          'viewType' => 'tabular',
          'flags' => ['default']
        ),
        nil
      )
      expect(display_restore_button(event)).to eq(false)
    end

  end

end
