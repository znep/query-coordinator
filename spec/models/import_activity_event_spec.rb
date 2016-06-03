require 'rails_helper'

describe ImportActivityEvent do
  include TestHelperMethods

  let(:fixture_prefix) { "#{Rails.root}/test/fixtures/import_status_service" }

  before :each do
    init_current_domain

    allow(ImportStatusService).to receive(:get).with('/activity/c02d8b44-269a-4891-a872-6020d39e887c').and_return(
      JSON::parse(File.read("#{fixture_prefix}/activity_show_response.json"))
    )

    allow(ImportStatusService).to receive(:get).with('/activity/c02d8b44-269a-4891-a872-6020d39e887c/events').and_return(
      JSON::parse(File.read("#{fixture_prefix}/activity_events_response.json"))
    )

    stub_request(:get, "http://localhost:8080/users/tugg-ikce.json?method=getProfile").
       with(:headers => request_headers).
       to_return(:status => 200, :body => File.read("#{fixture_prefix}/user_response.json"), :headers => {})

    stub_request(:get, "http://localhost:8080/views/dzuq-scr8.json").
         with(:headers => request_headers).
         to_return(:status => 200, :body => File.read("#{fixture_prefix}/view_response.json"), :headers => {})

    stub_request(:get, "http://localhost:8080/views/copy-four.json").
      with(:headers => request_headers).
      to_return(:status => 200, :body => File.read("#{fixture_prefix}/wc_view_response.json"), :headers => {})

  end

  let(:event) { ImportActivity.find('c02d8b44-269a-4891-a872-6020d39e887c').events[0] }

  describe '#status' do

    it 'returns the value passed in the :status key of the hash it was initialized with, converted to snake case' do
      expect(event.status).to eq('success_with_data_errors')
    end

  end

  describe '#event_time' do

    it 'returns the parsed Time from the :event_time field of the hash it was initialized with' do
      expect(event.event_time).to eq(Time.parse '2016-01-21T22:04:22.161Z')
    end

  end

  describe '#type' do

    it 'returns the :type field of the hash it was initialized with' do
      expect(event.type).to eq('field_wrong_format')
    end

  end

  describe '#info' do

    it 'returns the parsed :info field of the hash it was initialized with' do
      expect(event.info).to eq({
        :fieldName => 'Incident Occurrence',
        :type => 'field-wrong-format'
      }.with_indifferent_access)
    end

  end

end
