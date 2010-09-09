class Displays::Form < Displays::Base
  def valid?
    @view.columns.any? {|c| return !c.flag?('hidden') &&
      c.dataTypeame != 'tag' && c.dataTypeName != 'nested_table'}
  end

  def invalid_message
    'A form must have at least one visible column'
  end

  def scrolls_inline?
    false
  end

  def render_widget_chrome?
    false
  end

  def render_widget_tabs?
    false
  end

  def required_stylesheets
    [ 'displays-form' ]
  end

  def render_partial
    return 'displays/form_view'
  end

  def render_publishing_partial
    return 'displays/form_tab_publishing'
  end

  def is_public?
    @view.grants && @view.grants.any? {|p| p.flag?('public') &&
      p.type.downcase == 'contributor'}
  end

  def public_perm_type
    'add'
  end

  def can_advanced_publish?
      false
  end
end
