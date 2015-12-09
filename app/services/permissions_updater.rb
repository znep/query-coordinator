class PermissionsUpdater

  def initialize(user, user_authorization, uid)
    @user = user
    @user_authorization = user_authorization

    @view = CoreServer::get_view(uid)
    raise ArgumentError.new('Must initialize PermissionsUpdater service object with valid uid.') unless @view.present?

    @clean_uid = uid
  end

  def update_permissions(options)
    raise ArgumentError.new("'is_public' must be set as an option.") unless options.key?(:is_public)

    if view.present? && can_update_permissions?(view, user, user_authorization)
      query_params = {
        accessType: 'WEBSITE',
        method: 'setPermission',
        value: options[:is_public] ? 'public.read' : 'private'
      }

      return CoreServer::update_permissions(@clean_uid, query_params)
    end

    false
  end

  private

  attr_reader :view, :user, :user_authorization

  def can_update_permissions?(view, user, user_authorization)
    story_belongs_to_current_user?(view, user) || can_update_view?(user_authorization)
  end

  def can_update_view?(user_authorization)
    user_authorization['rights'].include?('update_view')
  end

  def story_belongs_to_current_user?(view, user)
    current_user_created_story = false
    owner_id = nil

    if view['owner'].present?
      owner_id = view['owner']['id']
    end

    if owner_id.present?
      current_user_created_story = (owner_id == user['id'])
    end

    current_user_created_story
  end
end
