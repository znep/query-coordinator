module UserSessionStubs
  def mock_valid_user
    {
      'id' => 'tugg-xxxx',
      'createdAt' => 1425577015,
      'displayName' => 'testuser'
    }
  end

  def mock_user_authorization_super_admin
    {
      'viewRole' => 'owner',
      'viewRights' => %w(read write delete update_view edit_story),
      'domainRole' => 'publisher_stories',
      'domainRights' => %w(
        create_datasets
        edit_others_datasets
        edit_sdp
        edit_site_theme
        moderate_comments
        manage_users
        chown_datasets
        edit_nominations
        approve_nominations
        feature_items
        federations
        manage_stories
        manage_approval
        change_configurations
        view_domain
        view_others_datasets
        edit_pages
        create_pages
        view_goals
        view_dashboards
        edit_goals
        edit_dashboards
        create_dashboards
        create_story
        edit_story_title_desc
        create_story_copy
        delete_story
        manage_story_collaborators
        manage_story_visibility
        manage_story_public_version
        edit_story
        view_unpublished_story
        view_story
        manage_provenance
      ),
      'superAdmin' => true
    }
  end

  def mock_user_authorization_owner_publisher
    {
      'viewRole' => 'owner',
      'viewRights' => %w(read write delete update_view edit_story),
      'domainRole' => 'publisher_stories',
      'domainRights' => %w(
        read
        write
        delete
        update_view
        view_story
        view_unpublished_story
        edit_story
        create_story
        create_story_copy
        manage_story_collaborators
        manage_story_visibility
        manage_story_public_version
        edit_story_title_desc
      )
    }
  end

  # ALERT: This mock is missing domain rights!
  # You may need to add them and fix tests accordingly.
  def mock_user_authorization_collaborator
    {
      'viewRole' => 'contributor',
      'viewRights' => %w(read write delete update_view),
      'domainRole' => 'viewer'
    }
  end

  # ALERT: This mock is missing domain rights!
  # You may need to add them and fix tests accordingly.
  def mock_user_authorization_viewer
    {
      'viewRole' => 'viewer',
      'viewRights' => %w(read write delete update_view),
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

  def mock_user_authorization_with_domain_rights(rights)
    {
      'viewRole' => 'STUB VIEW ROLE',
      'viewRights' => [],
      'domainRole' => 'STUB DOMAIN ROLE',
      'domainRights' => rights
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
    stub_current_user_story_authorization(mock_user_authorization_super_admin)
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
