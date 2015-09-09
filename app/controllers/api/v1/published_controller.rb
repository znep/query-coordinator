class Api::V1::PublishedController < ApplicationController

  # Takes a draft story and creates a published version of it, then sets the published story
  # as publicly visible in core.
  def create
    story_publisher = StoryPublisher.new(current_user, story_params, core_request_headers)
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
    params.permit(:uid, :digest)
  end

  def core_request_headers
    CoreServer::headers_from_request(request)
  end
end
