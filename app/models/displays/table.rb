# This defines the default tabular display.  The actual code for the display is spread throughout the view layer
# because tables require deeper integration than other displays.
# TODO - confirm this is true or move rendering code here
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

  def can_advanced_publish?
    true
  end

  def required_edit_javascripts
    ['shared-table-editor']
  end

  def invalid_message
    (@view.message || '') + '.'
  end

  def valid?
    @view.message.blank?
  end
end
