module CommunitiesHelper


  def get_html_for_activity(activity, style = "short")
    out = Array.new
    unless (style == "short")
      out << "<a href=#{profile_path(activity.actor.id)}><img src='/users/#{activity.actor.id}/profile_images/medium' width='40' height='40' alt='#{activity.actor.displayName}' /></a>"
    end
    out << "<a href=#{profile_path(activity.actor.id)}>#{activity.actor.displayName}</a> "
    out << get_verb_for_activity_action(activity.action)
    out << get_html_for_action_object(activity)
    unless (style == "short")
      out << friendly_relative_time(activity.createdAt)
    end
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
    when "promote_dataset"
      out = "promoted"
    when "update_profile"
      out = "updated their profile"
    when "add_profile_photo"
      out = "added a profile photo"
    when "publish_widget"
      out = "published a widget for"
    when "moderate_comment"
      out = "moderated a comment for"
    when "rate_comment"
      out = "rated a comment for"
    when "reply_to_comment"
      out = "replied to a comment for"
    end
    out
  end
  
  def get_html_for_action_object(activity)
    out = ""
    case activity.action
    when "add_contact"
      out = "<a href='#{profile_path(activity.actee.id)}'>#{h(activity.actee.displayName)}</a>"
    when "create_view", "create_blist", "edit_blist", "comment", "rated", 
          "comment_and_rate", "promote_dataset", "published", "moderate_comment", 
          "rate_comment", "reply_to_comment"
      out = "<a href='#{blist_path(activity.actedOnId)}'>#{h(activity.actedOnName)}</a>"
    end
    out
  end
  
  def get_url_for_activity_action(activity)
    case activity.action
    when "add_contact"
      out = profile_path(activity.actee.id)
    when "create_view", "create_blist", "edit_blist", "comment", "rated", 
          "comment_and_rate", "promote_dataset", "published", "moderate_comment", 
          "rate_comment", "reply_to_comment"
      out = blist_path(activity.actedOnId)
    end
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
