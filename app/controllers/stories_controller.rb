require 'net/http'
require 'uri'
require 'json'

class StoriesController < ApplicationController

  FAKE_DIGEST = 'the contents of the digest do not matter'

  # rescue_from ActiveRecord::RecordNotFound, with: :tmp_render_404
  skip_before_filter :require_logged_in_user, only: [:show]

  before_filter :require_sufficient_rights

  helper_method :needs_view_assets?, :can_update_view?

  def show
    respond_with_story(PublishedStory.find_by_uid(params[:uid]))
  end

  def preview
    respond_with_story(DraftStory.find_by_uid(params[:uid]))
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
        Airbrake.notify_or_ignore(
          RuntimeError.new,
          "TEMPORARY/DEBUG: No story title on view '#{view}'"
        )
        tmp_render_404
      end
    else
      tmp_render_404
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
      @standard_themes = theme_list.standard_theme_list.sort_by { |key| key["title"] }
      @custom_themes = theme_list.custom_theme_list.sort_by { |key| key["title"] }
      @custom_theme_configs = theme_list.themes.
        select { |theme| theme['id'].start_with?('custom-') }.
        map { |theme| Theme.find(theme['id'].gsub('custom-', '')) }
      @published_story = PublishedStory.find_by_uid(params[:uid])

      respond_to do |format|
        format.html { render 'stories/edit', layout: 'editor' }
      end
    else
      tmp_render_404
    end
  end

  def needs_view_assets?
    %w{ show preview }.include?(action_name)
  end

  def can_update_view?
    current_user_authorization.present? &&
    current_user_authorization['rights'].include?('update_view')
  end

  private

  def respond_with_story(story)
    @story = story
    if @story
      respond_to do |format|
        format.html { render 'stories/show' }
        format.json { render json: @story }
      end
    else
      tmp_render_404
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

  # TODO replace this with the real solution
  def tmp_render_404
    render text: 'Whoops! 404. Probably an invalid 4x4', status: 404
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
        "stories_controller##{original_action}"
      )
    end

    redirect_to "/stories/s/#{uid}/edit"
  end

  # This logic is duplicated in Frontend/Browse as story_url
  def require_sufficient_rights
    return tmp_render_404 unless params.present? && params[:uid].present?

    action = params[:action]
    view = CoreServer.get_view(
      params[:uid]
    )
    published_story = PublishedStory.find_by_uid(params[:uid])

    return tmp_render_404 unless view.present? && view['rights'].present?

    if action == 'edit'
      tmp_render_404 unless view['rights'].include?('write')
    elsif action == 'show' || action == 'preview'
      tmp_render_404 unless view['rights'].include?('read')
    elsif action == 'show' && view
    end
  end
end
