# Loads in metadata via core call. Only valid for goals backed by
# core views (i.e., regular stories).
class CoreStoryMetadata
  include StoryMetadata

  attr_accessor(:metadata, :core_view, :approvals_settings)

  def initialize(uid)
    @core_view = CoreServer.get_view(uid) || {}

    @approvals_settings = ::Fontana::Approval::Workflow.settings

    grants = @core_view['grants'] || []

    @metadata = {
      uid: uid,
      title: @core_view['name'],
      description: @core_view['description'] || '',
      tile_config: @core_view.dig('metadata', 'tileConfig') || {},
      grants: grants,
      permissions: {
        isPublic: grants.any? { |grant| (grant['flags'] || []).include?('public') }
      },
      owner_id: @core_view.dig('owner', 'id')
    }
  end

  def goal?
    false
  end

  def default_title
    I18n.t('default_page_title')
  end
end
