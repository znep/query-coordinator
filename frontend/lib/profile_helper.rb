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
  include UserAuthMethods
  include Socrata::UrlHelpers
  include ThirdPartySurvey

  # Override view_url helper used by render_browse.
  def view_url(view)
    # Profile-page-specific linking for stories.
    # The profile page is where users go to edit their stories or access stories
    # that have been shared to them, so we should link to the appropriate experience
    # depending on role and access level.
    if view.story?
      # Order of the statements below is important.
      return super if viewing_others_profile?
      return edit_story_url(view) if view.can_edit_story?(current_user)
      return preview_story_url(view) if view.can_preview_story?(current_user)
    end

    if view.draft? and view.can_edit? and FeatureFlags.derive(nil, request).dsmp_level != "off"
      category = view.category ? view.category.convert_to_url : "dataset"
      return current_revision_path({:id => view.id, :view_name => view.name.convert_to_url, :category => category})
    end

    if view.visualization_canvas?
      return visualization_canvas_url(view) if viewing_others_profile?
      return edit_visualization_canvas_url(view) if view.can_edit?
    end

    if view.op_measure?
      return op_measure_url(view) if viewing_others_profile?
      return edit_op_measure_url(view) if view.can_edit?
    end

    super
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

  def edit_link(user, extraClass=nil, text='Edit', url='edit', include_icon=true)
    if user == current_user
      content_tag :div, :class => 'editLink' do
        content_tag :a, {:href => "#{profile_path(user)}/#{url}", # i don't like this.
          :class => "editProfileLink iconLink" + (extraClass.nil? ? '' : " #{extraClass}")} do
            link = ''
            if (include_icon)
                link << content_tag(:span, '', :class => 'icon')
            end
            link << text
            link.html_safe
        end
      end
    end
  end

  def render_profile_qualtrics
    render_qualtrics_survey('profile')
  end

  def profile_asset_browser_initial_state
    {
      :targetUserId => @asset_browser_config[:target_user_id]
    }
  end

  private

  def viewing_others_profile?
    @user.id != current_user.id
  end
end
