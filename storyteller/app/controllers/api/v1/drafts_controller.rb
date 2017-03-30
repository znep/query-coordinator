class Api::V1::DraftsController < ApplicationController
  force_ssl_for_internet_requests

  def latest
    @story = DraftStory.find_by_uid(params[:uid])

    if @story
      render json: @story
    else
      render_story_404
    end
  end

  def create
    digest = request.env['HTTP_IF_MATCH']

    story_draft_creator = StoryDraftCreator.new(
      user: current_user,
      uid: params[:uid],
      digest: digest,
      blocks: params[:blocks],
      theme: params[:theme]
    )

    begin
      @new_draft_story = story_draft_creator.create
    rescue StoryDraftCreator::DigestMismatchError => e
      Rails.logger.warn(e)
      draft = DraftStory.find_by_uid(params[:uid])
      return render({
        json: {
          error: 'X-Story-Digest did not match the latest draft digest.',
          conflictingUserId: draft.try(:created_by)
        },
        status: 412
      })
    rescue StoryDraftCreator::DigestMissingError => e
      Rails.logger.warn(e)
      return render :json => { :error => e.message }, :status => 428
    end

    headers['X-Story-Digest'] = @new_draft_story.digest

    response_obj = @new_draft_story.as_json

    render json: response_obj
  end
end
