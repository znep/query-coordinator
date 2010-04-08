module AdminHelper
  def select_for_role(id, name='role', currentRoles = nil, cssClass='')
    roles = User.roles_list.map {|r| r[0]}
    
    out = "<select class='#{cssClass}' name='#{name}' id='#{id}'>"
    out += "<option value='0'>none</option>"
    
    roles.each do |role|
      out += "<option"
      out += ' selected="selected"' if currentRoles && role == currentRoles[-1]
      out += ">" + role + "</option>"
    end
    out += "</select>"
  end
end