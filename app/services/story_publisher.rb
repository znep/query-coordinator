class StoryPublisher

  attr_reader :story

  def initialize(user, params)
    creating_user_id = (user || {})['id']
    if creating_user_id.blank?
      raise ArgumentError.new('User is not valid')
    end

    @draft_story = DraftStory.find_by_uid_and_digest(params[:uid], params[:digest])

    if @draft_story.nil?
      raise 'Could not find a draft story with matching uid and digest.'
    end

    @story = PublishedStory.from_draft_story(@draft_story)
    @story.created_by = creating_user_id
  end

  # @return [Boolean] success
  def publish
    saved = @story.save

    if saved
      query_params = {
        accessType: 'WEBSITE',
        method: 'setPermission',
        value: 'public.read'
      }

      CoreServer::update_view(clean_uid, core_request_headers, view, query_params)
    end

    saved
  end

  def errors
    if @story.invalid?
      @story.errors.messages
    else
      # Core Error Stuffs
    end
  end
end
