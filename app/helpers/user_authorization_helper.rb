module UserAuthorizationHelper
  def contributor?
    has_view_role?('contributor')
  end

  def viewer?
    has_view_role?('viewer')
  end

  def owner?
    has_view_role?('owner')
  end

  def admin?
    super_admin? ||
    has_domain_role?('administrator')
  end

  def super_admin?
    authorization['superAdmin'] == true
  end

  def storyteller_role?
    ['editor_stories', 'publisher_stories'].include?(authorization['domainRole'])
  end

  def can_create_story?
    admin? || (owner? && storyteller_role?)
  end

  def can_edit_story?
    admin? ||
    (owner? && storyteller_role?) ||
    contributor?
  end

  def can_view_unpublished_story?
    can_edit_story? || viewer?
  end

  def can_edit_title_and_description?
    admin? || (owner? && storyteller_role?)
  end

  def can_make_copy?
    admin? || (owner? && storyteller_role?)
  end

  def can_manage_collaborators?
    admin? || (owner? && storyteller_role?)
  end

  def can_manage_story_visibility?
    admin? || (owner? && storyteller_role?)
  end

  def can_see_story_stats?
    admin? || (owner? && storyteller_role?)
  end

  private

  def authorization
    CoreServer.current_user_story_authorization || {}
  end

  def has_view_role?(role)
    authorization['viewRole'] == role
  end

  def has_domain_role?(role)
    authorization['domainRole'] == role
  end

  def has_domain_right?(right)
    authorization['domainRights'].include?(right)
  end
end
