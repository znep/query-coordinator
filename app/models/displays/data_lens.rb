# Display properties for a metadb-backed data lens
# (migrating away from new_view)
class Displays::DataLens < Displays::Base

  def type
    # TODO: verify
    'data_lens'
  end

  def name
    # keep this for now, saves us a dupe translation key
    I18n.t('core.view_types.new_view')
  end

  def title
    name
  end

  def scrolls_inline?
    false
  end

  def render_partial
    # TODO: verify
    'displays/blob'
  end

  def display_type
    # TODO: verify
    'data_lens'
  end

  def icon_class
    'icon-cards'
  end

end
