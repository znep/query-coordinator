class BackfillImagesError < StandardError; end
class Stat::GoalsController < StoriesController
  before_action :load_goal
  before_action :load_story_metadata # enforce order - this depends on load_goal

  def show
    redirect_to "#{request.path.sub('/stories', '')}/view"
    # TODO: call super instead of redirecting if we have a storyteller-backed goal
  end

  def edit
    @goal_document_ids = {}
    @dashboard_uid = params[:dashboard]
    @category_uid = params[:category]
    @goal_uid = params[:uid]

    if using_storyteller_editor?
      # This will create an in-memory draft if there is no draft story
      # in the DB (for normal stories, this would be a 404 condition.)
      @story = DraftStory.find_by_uid(@goal_uid) || DraftStory.new
      @story.uid = @goal_uid

      begin
        # Only backfill the images if we are dealing with a draft story
        # that hasn't been saved.
        @goal_document_ids = backfill_images unless @story.persisted?
        super
      rescue BackfillImagesError
        render_migration_500
      end
    else
      if @dashboard_uid && @category_uid
        redirect_to "/stat/goals/#{@dashboard_uid}/#{@category_uid}/#{@goal_uid}/edit-classic"
      else
        redirect_to "/stat/goals/single/#{@goal_uid}/edit-classic"
      end
    end
  end

  private

  def render_migration_500
    @status = 500
    @title = I18n.t('error_pages.migration_500.title')
    @description = I18n.t('error_pages.migration_500.description')

    render 'errors/show', status: @status, layout: 'error'
  end

  def using_storyteller_editor?
    signaller_value = Signaller.for(flag: 'open_performance_narrative_editor').
      value(on_domain: request.host)
    url_param_value = request.params['open_performance_narrative_editor']

    (url_param_value || signaller_value) == 'storyteller'
  end

  def story_metadata
    ProcrustesStoryMetadata.new(@goal)
  end

  def load_goal
    @goal = OpenPerformance::Goal.new(params[:uid])
  end

  ##
  # - Creates Storyteller documents from Core assets.
  # - Generates a mapping from Core asset ID to Storyteller
  #   document ID.
  # - Returns true if all documents were created successfully.
  def backfill_images
    goal_document_ids = {}

    @goal.narrative_migration_metadata['narrative'].
      # Pull out two-column layout "columns" key, otherwise noop.
      map { |block| block['columns'] || block }.
      # Flatten any "columns" found with the rest of the blocks.
      flatten.
      # Only take images.
      select { |block| block['type'] == 'image' }.
      each do |block|
        # Reduce those to their Core asset ID.
        asset_id = block['src'].gsub('/api/assets/', '')
        core_asset = CreateDocumentFromCoreAsset.new(asset_id, params[:uid], current_user['id'])
        # Save the document and fail if it doesn't work.
        raise BackfillImagesError.new unless core_asset.create
        # Add it to the asset => document map.
        goal_document_ids[asset_id] = core_asset.document.id
      end

    goal_document_ids
  end

  def story_url_for_view
    if @dashboard_uid && @category_uid
      stat_goal_url(uid: params[:uid], dashboard: @dashboard_uid, category: @category_uid)
    else
      stat_single_goal_url(uid: params[:uid])
    end
  end

  def story_url_for_preview
    if @dashboard_uid && @category_uid
      stat_preview_goal_url(uid: params[:uid], dashboard: @dashboard_uid, category: @category_uid)
    else
      stat_preview_single_goal_url(uid: params[:uid])
    end
  end
end
