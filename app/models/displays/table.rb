class Displays::Table < Displays::Base
  def initialize(view)
    super
  end

  def name
    if @view.is_blist?
      I18n.t('core.view_types.table')
    elsif @view.is_grouped?
      I18n.t('core.view_types.group')
    else
      I18n.t('core.view_types.filter')
    end
  end

  def type
    if @view.is_unpublished?
      'unpublished'
    elsif @view.is_api_geospatial?
      'map'
    elsif @view.is_blist? && @view.is_snapshotted?
      'snapshotted'
    elsif @view.is_blist?
      'blist'
    elsif @view.is_grouped?
      'grouped'
    else
      'filter'
    end
  end
end
