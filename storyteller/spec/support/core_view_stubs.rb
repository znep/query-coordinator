module CoreViewStubs
  def mock_valid_lenses_view_metadata(initialized)
    { 'initialized' => initialized }
  end

  def mock_valid_lenses_view_title
    'Test Story'
  end

  def mock_valid_lenses_view_uid
    'anew-view'
  end

  def mock_valid_uninitialized_lenses_view
    {
      'name' => mock_valid_lenses_view_title,
      'metadata' => mock_valid_lenses_view_metadata(false),
      'owner' => mock_valid_user,
      'id' => mock_valid_lenses_view_uid
    }
  end

  def mock_valid_initialized_lenses_view
    {
      'name' => mock_valid_lenses_view_title,
      'metadata' => mock_valid_lenses_view_metadata(true),
      'owner' => mock_valid_user
    }
  end


  def mock_visualization_metadata_view
    {
      'metadata' => {
        'renderTypeConfig' => {
          'visible' => { 'table' => 'hello' }
        }
      }
    }
  end

  def stub_valid_uninitialized_lenses_view
    allow(CoreServer).to receive(:get_view).and_return(mock_valid_uninitialized_lenses_view)
  end

  def stub_valid_initialized_lenses_view
    allow(CoreServer).to receive(:get_view).and_return(mock_valid_initialized_lenses_view)
  end

  def stub_visualization_component_view
    allow(CoreServer).to receive(:get_view).and_return(mock_visualization_metadata_view)
  end

  def stub_successful_view_creation
    allow(CoreServer).to receive(:create_view).and_return(mock_valid_uninitialized_lenses_view)
  end

  def stub_unsuccessful_view_creation
    allow(CoreServer).to receive(:create_view).and_return({})
  end

  def stub_invalid_lenses_view
    allow(CoreServer).to receive(:get_view).and_return(nil)
  end

  def stub_core_view(uid, options={})
    allow(StoryAccessLogger).to receive(:log_story_view_access)
    view = {
      name: 'test story',
      domainCName: 'example.com',
      owner: {id: 'tugg-xxxx'}
    }.merge(options)

    stub_request(:get, /\/views\/#{uid}/).
      to_return(:status => 200, :body => view.to_json, :headers => {"Content-Type" => "application/json"})
  end

  def stub_core_view_as_missing(uid)
    allow(StoryAccessLogger).to receive(:log_story_view_access)
    stub_request(:get, /\/views\/#{uid}/).
      to_return(:status => 404, :body => nil)
  end
end

RSpec.configure do |config|
  config.include CoreViewStubs
end
