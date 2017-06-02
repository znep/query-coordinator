class CorePermissionsUpdater
  include UserAuthorizationHelper

  def initialize(uid)
    @uid = uid

    view = CoreServer::get_view(uid)
    raise ArgumentError.new('Must initialize CorePermissionsUpdater service object with valid uid.') unless view.present?
  end

  def update_permissions(options)
    raise ArgumentError.new("'is_public' must be set as an option.") unless options.key?(:is_public)

    if can_manage_story_visibility? || can_publish_story?
      query_params = {
        accessType: 'WEBSITE',
        method: 'setPermission',
        value: options[:is_public] ? 'public.read' : 'private'
      }

      return CoreServer::update_permissions(uid, query_params)
    end

    false
  end

  private

  attr_reader :uid
end
