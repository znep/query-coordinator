require 'net/http'
require 'uri'
require 'json'

class StoriesController < ApplicationController

  # rescue_from ActiveRecord::RecordNotFound, with: :tmp_render_404
  skip_before_filter :require_logged_in_user, only: [:show]

  def show
    respond_with_story(PublishedStory.find_by_uid(params[:uid]))
  end

  def preview
    respond_with_story(DraftStory.find_by_uid(params[:uid]))
  end

  def new
    view = CoreServer::get_view(params[:uid], core_request_headers)

    if view.present?
      @story_title = view['name']

      if story_is_uninitialized?(view['metadata']) && @story_title.present?
        render 'stories/new', layout: 'new'
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
    view = CoreServer::get_view(params[:uid], core_request_headers)

    return redirect_to '/', :flash => {
      :error => I18n.t('stories_controller.not_found_error_flash')
    } unless view.present?

    dirty_title = params[:title] ||= ''
    updated_metadata = nil

    return redirect_to '/', :flash => {
      :error => I18n.t('stories_controller.permissions_error_flash')
    } unless should_create_draft_story?(view)

    clean_uid = params[:uid]
    clean_title = sanitize_story_title(dirty_title)

    @story = DraftStory.create(
      :uid => clean_uid,
      :block_ids => [generate_example_block.id],
      :created_by => current_user['id'],
      :theme => 'classic' #TODO: make this default configurable by domain
    )

    return redirect_to "/stories/s/#{clean_uid}/create", :flash => {
      :error => I18n.t('stories_controller.story_creation_error_flash')
    } unless @story.persisted?

    # `sanitize_story_title` will return nil if it is passed an empty
    # string (attempting to update a view with an empty name is a
    # validation error). In this case, we fall back to whatever name
    # the view previously had.
    if clean_title.present?
      view['name'] = clean_title
    end

    view['metadata']['accessPoints'] ||= {}
    view['metadata']['accessPoints']['story'] = "https://#{request.host}/stories/s/#{clean_uid}"
    view['metadata']['initialized'] = true

    updated_view = CoreServer::update_view(clean_uid, core_request_headers, view)

    if updated_view.nil?
      error_message = "Successfully bootstrapped story with uid '#{clean_uid}' " \
        "but failed to update the title or 'initialized' flag in the view metadata."

      AirbrakeNotifier.report_error(
        StandardError.new(error_message),
        "stories_controller#create"
      )
    end

    redirect_to "/stories/s/#{clean_uid}/edit"
  end

  def edit
    @inspiration_category_list = InspirationCategoryList.new.to_parsed_json
    @theme_list = ThemeList.new.themes
    @story = DraftStory.find_by_uid(params[:uid])
    @published_story = PublishedStory.find_by_uid(params[:uid])

    if @story
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

  helper_method :needs_view_assets?

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
    story_belongs_to_current_user?(view) && story_is_uninitialized?(view['metadata'])
  end

  def story_belongs_to_current_user?(view)
    current_user_created_story = false
    owner_id = nil

    if view['owner'].present?
      owner_id = view['owner']['id']
    end

    if owner_id.present?
      current_user_created_story = (owner_id == current_user['id'])
    end

    current_user_created_story
  end

  def story_is_uninitialized?(view_metadata)
    view_metadata.present? && view_metadata.key?('initialized') && view_metadata['initialized'] == false
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

  def core_request_headers
    CoreServer::headers_from_request(request)
  end

  # TODO replace this with the real solution
  def tmp_render_404
    render text: 'Whoops! 404. Probably an invalid 4x4', status: 404
  end
end
