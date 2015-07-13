require 'net/http'
require 'uri'
require 'json'

class StoriesController < ApplicationController

  # rescue_from ActiveRecord::RecordNotFound, with: :tmp_render_404

  def show
    @story = PublishedStory.find_by_four_by_four(params[:four_by_four])
    if @story
      respond_to do |format|
        format.html { render 'stories/show' }
        format.json { render json: @story }
      end
    else
      tmp_render_404
    end
  end

  def create
    view = CoreServer::get_view(params[:four_by_four], env['HTTP_COOKIE'])
    view_metadata = view.fetch('metadata', nil)
    @story_title = view.fetch('name', nil)

    if story_is_uninitialized?(view_metadata) && @story_title.present?
      render 'stories/create'
    elsif @story_title.present?
      redirect_to "/stories/s/#{params[:four_by_four]}/edit"
    else
      tmp_render_404
    end
  end

  def bootstrap
    view = CoreServer::get_view(params[:four_by_four], env['HTTP_COOKIE'])
    view_metadata = nil
    dirty_title = params[:title] ||= ''
    updated_metadata = nil

    if view.present?

      view_metadata = view.fetch('metadata', nil)

      if view_metadata.present? &&
        story_belongs_to_current_user?(view, params[:four_by_four]) &&
        story_is_uninitialized?(view_metadata)

        clean_title = sanitize_story_title(dirty_title)

        @story = DraftStory.create(
          :uid => params[:four_by_four],
          :title => clean_title,
          :block_ids => [],
          :created_by => current_user['id']
        )

        if @story.persisted?

          view_metadata['initialized'] = true
          updated_metadata = CoreServer::update_view_metadata(params[:four_by_four], env['HTTP_COOKIE'], view_metadata)

          if updated_metadata.nil?
            Rails.logger.error(
              "Successfully bootstrapped story with uid `#{params[:four_by_four]}` " \
              "but failed to update the `initialized` flag in the view metadata."
            )
            # TODO: Notify Airbrake
          end

          redirect_to "/stories/s/#{params[:four_by_four]}/edit"
        else
          flash[:error] = I18n.t('stories_controller.story_creation_error_flash')
          redirect_to "/stories/s/#{params[:four_by_four]}/create"
        end
      else
        flash[:error] = I18n.t('stories_controller.permissions_error_flash')
        redirect_to '/'
      end
    else
      flash[:error] = I18n.t('stories_controller.not_found_error_flash')
      redirect_to '/'
    end
  end

  def edit
    @inspiration_story = InspirationStory.new
    @story = DraftStory.find_by_four_by_four(params[:four_by_four])

    if @story
      respond_to do |format|
        format.html { render 'stories/edit', layout: 'editor' }
      end
    else
      tmp_render_404
    end
  end

  private

  def story_belongs_to_current_user?(view, four_by_four)
    current_user_created_story = false
    owner_id = nil

    if view.fetch('owner', nil).present?
      owner_id = view['owner'].fetch('id', nil)
    end

    if owner_id.present?
      current_user_created_story = (owner_id == current_user['id'])
    end

    current_user_created_story
  end

  def story_is_uninitialized?(view_metadata)
    # Note that the line before cannot check that `view_metadata.fetch('initialized', nil).present?`
    # because the expected value of view_metadata['initialized'] is `false` at this point.
    view_metadata.present? && view_metadata.fetch('initialized', nil) != true
  end

  def sanitize_story_title(dirty_title)
    # The `name` column of the `lenses` table is defined as:
    #
    #   name character varying(255)
    #
    # Here 255 is the maxiumum allowed length, not the maxiumum character
    # count. Truncating a string in Ruby using the [0..n] syntax will result
    # in a string of length n + 1, however, so we truncate the string to
    # 254 characters below to ensure that the resulting string will never
    # exceed the 255 character limit enforced by the database.
    dirty_title.gsub(/\s+/, ' ').gsub(/[^A-Za-z0-9\-\: ]/, '')[0..254]
  end

  # TODO replace this with the real solution
  def tmp_render_404
    render text: 'Whoops! 404. Probably an invalid 4x4', status: 404
  end
end
