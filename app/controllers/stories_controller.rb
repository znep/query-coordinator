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

  # TODO replace this with the real solution
  def tmp_render_404
    render text: 'Whoops! 404. Probably an invalid 4x4', status: 404
  end
end
