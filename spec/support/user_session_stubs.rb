module UserSessionStubs
  def mock_valid_user
    {
      'id' => 'tugg-xxxx',
      'createdAt' => 1425577015,
      'displayName' => 'testuser'
    }
  end

  def mock_user_authorization_owner_publisher
    {
      'viewRole' => 'owner',
      'viewRights' => ['read', 'write', 'delete', 'update_view', 'edit_story'],
      'domainRole' => 'publisher_stories'
    }
  end

  def mock_user_authorization_collaborator
    {
      'viewRole' => 'contributor',
      'viewRights' => ['read', 'write', 'delete', 'update_view'],
      'domainRole' => 'viewer'
    }
  end

  def mock_user_authorization_viewer
    {
      'viewRole' => 'viewer',
      'viewRights' => ['read', 'write', 'delete', 'update_view'],
      'domainRole' => 'viewer'
    }
  end

  def mock_user_authorization_unprivileged
    {
      'viewRole' => nil,
      'viewRights' => [],
      'domainRole' => 'none'
    }
  end

  def stub_valid_session
    allow(CoreServer).to receive(:current_user).and_return(mock_valid_user)
    allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(
      mock_valid_user
    )
    stub_current_user_story_authorization(mock_user_authorization_owner_publisher)
  end

  def stub_invalid_session
    allow(CoreServer).to receive(:current_user).and_return(nil)
    allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(nil)
  end

  def stub_current_user_story_authorization(authorization)
    allow(CoreServer).to receive(:current_user_story_authorization).and_return(authorization)
  end

  def stub_super_admin_session
    allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(
      mock_valid_user.merge('flags' => ['admin'])
    )
  end

  def stub_logged_in_user
    allow_any_instance_of(ApplicationController).to receive(:require_logged_in_user).and_return(true)
    allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(mock_valid_user)
    allow_any_instance_of(ApplicationController).to receive(:current_user_story_authorization).and_return(mock_user_authorization_owner_publisher)
  end

  def stub_sufficient_rights
    allow_any_instance_of(ApplicationController).to receive(:handle_authorization).and_return(true)
  end

end

RSpec.configure do |config|
  config.include UserSessionStubs
end
