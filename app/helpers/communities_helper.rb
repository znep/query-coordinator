module CommunitiesHelper


  def get_html_for_activity(activity, style = "short")
    out = Array.new
    unless (style == "short")
      out << "<a href=#{profile_url(activity.actor.id)}><img src='/users/#{activity.actor.id}/profile_images/medium' width='40' height='40' alt='#{activity.actor.displayName}' /></a>"
    end
    out << "<a href=#{profile_url(activity.actor.id)}>#{activity.actor.displayName}</a> "
    out << get_verb_for_activity_action(activity.action)
    out << get_html_for_action_object(activity)
    out.join(" ")
  end
  
  def get_verb_for_activity_action(action)
    out = ""
    case action
    when "add_contact"
      out = "is following"
    when "create_view", "create_blist"
      out = "created"
    when "edit_blist"
      out = "edited"
    when "join_blist"
      out = "joined #{t(:blist_company)}"
    when "comment"
      out = "commented on"
    when "rate"
      out = "rated"
    when "comment_and_rate"
      out = "commented on and rated"
    end
    out
  end
  
  def get_html_for_action_object(activity)
    out = ""
    case activity.action
    when "add_contact"
      out = "<a href='#{profile_url(activity.actedOnId)}'>#{h(activity.actedOnName)}</a>"
    when "create_view", "create_blist", "edit_blist", "comment", "rated", "comment_and_rate"
      out = "<a href='#{blist_url(activity.actedOnId)}'>#{h(activity.actedOnName)}</a>"
    end
    out
  end
  
  def community_sort_select_options(current_sort = nil)
    out = ""
    User.sorts.each do |sort|
      selected = current_sort == sort[0] ? " selected=\"selected\"" : ""
      out += "<option value=\"#{sort[0]}\"#{selected}>#{sort[1]}</option>"
    end
    out
  end

end