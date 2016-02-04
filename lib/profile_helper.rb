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

  def view_url(view)
    if view.story? && viewing_self?
      story_url(view)
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

  def profile_user_zoom
    if current_domain.member?(current_user)
      render :partial => 'templates/userzoom_survey_script', :locals => {
        :userzoom_set_id => '8EEF9FD913C6E51180CC0050569444FB',
        :userzoom_set_sid => '8DEF9FD913C6E51180CC0050569444FB'
      }
    end
  end

  private

  def story_url(view)
    base_relative_url = "/stories/s/#{view.id}"

    return base_relative_url unless view.rights.present?

    # This logic is duplicated in Storyteller as require_sufficient_rights
    if current_user.has_right?(UserRights::EDIT_STORY)
      base_relative_url << '/edit'
    elsif current_user.has_right?(UserRights::VIEW_UNPUBLISHED_STORY)
      base_relative_url << '/preview'
    else
      base_relative_url
    end
  end

  def viewing_self?
    @user.id == current_user.id
  end
end
