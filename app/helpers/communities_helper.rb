module CommunitiesHelper

  def get_html_for_activity(activity, style = "short")
    out = Array.new
    unless (style == "short")
      out << "<a href=#{activity.actor.href}><img src='/users/#{activity.actor.id}/profile_images/medium' width='40' height='40' alt='#{activity.actor.displayName}' /></a>"
    end
    out << "<a href=#{activity.actor.href}>#{activity.actor.displayName}</a> "
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
      out = "joined #{th.company}"
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
      out = "published a Social Data Player for"
    when "moderate_comment"
      out = "moderated a comment for"
    when "rate_comment"
      out = "rated a comment for"
    when "reply_to_comment"
      out = "replied to a comment for"
    end
    out
  end
  
  def get_html_for_action_object(activity, external = false)
    out = ""
    case activity.action
    when "add_contact"
      out = "<a href='#{activity.actee.href}'"
      if (external)
        out += " rel='external'"
      end
      out += ">#{h(activity.actee.displayName)}</a>"
    when "create_view", "create_blist", "edit_blist", "comment", "rate", 
          "comment_and_rate", "promote_dataset", "published", "moderate_comment", 
          "rate_comment", "reply_to_comment"
      # FIXME: Use blist_path or dataset_path after refactor
      out = "<a href='/dataset/#{activity.actedOnId}'"
      if (external)
        out += " rel='external'"
      end
      out += ">#{h(activity.actedOnName)}</a>"
    end
    out
  end
  
  def get_url_for_activity_action(activity)
    case activity.action
    when "add_contact"
      out = activity.actee.href
    when "create_view", "create_blist", "edit_blist", "comment", "rated", 
          "comment_and_rate", "promote_dataset", "published", "moderate_comment", 
          "rate_comment", "reply_to_comment"
      out = blist_path(activity.actedOnId)
    end
  end
  
  def community_sort_select_options(current_sort = nil)
    options_for_select(User.sorts.map { |a, b| [b, a] }, current_sort)
  end

end
