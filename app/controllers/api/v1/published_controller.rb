class Api::V1::PublishedController < ApplicationController
  force_ssl_for_internet_requests

  # Gets the latest published version of a story.
  def latest
    @story = PublishedStory.find_by_uid(params[:uid])

    if @story
      render json: @story
    else
      render_story_404
    end
  end

  # Takes a draft story and creates a published version of it, then sets the published story
  # as publicly visible in core.
  def create
    story_publisher = StoryPublisher.new(current_user, current_user_story_authorization, story_params)
    success = story_publisher.publish

    if success
      published_story_attributes = story_publisher.story.attributes.clone
      published_story_attributes['isPublic'] = true
      render json: published_story_attributes, status: :ok
    else
      render json: { error: true }, status: :internal_server_error
    end
  end

  private

  def story_params
    params.permit(:uid, :digest, :theme)
  end
end
