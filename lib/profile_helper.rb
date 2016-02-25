# Helper for ProfileController.
#
# This file lives in lib/ (not app/helpers) to avoid the broken configuration of
# the rails autoloader (XOXO 2009 Socrata <3).
#
# For some unknown and undocumented reason, ApplicationController specifies
# "helper :all", which causes all helpers to be loaded for all views.
# We want to override view_url for Profiles specifically, but if this file lived
# in app/helpers, the override would take place for _all_ views.
module ProfileHelper
  include Userzoom

  def view_url(view)
    if view.story? && viewing_self?
      story_url(view)
    elsif view.pulse?
      pulse_url(view)
    else
      # Call the original implementation, presumably in ApplicationHelper.
      # If this is throwing, a base module with a view_url implementation
      # hasn't been loaded before this module.
      # Note: This should never happen since `view_url` is a built-in method provided by the routes url helpers.
      # See: Rails.application.routes.url_helpers.methods.grep(/view_url/)
      super
    end
  end

  def profile_item(klass, inner_content, help_text, editable)
    content_tag(:div, :class => klass) do
      content_tag(:h5) do
        content = content_tag(:span, inner_content)
        if (editable)
          innerClasses = ['profileEdit']
          innerClasses << 'initialHide' if inner_content.present?
          content << content_tag(:a, help_text, :href => "#edit", :class => innerClasses.join(' '))
        end

        content
      end
    end
  end

  def edit_link(user, extraClass=nil, text='Edit', url='edit')
    if user == current_user
      content_tag :div, :class => 'editLink' do
        content_tag :a, {:href => "#{profile_path(user)}/#{url}", # i don't like this.
          :class => "editProfileLink iconLink" + (extraClass.nil? ? '' : " #{extraClass}")} do
          content_tag(:span, '', :class => 'icon') + text
        end
      end
    end
  end

  def render_profile_userzoom
    render_userzoom_survey('profile')
  end

  private

  def viewing_self?
    @user.id == current_user.id
  end

  def shared_to?(view, user)
    grants = view.grants || []
    grants.map(&:userId).include?(user.id)
  end

  def owns?(view, user)
    view.owner.id == user.id
  end

  def grant(view, user)
    grants = view.grants || []
    grants.find {|grant| grant.userId == current_user.id } || Grant.new
  end

  def pulse_url(view)
    "/pulse/view/#{view.id}"
  end

  def story_url(view)
    is_admin = current_user.is_admin?
    base_relative_url = "/stories/s/#{view.id}"

    if shared_to?(view, current_user)
      user_grant = grant(view, current_user)
      is_owner = user_grant.type == 'owner'
      is_contributor = user_grant.type == 'contributor'
      is_viewer = user_grant.type == 'viewer'

      if is_contributor || is_owner || is_admin
        base_relative_url << '/edit'
      elsif is_viewer
        base_relative_url << '/preview'
      else
        base_relative_url
      end
    elsif owns?(view, current_user) || is_admin
      base_relative_url << '/edit'
    else
      base_relative_url
    end
  end
end
