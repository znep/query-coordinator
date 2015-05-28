class PublishedStoriesController < ApplicationController
  # rescue_from ActiveRecord::RecordNotFound, with: :tmp_render_404

  def show
    @published_story = PublishedStory.where(
      four_by_four: params[:four_by_four],
      deleted_at: nil
    ).order(:created_at).last

    if @published_story
      respond_to do |format|
        format.html { render :show }
        format.json { render json: @published_story }
      end
    else
      tmp_render_404
    end
  end

  private

  # TODO replace this with the real solution
  def tmp_render_404
    render status: 404
  end
end
