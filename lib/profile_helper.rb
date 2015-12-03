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

  # Implement special-case behavior:
  # Stories should load in the editor if
  #   * opened from a profile page AND
  #   * the user is looking at their own profile page.
  def view_url(view)
    if view.story? && @user.id == current_user.id
      "/stories/s/#{view.id}/edit"
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
end
