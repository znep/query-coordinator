class Api::V1::DraftsController < ApplicationController

  def create
    digest = request.env['HTTP_IF_MATCH']

    if digest.blank?
      return render nothing: true, status: 428
    end

    story_draft_creator = StoryDraftCreator.new(
      user: current_user,
      uid: params[:uid],
      digest: digest,
      blocks: params[:blocks],
      theme: params[:theme]
    )

    begin
      @new_draft_story = story_draft_creator.create
    rescue StoryDraftCreator::DigestMismatchError
      return render nothing: true, status: 412
    end

    headers['X-Story-Digest'] = @new_draft_story.digest

    response_obj = {
      blockIdMappings: story_draft_creator.block_id_mappings,
      blocks: @new_draft_story.blocks
    }

    render json: response_obj
  end
end
