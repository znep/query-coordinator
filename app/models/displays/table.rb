class Displays::Table < Displays::Base
  def initialize(view)
    super
  end

  def name
    if @view.is_blist?
      'table'
    elsif @view.is_grouped?
      'grouped view'
    else
      'filtered view'
    end
  end

  def type
    if @view.is_unpublished?
      'unpublished'
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
