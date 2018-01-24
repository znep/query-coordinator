# This object takes parameters that identify a draft story and attempt to publish the story.
# Publishing the story creates a PublishedStory record in the database and calls the core
# service to update the story permissions and set them to public.
#
# After calling `publish`, the story attribute will contain the PublishedStory object
# that was created. It will have validation errors if the story could not be saved.
#
# If the permissions update fails, the story will be null, and an airbrake exception will be raised.
class StoryPublisher

  attr_reader :story

  def initialize(user, permissions_updater, params)
    @user = user
    @permissions_updater = permissions_updater
    @story_uid = params[:uid]

    creating_user_id = (user || {})['id']

    raise ArgumentError.new('User is not valid') unless creating_user_id.present?

    @draft_story = DraftStory.find_by_uid(@story_uid)

    # Publishing a non-existent draft should fail.
    if @draft_story.nil?
      raise 'Could not find a draft story with matching uid and digest.'
    end

    # Linear history enforcement: only the latest draft should be publishable.
    if @draft_story.digest != params[:digest]
      raise 'Rejected specified draft story for publication due to staleness.'
    end

    # Linear history enforcement: a draft should only be publishable once.
    # This can additionally be confirmed by comparing the digests of the draft
    # and the next published version, since this draft is the latest one (per
    # previous check) and therefore the only publishable one.
    @next_published_story = PublishedStory.find_next(@draft_story.uid, @draft_story.created_at)
    if @next_published_story.present?
      # at this point, @next_published_story.digest == @draft_story.digest
      raise 'Rejected specified draft story for publication because it has already been published.'
    end

    @story = PublishedStory.from_draft_story(@draft_story)
    @story.created_by = creating_user_id

    @json_blocks = StoryJsonBlocks.from_story(@draft_story, user, copy: true)
  end

  # @return [Boolean] success
  def publish
    return false unless json_blocks.save

    story.block_ids = json_blocks.blocks.map(&:id)
    saved = story.save

    unless saved
      story.blocks.each(&:delete)
    end

    if saved
      permissions_response = nil

      begin
        permissions_response = permissions_updater.update_permissions(is_public: true)
      rescue => exception
        AirbrakeNotifier.report_error(
          exception,
          on_method: "#{permissions_updater.class}#update_permissions(story_uid: '#{story_uid}')"
        )
      end

      # roll back
      unless permissions_response.present?
        story.blocks.each(&:delete)
        story.delete
        saved = false
      end

      begin
        GettyImagesDownloader.new(story, user).download if saved
      rescue => exception
        AirbrakeNotifier.report_error(
          exception,
          on_method: "GettyImagesDownloader#new(story_uid: '#{story_uid}', user_id: '#{user['id']}')"
        )
      end
    end

    saved
  end

  private

  attr_reader :user, :permissions_updater, :story_uid, :json_blocks

end
