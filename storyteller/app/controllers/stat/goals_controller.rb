class BackfillImagesError < StandardError; end

# Controller for use in differentiating permissions on goals.
# Can handle special cases of redirection as well.
class Stat::GoalsController < StoriesController
  before_action :load_goal
  before_action :load_story_metadata # enforce order - this depends on load_goal

  def show
    published_story = PublishedStory.find_by_uid(params[:uid])

    return redirect_to "#{request.path.sub('/stories', '')}/view" unless published_story.present?

    respond_with_story(published_story)
  end

  def edit
    @goal_document_ids = {}
    @dashboard_uid = params[:dashboard]
    @category_uid = params[:category]
    @goal_uid = params[:uid]
    redo_goal_migration = params['redoGoalMigration'] == 'true'

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
        @goal_document_ids = backfill_images if !@story.persisted? || redo_goal_migration
        super
      rescue BackfillImagesError => e
        Rails.logger.error("Error backfilling images during goal migration: #{e}")
        render_migration_500
      end
    else
      redirect_to goal_path('/edit-classic')
    end
  end

  def copy
    dashboard_uid = params[:dashboard_uid]
    category_uid = 'uncategorized' # Always place copy into uncategorized category.
    uid = params[:uid]
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

    blocks = StoryJsonBlocks.from_story(
      story,
      current_user,
      copy: true
    ).blocks

    update_goal_embed(
      blocks,
      dashboard_uid,
      category_uid,
      copy_uid
    )

    story_draft_creator = StoryDraftCreator.new(
      user: current_user,
      uid: copy_uid,
      digest: FAKE_DIGEST,
      blocks: StoryJsonBlocks.blocks_to_json(blocks),
      theme: story.theme
    )

    @story = story_draft_creator.create

    redirect_to "/stat/goals/#{dashboard_uid}/#{category_uid}/#{copy_uid}/edit-story"
  end

  private

  # Updates any goal.embed components to have the given:
  #   goal UID
  #   category UID
  #   dashboard UID
  #
  # All 3 IDs are set even if the original component does not
  # have all 3 to begin with.
  def update_goal_embed(blocks, dashboard_uid, category_uid, goal_uid)
    blocks.
      map(&:components).
      flatten.
      select { |component| component['type'] == 'goal.embed' }.
      each do |component|
        value = component['value']
        value['uid'] = goal_uid
        value['category'] = category_uid
        value['dashboard'] = dashboard_uid
      end
  end

  def render_migration_500
    @status = 500
    @title = I18n.t('error_pages.migration_500.title')
    @description = I18n.t('error_pages.migration_500.description')

    render 'errors/show', status: @status, layout: 'error'
  end

  def using_storyteller_editor?
    url_param_value = request.params['open_performance_narrative_editor']
    case Rails.application.config.feature_flag_service
    when :signaller
      signaller_value = Signaller.for(flag: 'open_performance_narrative_editor').
        value(on_domain: request.host)

      (url_param_value || signaller_value) == 'storyteller'
    when :monitor
      monitor_value = FeatureFlagMonitor.flag(name: 'open_performance_narrative_editor',
                                               on_domain: request.host)

      (url_param_value || monitor_value) == 'storyteller'
    end
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
      select { |block| block['type'] == 'image' && block['src'].present? }.
      each do |block|
        # Reduce those to their Core asset ID.
        asset_id = block['src'].gsub('/api/assets/', '')
        core_asset = CreateDocumentFromCoreAsset.new(asset_id, params[:uid], current_user['id'])
        # Save the document and fail if it doesn't work.
        raise BackfillImagesError.new(core_asset.error_messages) unless core_asset.create
        # Add it to the asset => document map.
        goal_document_ids[asset_id] = core_asset.document.id
      end

    goal_document_ids
  end

  def story_url_for_view
    goal_path()
  end

  def story_url_for_preview
    goal_path('/preview')
  end

  def goal_path(suffix = nil)
    # We can't use the autogenerated *_path helpers because of how our
    # URL rewriting middleware works.
    locale_prefix = params[:locale] ? "/#{params[:locale]}" : ''

    main_path = if @dashboard_uid && @category_uid
      "/stat/goals/#{@dashboard_uid}/#{@category_uid}/#{@goal_uid}"
    else
      "/stat/goals/single/#{@goal_uid}"
    end

    "#{locale_prefix}#{main_path}#{suffix}"
  end
end
