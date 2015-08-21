class DraftsController < ApplicationController

  def create
    story_draft_creator = StoryDraftCreator.new(
      user: current_user,
      uid: params[:uid],
      digest: request.env['HTTP_IF_MATCH'],
      blocks: params[:blocks]
    )

    begin
      @new_draft_story = story_draft_creator.create
    rescue StoryDraftCreator::DigestMismatchError
      return render nothing: true, status: 412
    end

    response['ETag'] = @new_draft_story.digest

    response_obj = {
      blockIdMappings: story_draft_creator.block_id_mappings,
      blocks: @new_draft_story.blocks
    }

    render json: response_obj
  end

end
