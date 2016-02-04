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
    has_domain_role?('administrator') ||
    (has_domain_role?('unknown') && has_domain_right?('edit_story'))
  end

  def storyteller_role?
    ['editor_stories', 'publisher_stories'].include?(authorization['domainRole'])
  end

  def can_edit_story?
    admin? ||
    (owner? && storyteller_role?) ||
    contributor?
  end

  def can_view_unpublished_story?
    can_edit_story? || viewer?
  end

  def can_make_copy?
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
