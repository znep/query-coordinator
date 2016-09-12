# This defines how to display an HREF-dataset, e.g.g a link to another page
class Displays::Href < Displays::Base
  def type
    if @view.is_unpublished?
      'unpublished'
    else
      'href'
    end
  end

  def name
    if @view.is_unpublished?
      I18n.t('core.view_types.working_copy')
    else
      I18n.t('core.view_types.href')
    end
  end

  def scrolls_inline?
    false
  end

  def render_partial
    'displays/blob'
  end

  def display_type
    'link'
  end
end
