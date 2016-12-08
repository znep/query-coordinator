class BackfillImagesError < StandardError; end

# Controller for use in differentiating permissions on goals.
# Can handle special cases of redirection as well.
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

      dashboards_data = OpenPerformance::Odysseus.list_dashboards
      raise 'Unable to fetch dashboards; is Odysseus healthy?' unless dashboards_data.ok?
      @dashboard_list = dashboards_data.json

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

  def copy
    uid = params[:uid]
    dashboard_uid = params[:dashboard_uid]
    title = params[:title]

    story = DraftStory.find_by_uid(uid)

    return redirect_to '/', :flash => {
      :error => I18n.t('goals_controller.not_found_error_flash')
    } unless @goal.accessible? && story.present?

    # NOTE: Our JS and Ruby I18n helpers have different ways of interpolating
    # variables into localized strings. This was a bad choice.
    #
    # Because we don't do much server-side interpolation, I'm prefering to keep
    # the JS-style localized strings and work around them here.
    copy_title = title || I18n.t('editor.make_a_copy.copy_placeholder').sub('{0}', @story_metadata.title)
    copy_title = sanitize_story_title(copy_title)

    odysseus_response = OpenPerformance::Odysseus.copy_goal(
      uid,
      dashboard_uid,
      copy_title
    )

    return redirect_to '/', :flash => {
      :error => I18n.t('goals_controller.failed_to_publish')
    } unless odysseus_response.ok?

    copy_uid = odysseus_response.json['new_goal_id']

    blocks = copy_attachments(story)
    blocks = blocks.map do |block|
      block.as_json.symbolize_keys
    end

    story_draft_creator = StoryDraftCreator.new(
      user: current_user,
      uid: copy_uid,
      digest: FAKE_DIGEST,
      blocks: blocks,
      theme: story.theme
    )

    @story = story_draft_creator.create

    redirect_to "/stat/goals/#{dashboard_uid}/uncategorized/#{copy_uid}/edit-story"
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
