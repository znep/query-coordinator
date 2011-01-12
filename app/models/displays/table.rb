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
    if @view.is_blist?
      'blist'
    elsif @view.is_grouped?
      'grouped'
    else
      'filter'
    end
  end

  def invalid_message
    (@view.message || '') + '.'
  end
end
