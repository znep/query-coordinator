class Api::V1::PublishedStoriesController < ApplicationController
  def create
    story_publisher = StoryPublisher.new(current_user, story_params)
    published = story_publisher.publish

    if published
      render json: story_publisher.story, status: 200
    else
      render json: { errors: story_publisher.errors.messages }, status: :unprocessable_entity
    end
  end

  def story_params
    params.permit(:uid, :digest)
  end
end
