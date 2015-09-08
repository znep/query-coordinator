class Permissions

  def initialize(user, uid, core_request_headers)
    view = CoreServer::get_view(uid, core_request_headers)

    @clean_uid = nil
    @core_request_headers = nil
    @view = nil

    if view.present? && can_update_permissions(view, user)
      @clean_uid = uid
      @core_request_headers = core_request_headers
      @view = view
    end
  end

  def update_permissions(is_public)
    raise ArgumentError.new('Must initialize Permissions service object with valid uid.') unless @clean_uid.present?
    raise ArgumentError.new('Must initialize Permissions service object with valid core_request_headers.') unless @core_request_headers.present?
    raise ArgumentError.new('Permissions service object failed to initialize view.') unless @view.present?

    query_params = {
      accessType: 'WEBSITE',
      method: 'setPermission',
      value: is_public ? 'public.read' : 'private'
    }

    CoreServer::update_view(@clean_uid, @core_request_headers, @view, query_params)
  end

  private

  def can_update_permissions?(view, user)
    story_belongs_to_current_user?(view, user)
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
