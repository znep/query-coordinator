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

  def new
    view = CoreServer::get_view(params[:four_by_four], core_request_headers)

    if view.present?
      @story_title = view['name']

      if story_is_uninitialized?(view['metadata']) && @story_title.present?
        render 'stories/new'
      elsif !@story_title.nil?
        redirect_to "/stories/s/#{params[:four_by_four]}/edit"
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
    view = CoreServer::get_view(params[:four_by_four], core_request_headers)

    if view.present?
      dirty_title = params[:title] ||= ''
      updated_metadata = nil

      if should_create_draft_story?(view, params[:four_by_four])
        clean_four_by_four = params[:four_by_four]
        clean_title = sanitize_story_title(dirty_title)

        @story = DraftStory.create(
          :uid => clean_four_by_four,
          :title => clean_title,
          :block_ids => [],
          :created_by => current_user['id']
        )

        if @story.persisted?

          view['name'] = clean_title
          view['metadata']['accessPoints'] ||= {}
          view['metadata']['accessPoints']['story'] = "https://#{request.host}/stories/s/#{clean_four_by_four}/edit"
          view['metadata']['initialized'] = true

          updated_view = CoreServer::update_view(clean_four_by_four, core_request_headers, view)

          if updated_view.nil?
            Rails.logger.error(
              "Successfully bootstrapped story with uid '#{clean_four_by_four}' " \
              "but failed to update the 'initialized' flag in the view metadata."
            )
            # TODO: Notify Airbrake
          end

          redirect_to "/stories/s/#{clean_four_by_four}/edit"
        else
          redirect_to "/stories/s/#{clean_four_by_four}/create", :flash => {
            :error => I18n.t('stories_controller.story_creation_error_flash')
          }
        end
      else
        redirect_to '/', :flash => {
          :error => I18n.t('stories_controller.permissions_error_flash')
        }
      end
    else
      redirect_to '/', :flash => {
        :error => I18n.t('stories_controller.not_found_error_flash')
      }
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

  def authentication_cookie
    env['HTTP_COOKIE']
  end

  def should_create_draft_story?(view, four_by_four)
    story_belongs_to_current_user?(view, four_by_four) && story_is_uninitialized?(view['metadata'])
  end

  def story_belongs_to_current_user?(view, four_by_four)
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
    # count. Truncating a string in Ruby using the [0..n] syntax will result
    # in a string of length n + 1, however, so we truncate the string to
    # 254 characters below to ensure that the resulting string will never
    # exceed the 255 character limit enforced by the database.
    dirty_title.gsub(/\s+/, ' ').gsub(/[^A-Za-z0-9\-\:\s]/, '')[0...255]
  end

  def core_request_headers
    {
      'Cookie' => authentication_cookie,
      'X-Socrata-Host' => request.host
    }
  end

  # TODO replace this with the real solution
  def tmp_render_404
    render text: 'Whoops! 404. Probably an invalid 4x4', status: 404
  end
end
