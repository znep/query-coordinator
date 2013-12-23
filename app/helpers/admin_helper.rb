module AdminHelper
  def select_for_role(id, name='role', currentRole = nil, cssClass='', includeNone = true)
    roles = User.roles_list

    out = "<select class='#{cssClass}' name='#{name}' id='#{id}'>"
    out << "<option value='0'>#{t('screens.admin.users.roles.none')}</option>" if includeNone

    roles.each do |role|
      out << "<option value=\"#{role}\""
      out << ' selected="selected"' if currentRole && role == currentRole
      # Use default to allow user-translated role names.
      out << ">" + I18n.t(key: role, scope: 'screens.admin.users.roles', default: role).titleize + "</option>"
    end
    out << "</select>"
  end

  def form_button(url_opts, button_text, opts = {}, button_opts = {})
    form_tag(url_opts, opts) do
      ((yield if block_given?) || ''.html_safe) +
        submit_tag(button_text, {:class => 'button'}.merge(button_opts))
    end
  end

  def notification_interval_select_options(selected_option = nil)
    options_for_select(Approval.notification_intervals.invert.sort { |a, b|
      a.last.to_i - b.last.to_i }, (selected_option || '').to_s)
  end
end
