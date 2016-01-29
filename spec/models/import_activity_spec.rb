describe ImportActivity do

  let(:fixture_prefix) { "#{Rails.root}/test/fixtures/import_status_service" }

  before :each do

    allow(ImportStatusService).to receive(:get).with('/activity/c02d8b44-269a-4891-a872-6020d39e887c').and_return(
      JSON::parse(File.read("#{fixture_prefix}/activity_show_response.json"))
    )

    allow(ImportStatusService).to receive(:get).with('/activity/c02d8b44-269a-4891-a872-6020d39e887c/events').and_return(
      JSON::parse(File.read("#{fixture_prefix}/activity_events_response.json"))
    )

    stub_request(:get, "http://localhost:8080/users/tugg-ikce.json?method=getProfile").
       with(:headers => {'Accept'=>'*/*', 'Cookie'=>'_core_session_id=123456',
                         'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
       to_return(:status => 200, :body => File.read("#{fixture_prefix}/user_response.json"), :headers => {})

    stub_request(:get, "http://localhost:8080/views/dzuq-scr8.json").
         with(:headers => {'Accept'=>'*/*', 'Cookie'=>'_core_session_id=123456', 'User-Agent'=>'Ruby',
                           'X-Socrata-Federation'=>'Honey Badger', 'X-Socrata-Host'=>'localhost'}).
         to_return(:status => 200, :body => File.read("#{fixture_prefix}/view_response.json"), :headers => {})


  end

  let(:activity) { ImportActivity.find('c02d8b44-269a-4891-a872-6020d39e887c') }

  describe 'self.find_all_by_finished_at_descending' do

    before(:each) do
      allow(ImportStatusService).to receive(:get).with('/activity').and_return(
        JSON::parse(File.read("#{fixture_prefix}/activity_index_response.json"))
      )

      # batched request for views
      stub_request(:get, "http://localhost:8080/views.json?ids%5B%5D=dzuq-scr8&ids%5B%5D=d9fh-q64b").
         with(:headers => {'Accept'=>'*/*', 'Cookie'=>'_core_session_id=123456', 'User-Agent'=>'Ruby',
                           'X-Socrata-Federation'=>'Honey Badger', 'X-Socrata-Host'=>'localhost'}).
         to_return(:status => 200, :body => File.read("#{fixture_prefix}/views_batch_response.json"), :headers => {})

      # batched request for users
      stub_request(:get, "http://localhost:8080/users.json?ids%5B%5D=tugg-ikce&ids%5B%5D=tugg-ikcu").
         with(:headers => {'Accept'=>'*/*', 'Cookie'=>'_core_session_id=123456', 'User-Agent'=>'Ruby',
                           'X-Socrata-Host'=>'localhost'}).
         to_return(:status => 200, :body => File.read("#{fixture_prefix}/users_batch_response.json"), :headers => {})
    end

    it 'returns a list of activities, each with a user and view' do
      activities_fixtures = JSON::parse(File.read("#{fixture_prefix}/activity_index_response.json"))
                                .map(&:with_indifferent_access)
      views = View.find_multiple(%w(dzuq-scr8 d9fh-q64b))
      users = User.find_multiple(%w(tugg-ikce tugg-ikcu))
      expected_activities = [
        ImportActivity.new(activities_fixtures[0], users[0], views[0]),
        ImportActivity.new(activities_fixtures[1], users[1], views[1])
      ]

      expect(ImportActivity.find_all_by_created_at_descending).to eq(expected_activities)
    end

  end

  describe 'self.find' do
    it 'equals what comes back from the activity show response' do
      from_fixture = JSON::parse(File.read("#{fixture_prefix}/activity_show_response.json"))
      initiated_by = User.find_profile('tugg-ikce')
      dataset = View.find('dzuq-scr8')
      expected = ImportActivity.new(from_fixture, initiated_by, dataset)
      expect(activity).to eq(expected)
    end

    let(:activity_data) { JSON::parse(File.read("#{fixture_prefix}/activity_show_response.json")) }

    it 'raises an ArgumentError if not given a dataset' do
      expect { ImportActivity.new(activity_data, User.find_profile('tugg-ikce'), nil) }
          .to raise_exception(ArgumentError, 'dataset is blank')
    end

    it 'raises an ArgumentError if not given an initiated_by user' do
      expect { ImportActivity.new(activity_data, nil, View.find('dzuq-scr8')) }
          .to raise_exception(ArgumentError, 'initiated_by is blank')
    end

    it 'passes through the ResourceNotFound exception raised by ISS for a nonexistent activity id' do
      allow(ImportStatusService).to receive(:get)
        .with('/activity/nonexistent-activity-id')
        .and_raise(ImportStatusService::ResourceNotFound)

      expect { ImportActivity.find('nonexistent-activity-id') }
        .to raise_exception(ImportStatusService::ResourceNotFound)
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
    it 'returns the status it was initialized with, downcased' do
      expect(activity.status).to eq('failure')
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
        JSON::parse(File.read("#{fixture_prefix}/activity_events_response.json"))
          .map {|data| ImportActivityEvent.new(data.with_indifferent_access) }[0]
      )
    end
  end

end