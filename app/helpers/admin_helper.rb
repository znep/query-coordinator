module AdminHelper
  def select_for_role(id, name='role', currentRole = nil, cssClass='', includeNone = true)
    roles = User.roles_list.map {|r| r[0]}
    
    out = "<select class='#{cssClass}' name='#{name}' id='#{id}'>"
    out += "<option value='0'>none</option>" if includeNone
    
    roles.each do |role|
      out += "<option"
      out += ' selected="selected"' if currentRole && role == currentRole
      out += ">" + role.titleize + "</option>"
    end
    out += "</select>"
  end
end
