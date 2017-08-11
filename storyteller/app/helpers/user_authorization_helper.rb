module UserAuthorizationHelper
  include FeaturesHelper

  def contributor?
    has_view_role?('contributor')
  end

  def viewer?
    has_view_role?('viewer')
  end

  def owner?
    has_view_role?('owner')
  end

  def has_any_domain_rights?
    authorization['domainRights'].present?
  end

  def can_create_story?
    has_domain_right?('edit_others_stories') || (owner? && has_domain_right?('create_story'))
  end

  def can_edit_story?
    has_domain_right?('edit_others_stories') ||
    contributor? ||
    (owner? && has_domain_right?('edit_story'))
  end

  def can_view_unpublished_story?
    has_domain_right?('edit_others_stories') ||
    contributor? ||
    viewer? ||
    (owner? && has_domain_right?('view_unpublished_story'))
  end

  def can_edit_title_and_description?(is_goal = false)
    has_domain_right?('edit_others_stories') || ((is_goal || owner?) && has_domain_right?('edit_story_title_desc'))
  end

  def can_make_copy?(is_goal = false)
    has_domain_right?('edit_others_stories') || ((is_goal || owner?) && has_domain_right?('create_story_copy'))
  end

  def can_manage_collaborators?
    has_domain_right?('edit_others_stories') || (owner? && has_domain_right?('manage_story_collaborators'))
  end

  def can_manage_story_visibility?(is_goal = false)
    has_domain_right?('edit_others_stories') || ((is_goal || owner?) && has_domain_right?('manage_story_visibility'))
  end

  def can_publish_story?(is_goal = false)
    has_domain_right?('edit_others_stories') || ((is_goal || owner?) && has_domain_right?('manage_story_public_version'))
  end

  def can_see_story_stats?
    has_domain_right?('edit_others_stories') || (owner? && has_domain_right?('view_stories_stats'))
  end

  def can_view_goal?(goal_uid)
    open_performance_enabled? && OpenPerformance::Goal.new(goal_uid).accessible?
  end

  def goal_unauthorized?(goal_uid)
    OpenPerformance::Goal.new(goal_uid).unauthorized?
  end

  def can_edit_goals?
    open_performance_enabled? && (has_domain_right?('edit_others_stories') || has_domain_right?('edit_goals'))
  end

  # Can the user upload or crop images/documents?
  def can_write_documents?
    can_edit_story? || can_edit_goals?
  end

  private

  def authorization
    CoreServer.current_user_story_authorization || {}
  end

  def has_view_role?(role)
    authorization['viewRole'].present? && authorization['viewRole'] == role
  end

  def has_domain_right?(right)
    authorization['domainRights'].present? && authorization['domainRights'].include?(right)
  end
end
