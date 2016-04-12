class Displays::Table < Displays::Base
  def initialize(view)
    super
  end

  def name
    if @view.is_blist?
      I18n.t('core.view_types.table')
    elsif @view.is_grouped?
      I18n.t('core.view_types.group')
    elsif @view.draft?
      I18n.t('core.view_types.draft')
    else
      I18n.t('core.view_types.filter')
    end
  end

  def type
    if @view.draft?
      'draft'
    elsif @view.is_unpublished?
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

  def icon_class
    if @view.draft?
      'icon-table'
    else
      super
    end
  end
end
