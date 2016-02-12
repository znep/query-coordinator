require 'net/http'
require 'uri'
require 'json'

class StoriesController < ApplicationController
  include StoriesHelper
  include UserAuthorizationHelper

  FAKE_DIGEST = 'the contents of the digest do not matter'

  # rescue_from ActiveRecord::RecordNotFound, with: :tmp_render_404
  skip_before_filter :require_logged_in_user, only: [:show, :widget]

  before_filter :require_sufficient_rights

  after_action :allow_iframe, only: :widget
  helper_method :needs_view_assets?, :contributor?

  def show
    # This param is set in the link provided to users who receive a collaboration request
    # via email. In this case, we want to redirect them to the most privileged action they
    # have access to.
    if params['from_collaboration_email']
      login_then_redirect_to_highest_privilege
    else
      @site_chrome = SiteChrome.for_current_domain
      respond_with_story(PublishedStory.find_by_uid(params[:uid]))
    end
  end

  def preview
    @site_chrome = SiteChrome.for_current_domain
    respond_with_story(DraftStory.find_by_uid(params[:uid]))
  end

  def widget
    @story = PublishedStory.find_by_uid(params[:uid])

    if @story
      StoryAccessLogger.log_story_view_access(@story)

      core_attributes = CoreServer.get_view(@story.uid) || {}

      respond_to do |format|
        format.html { render 'stories/widget', layout: 'widget' }
        format.json {

          render(
            json: {
              title: core_attributes['name'] || t('default_page_title'),
              description: core_attributes['description'] || nil,
              image: @story.block_images.first || nil,
              theme: @story.theme,
              url: story_url(uid: @story.uid)
            }
          )
        }
      end
    else
      render_404
    end
  end

  def new
    view = CoreServer.get_view(params[:uid])

    if view.present?
      @story_title = view['name']

      if story_is_uninitialized?(view['metadata']) && @story_title.present?
        render 'stories/new', layout: 'modal'
      elsif !@story_title.nil?
        redirect_to "/stories/s/#{params[:uid]}/edit"
      else
        AirbrakeNotifier.report_error(
          RuntimeError.new("TEMPORARY/DEBUG: No story title on view '#{view}'",
          on_method: 'stories_controller#new')
        )
        render_404
      end
    else
      render_404
    end
  end

  def create
    view = CoreServer.get_view(params[:uid])

    return redirect_to '/', :flash => {
      :error => I18n.t('stories_controller.not_found_error_flash')
    } unless view.present?

    dirty_title = params[:title] ||= ''

    return redirect_to '/', :flash => {
      :error => I18n.t('stories_controller.permissions_error_flash')
    } unless should_create_draft_story?(view)

    clean_uid = params[:uid]
    clean_title = sanitize_story_title(dirty_title)

    story_draft_creator = StoryDraftCreator.new(
      user: current_user,
      uid: clean_uid,
      digest: FAKE_DIGEST,
      blocks: [generate_example_block.as_json.symbolize_keys],
      theme: 'classic' #TODO: make this default configurable by domain
    )

    @story = story_draft_creator.create

    finish_story_creation('create', view, clean_uid, clean_title)
  end

  def about
    story = DraftStory.find_by_uid(params[:uid])

    if story.present?
      redirect_to "/datasets/#{params[:uid]}/about"
    else
      render_404
    end
  end

  def copy
    view = CoreServer.get_view(params[:uid])
    story = DraftStory.find_by_uid(params[:uid])

    return redirect_to '/', :flash => {
      :error => I18n.t('stories_controller.not_found_error_flash')
    } unless view.present? && story.present?

    copy_title = params[:title] || "Copy of #{view['name']}"
    copy_title = sanitize_story_title(copy_title)

    view_copy = CoreServer.create_view(copy_title)

    return redirect_to '/', :flash => {
      :error => I18n.t('stories_controller.permissions_error_flash')
    } unless should_create_draft_story?(view_copy)

    copy_uid = view_copy['id']
    blocks = story.blocks.map do |block|
      block.as_json.symbolize_keys
    end

    story_draft_creator = StoryDraftCreator.new(
      user: current_user,
      uid: copy_uid,
      digest: FAKE_DIGEST,
      blocks: blocks,
      theme: story.theme
    )

    @story = story_draft_creator.create

    finish_story_creation('copy', view_copy, copy_uid, copy_title)
  end

  def edit
    @story = DraftStory.find_by_uid(params[:uid])

    if @story
      @inspiration_category_list = InspirationCategoryList.new.to_parsed_json
      theme_list = ThemeList.new
      @standard_theme_configs = theme_list.standard_theme_list.sort_by { |key| key["title"] }
      @custom_theme_configs = theme_list.custom_theme_list.sort_by { |key| key["title"] }
      @custom_themes = theme_list.custom_themes
      @published_story = PublishedStory.find_by_uid(params[:uid])
      @primary_owner_uid = CoreServer.get_view(params[:uid])['owner']['id']

      respond_to do |format|
        format.html { render 'stories/edit', layout: 'editor' }
      end
    else
      render_404
    end
  end

  def needs_view_assets?
    %w{ show preview }.include?(action_name)
  end

  private

  # It looks like Rails is automatically setting 'X-Frame-Options: SAMEORIGIN'
  # somewhere, but that clearly won't work with an embeddable widget so we
  # remove it for this endpoint.
  def allow_iframe
    response.headers.except! 'X-Frame-Options'
  end

  def respond_with_story(story)
    @story = story

    if @story
      StoryAccessLogger.log_story_view_access(story)
      respond_to do |format|
        format.html { render 'stories/show' }
        format.json { render json: @story }
      end
    else
      render_404
    end
  end

  def should_create_draft_story?(view)
    story_belongs_to_current_user?(view) &&
      story_is_uninitialized?(view['metadata'])
  end

  def story_belongs_to_current_user?(view)
    current_user_created_story = false
    owner_id = nil

    if view.present? && view['owner'].present?
      owner_id = view['owner']['id']
    end

    if owner_id.present?
      current_user_created_story = (owner_id == current_user['id'])
    end

    current_user_created_story
  end

  def story_is_uninitialized?(view_metadata)
    view_metadata.present? &&
      view_metadata.key?('initialized') &&
      view_metadata['initialized'] == false
  end

  def sanitize_story_title(dirty_title)
    # The `name` column of the `lenses` table is defined as:
    #
    #   name character varying(255)
    #
    # Here 255 is the maxiumum allowed length, not the maxiumum character
    # count. The [n...m] operation will truncate to that length, not to
    # m characters ([n..m] will truncate to m characters).
    sanitized_title = dirty_title[0...255]

    if sanitized_title.empty?
      sanitized_title = nil
    end

    sanitized_title
  end

  def generate_example_block
    inspiration_category_list = InspirationCategoryList.new.blocks

    example_block = inspiration_category_list[0]['blockContent']
    example_block['created_by'] = current_user['id']

    Block.create(example_block.except('id'))
  end

  def finish_story_creation(original_action, view, uid, title)
    return redirect_to "/stories/s/#{uid}/create", :flash => {
      :error => I18n.t('stories_controller.error_creating_story_flash')
    } unless @story.persisted?

    # `sanitize_story_title` will return nil if it is passed an empty
    # string (attempting to update a view with an empty name is a
    # validation error). In this case, we fall back to whatever name
    # the view previously had.
    if title.present?
      view['name'] = title
    end

    view['metadata']['initialized'] = true

    updated_view = CoreServer.update_view(uid, view)

    if updated_view.nil?
      error_message = "Successfully bootstrapped story with uid '#{uid}' " \
        "but failed to update the title or 'initialized' flag in the view " \
        "metadata."

      AirbrakeNotifier.report_error(
        StandardError.new(error_message),
        on_method: "stories_controller##{original_action}"
      )
    end

    redirect_to "/stories/s/#{uid}/edit"
  end

  # This logic is duplicated in Frontend/Browse as story_url
  def require_sufficient_rights
    action = params[:action]

    if action == 'edit'
      render_404 unless can_edit_story?
    elsif action == 'copy'
      render text: 'It seems that you don\'t have access to do that. Sorry!', status: 403 unless can_make_copy?
    elsif action == 'preview'
      render_404 unless can_view_unpublished_story?
    end
  end

  def render_404
    respond_to do |format|
      format.html { render 'stories/404', layout: '404', status: 404 }
      format.json { render json: {error: '404 Not Found'}, status: 404 }
    end
  end

  def login_then_redirect_to_highest_privilege
    if current_user.present?
      if can_edit_story?
        redirect_to :action => :edit
      elsif can_view_unpublished_story?
        redirect_to :action => :preview
      else
        redirect_to :action => :show
      end
    else
      require_logged_in_user # Redirect them to login, then back here.
    end
  end
end
