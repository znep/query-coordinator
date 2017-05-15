module UserHelper

  # Create a drop down menu of US states.
  # Pass a state to select it by default.
  def us_state_select_options(selected_state = nil)
    out = ""
    User.states.sort { |a,b| a[1] <=> b[1] }.each do |state|
      selected = selected_state == state[0] ? " selected=\"selected\"" : ""
      out += "<option value=\"#{state[0]}\"#{selected}>#{state[1]}</option>"
    end
    out
  end

  # Create a drop down menu of Countries.
  # Pass a country to select it by default.
  def country_select_options(selected_country = nil)
    out = ""
    User.countries.sort { |a,b| a[1] <=> b[1] }.each do |country|
      selected = selected_country == country[0] ? " selected=\"selected\"" : ""
      out += "<option value=\"#{country[0]}\"#{selected}>#{country[1]}</option>"
    end
    out
  end

  def links_select_options(selected_link = nil)
    out = ""
    out += "<option value=\"\">-- Select a link type --</option>"
    UserLink.link_types.each do |network|
      out += "<option value=\"#{network[0]}\" #{get_selected(selected_link, network[0])}>#{t('screens.profile.info.links.' + network[1])}</option>"
    end
    out
  end

  def get_selected(test1, test2)
    out = test1 == test2 ? "selected=\"selected\"" : ""
  end
end
