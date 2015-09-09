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

  def initialize(user, params, core_request_headers)
    @user = user
    @core_request_headers = core_request_headers
    @story_uid = params[:uid]

    creating_user_id = (user || {})['id']

    raise ArgumentError.new('User is not valid') unless creating_user_id.present?
    raise ArgumentError.new('Missing core request headers') unless core_request_headers.present?

    @draft_story = DraftStory.find_by_uid_and_digest(@story_uid, params[:digest])

    if @draft_story.nil?
      raise 'Could not find a draft story with matching uid and digest.'
    end

    @story = PublishedStory.from_draft_story(@draft_story)
    @story.created_by = creating_user_id
  end

  # @return [Boolean] success
  def publish
    saved = story.save

    if saved
      permissions_updater = PermissionsUpdater.new(user, story_uid, core_request_headers)
      permissions_response = nil

      begin
        permissions_response = permissions_updater.update_permissions(is_public: true)
      rescue => exception
        AirbrakeNotifier.report_error(
          exception,
          "PermissionsUpdater service object did not update successfully (story_uid: #{story_uid}"
        )
      end

      # roll back
      if permissions_response.nil?
        story.destroy
        saved = false
      end
    end

    saved
  end

  private

  attr_reader :user, :core_request_headers, :story_uid

end
