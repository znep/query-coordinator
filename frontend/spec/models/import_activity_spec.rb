require 'rails_helper'

describe ImportActivity do
  include TestHelperMethods

  before(:each) do
    init_current_domain

    allow(ImportStatusService).to receive(:get).with('/activity/c02d8b44-269a-4891-a872-6020d39e887c').and_return(
      json_fixture("import_status_service/activity_show_response.json")
    )

    allow(ImportStatusService).to receive(:get).with('/activity/74aeaf9e-8e9b-496f-b186-3f542500f1f5').and_return(
      json_fixture("import_status_service/activity_no_wc_response.json")
    )

    allow(ImportStatusService).to receive(:get).with('/activity/c02d8b44-269a-4891-a872-6020d39e887c/events').and_return(
      json_fixture("import_status_service/activity_events_response.json")
    )

    stub_request(:get, 'http://localhost:8080/users/tugg-ikce.json?method=getProfile').
     with(:headers => request_headers).
     to_return(:status => 200, :body => fixture("import_status_service/user_response.json"), :headers => {})

    stub_request(:get, 'http://localhost:8080/views/dzuq-scr8.json').
      with(:headers => request_headers).
      to_return(:status => 200, :body => fixture("import_status_service/view_response.json"), :headers => {})

    stub_request(:get, 'http://localhost:8080/views/copy-four.json').
      with(:headers => request_headers).
      to_return(:status => 200, :body => fixture("import_status_service/wc_view_response.json"), :headers => {})
  end

  let(:activity) { ImportActivity.find('c02d8b44-269a-4891-a872-6020d39e887c') }

  describe 'self.find_all_by_finished_at_descending' do
    before(:each) do
      allow(ImportStatusService).to receive(:get).with('/v2/activity?limit=30&offset=0').and_return(
        json_fixture("import_status_service/activity_index_response.json")
      )

      # batched request for views
      stub_request(:get, 'http://localhost:8080/views.json?ids%5B%5D=cop2-four&ids%5B%5D=copy-four&ids%5B%5D=d9fh-q64b&ids%5B%5D=dzuq-scr8').
       with(:headers => request_headers).
       to_return(:status => 200, :body => fixture("import_status_service/views_batch_response.json"), :headers => {})

      # batched request for users
      stub_request(:get, 'http://localhost:8080/users.json?ids%5B%5D=tugg-ikce&ids%5B%5D=tugg-ikcu').
       with(:headers => request_headers).
       to_return(:status => 200, :body => fixture("import_status_service/users_batch_response.json"), :headers => {})
    end

    it 'returns a list of activities, each with a user and view' do
      activities_fixtures = json_fixture("import_status_service/activity_index_response.json")['activities'].
        map(&:with_indifferent_access)
      views = View.find_multiple(%w(dzuq-scr8 d9fh-q64b copy-four cop2-four))
      users = User.find_multiple(%w(tugg-ikce tugg-ikcu))
      expected_activities = [
        ImportActivity.new(activities_fixtures[0], users[0], views[0], views[2]),
        ImportActivity.new(activities_fixtures[1], users[1], views[1], views[2])
      ]

      expect(ImportActivity.find_all_by_created_at_descending({:offset => 0, :limit => 30})[:activities]).to eq(expected_activities)
    end
  end

  describe 'self.find' do
    it 'equals what comes back from the activity show response' do
      from_fixture = json_fixture("import_status_service/activity_show_response.json")
      initiated_by = User.find_profile('tugg-ikce')
      dataset = View.find('dzuq-scr8')
      working_copy = View.find('copy-four')
      expected = ImportActivity.new(from_fixture, initiated_by, dataset, working_copy)
      expect(activity).to eq(expected)
    end

    let(:activity_data) { json_fixture("import_status_service/activity_show_response.json") }

    it 'passes through the ResourceNotFound exception raised by ISS for a nonexistent activity id' do
      allow(ImportStatusService).to receive(:get).
        with('/activity/nonexistent-activity-id').
        and_raise(ImportStatusService::ResourceNotFound)

      expect { ImportActivity.find('nonexistent-activity-id') }.to raise_exception(ImportStatusService::ResourceNotFound)
    end

    it "sets initiated_by, dataset, and working_copy to nil if they aren't found" do
      allow(ImportStatusService).to receive(:get).
        with('/activity/c02d8b44-269a-4891-a872-6020d39e887d').
        and_return(json_fixture("import_status_service/activity_show_response_nonexistent_view_user.json"))

      allow(View).to receive(:find).and_raise(CoreServer::ResourceNotFound.new(nil))
      allow(User).to receive(:find_profile).and_raise(CoreServer::ResourceNotFound.new(nil))

      activity = ImportActivity.find('c02d8b44-269a-4891-a872-6020d39e887d')
      expect(activity.initiated_by).to be_nil
      expect(activity.dataset).to be_nil
      expect(activity.working_copy).to be_nil
    end
  end

  describe '#id' do
    it 'returns the id it was initialized with' do
      expect(activity.id).to eq('c02d8b44-269a-4891-a872-6020d39e887c')
    end
  end

  describe '#activity_type' do
    it 'returns the activity type it was initialized with, downcased' do
      expect(activity.activity_type).to eq('import')
    end
  end

  describe '#dataset' do
    it 'returns a View model fetched from core' do
      expect(activity.dataset).to be_an_instance_of(View)
      expect(activity.dataset.name).to eq('UFO Test 9')
      expect(activity.dataset.id).to eq('dzuq-scr8')
      expect(activity.dataset.description).to eq('Crazy things are sometimes seen at night in Mississippi...')
    end
  end

  describe '#initiated_by' do
    it 'returns a user model fetched from core' do
      expect(activity.initiated_by).to be_an_instance_of(User)
      expect(activity.initiated_by.displayName).to eq('Pete Vilter')
      expect(activity.initiated_by.id).to eq('tugg-ikce')
    end
  end

  describe '#created_at' do
    it 'returns the parsed date' do
      expect(activity.created_at).to eq(Time.parse '2016-01-21T22:04:21.896Z')
    end
  end

  describe '#status' do
    it 'returns the status it was initialized with, converted to snake case' do
      expect(activity.status).to eq('success_with_data_errors')
    end
  end

  describe '#file_name' do
    it 'returns the file name it was initialized with' do
      expect(activity.file_name).to eq('UFO_Test_7.csv.sdiff')
    end
  end

  describe '#events' do
    it 'returns events returned from the events endpoint' do
      expect(activity.events[0]).to eq(
        json_fixture("import_status_service/activity_events_response.json").
          map { |data| ImportActivityEvent.new(data.with_indifferent_access) }[0]
      )
    end
  end

  describe '#service' do
    it 'returns the service name it was initialized with' do
      expect(activity.service).to eq('DeltaImporter2')
    end
  end

  describe '#last_updated' do
    it 'returns the event_time of the most recent associated event' do
      expect(activity.last_updated).to eq(Time.parse('2016-01-21T22:04:22.161Z'))
    end
  end

  describe '#had_working_copy?' do
    context 'the working_copy attribute is not nil, and the working_copy data field is present' do
      it 'returns true' do
        expect(activity.had_working_copy?).to eq(true)
      end
    end

    context 'the working_copy attribute is nil and the working_copy data field is present' do
      it 'returns true' do
        from_fixture = json_fixture("import_status_service/activity_show_response.json").with_indifferent_access
        initiated_by = User.find_profile('tugg-ikce')
        dataset = View.find('dzuq-scr8')
        # simulate View not returning activity (deleted)
        activity = ImportActivity.new(from_fixture, initiated_by, dataset, nil)
        expect(activity.had_working_copy?).to eq(true)
      end
    end

    context 'the working_copy data field is empty' do
      it 'returns false' do
        no_wc_activity = ImportActivity.find('74aeaf9e-8e9b-496f-b186-3f542500f1f5')
        expect(no_wc_activity.had_working_copy?).to eq(false)
      end
    end
  end

  describe '#working_copy' do
    context 'there is an undeleted uid in the activity data working_copy_id field' do
      it 'returns a view associated with that uid' do
        expected = View.find('copy-four')
        expect(activity.working_copy).to eq(expected)
      end
    end
  end

  describe '#working_copy_display' do
    context 'there working_copy attribute on the activity is nil' do
      it "returns the string '<uid> (deleted)'" do
        from_fixture = json_fixture("import_status_service/activity_show_response.json").with_indifferent_access
        initiated_by = User.find_profile('tugg-ikce')
        dataset = View.find('dzuq-scr8')
        # simulate View not returning activity (deleted)
        activity = ImportActivity.new(from_fixture, initiated_by, dataset, nil)
        expect(activity.working_copy_display).to eq('copy-four (deleted)')
      end
    end

    context 'requesting the wc view has a publicationStage published' do
      it 'returns the string <uid> (published)' do
        from_fixture = json_fixture("import_status_service/activity_show_response.json").with_indifferent_access
        initiated_by = User.find_profile('tugg-ikce').with_indifferent_access
        dataset = View.find('dzuq-scr8')
        working_copy = View.find('copy-four')
        allow(working_copy).to receive(:is_snapshotted?).and_return(true)
        activity = ImportActivity.new(from_fixture, initiated_by, dataset, working_copy)
        expect(activity.working_copy_display).to eq('copy-four (published)')
      end
    end
  end

end
