class Api::V1::PublishedController < ApplicationController

  def create
    story_publisher = StoryPublisher.new(current_user, story_params)
    published = story_publisher.publish

    permissions = Permissions.new(current_user, params[:uid], core_request_headers)
    permissions_response = nil

    begin
      permissions_response = permissions.update_permissions(is_public: true)
    rescue => exception
      AirbrakeNotifier.report_error(exception, 'Permissions service object did not instantiate successfully.')
    end

    if published && permissions_response.present?
      published_story = story_publisher.story.attributes.clone
      published_story['isPublic'] = true
      render json: published_story, status: :ok
    else
      if !published
        # TODO: Undo permissions, or retry publish
      end

      if permissions_response.nil?
        # TODO: Undo published story, or retry permissions
      end

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
