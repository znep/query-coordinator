# Enum of the possible rights that are assigned directly to a user.
module UserRights

  # NOTE: This should reflect the Rights enum from Core at
  # unobtainium/src/main/java/com/blist/models/account/User.java
  # and the js export list at
  # frontend/public/javascript/common/rights.js
  SOURCE_ARRAY = %w{
    approve_nominations
    change_configurations
    chown_datasets
    create_dashboards
    create_datasets
    create_pages
    create_story
    create_story_copy
    delete_story
    edit_dashboards
    edit_goals
    edit_nominations
    edit_others_datasets
    edit_pages
    edit_sdp
    edit_site_theme
    edit_story
    edit_story_title_desc
    feature_items
    federations
    manage_approval
    manage_provenance
    manage_stories
    manage_story_collaborators
    manage_story_public_version
    manage_story_visibility
    manage_users
    moderate_comments
    short_session
    use_data_connectors
    view_all_dataset_status_logs
    view_dashboards
    view_domain
    view_goals
    view_others_datasets
    view_story
    view_unpublished_story
    edit_others_stories
    view_stories_stats
  }

  SOURCE_ARRAY.each do |right|
    const_set(right.upcase, right)
  end

  def self.to_h
    SOURCE_ARRAY.reduce({}) { |acc, right| acc[right.upcase] = right ; acc }
  end

end
