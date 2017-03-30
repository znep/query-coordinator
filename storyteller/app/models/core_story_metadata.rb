# Loads in metadata via core call. Only valid for goals backed by
# core views (i.e., regular stories).
class CoreStoryMetadata
  include StoryMetadata

  attr_accessor(:metadata)

  def initialize(uid)
    core_attributes = CoreServer.get_view(uid) || {}

    grants = core_attributes['grants'] || []

    @metadata = {
      uid: uid,
      title: core_attributes['name'],
      description: core_attributes['description'] || '',
      tile_config: core_attributes.dig('metadata', 'tileConfig') || {},
      grants: grants,
      permissions: {
        isPublic: grants.any? { |grant| (grant['flags'] || []).include?('public') }
      },
      owner_id: core_attributes.dig('owner', 'id')
    }
  end

  def goal?
    false
  end

  def default_title
    I18n.t('default_page_title')
  end
end
