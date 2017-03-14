class Displays::Form < Displays::Base
  def valid?
    @view.columns.any? {|c| !c.flag?('hidden') && c.dataTypeName != 'nested_table'}
  end

  def invalid_message
    'A form must have at least one visible column'
  end

  def scrolls_inline?
    false
  end

  def render_partial
    return 'displays/form_view'
  end

  def is_public?
    @view.grants && @view.grants.any? {|p| p.flag?('public') &&
      p.type.downcase == 'contributor'}
  end

  def public_perm_type
    ViewRights::ADD
  end

  def type
    'form'
  end

  def name
    I18n.t('core.view_types.form')
  end
end
