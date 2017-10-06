# Enum of the possible rights that are assigned directly to a user.
module UserRights
  
    # NOTE: This should reflect the Rights enum from Core at
    # unobtainium/src/main/java/com/blist/models/account/User.java
    # and the js export list at
    # frontend/public/javascript/common/rights.js
    ALL_RIGHTS = %w{
      approve_nominations
      can_see_all_assets_tab_siam
      change_configurations
      chown_datasets
      create_dashboards
      create_datasets
      create_pages
      edit_dashboards
      edit_goals
      edit_nominations
      edit_others_datasets
      edit_pages
      edit_sdp
      edit_site_theme
      feature_items
      federations
      manage_approval
      manage_goals
      manage_provenance
      manage_spatial_lens
      manage_stories
      manage_users
      moderate_comments
      short_session
      use_data_connectors
      view_activity_log
      view_all_dataset_status_logs
      view_dashboards
      view_domain
      view_goals
      view_others_datasets
      create_data_lens
  
      create_story
      create_story_copy
      delete_story
      edit_others_stories
      edit_story
      edit_story_title_desc
      manage_story_collaborators
      manage_story_public_version
      manage_story_visibility
      view_story
      view_stories_stats
      view_unpublished_story
    }
  
    ALL_RIGHTS.each do |right|
      const_set(right.upcase, right)
    end
  
    def self.to_h
      ALL_RIGHTS.reduce({}) { |acc, right| acc[right.upcase] = right ; acc }
    end
  
  end
  
