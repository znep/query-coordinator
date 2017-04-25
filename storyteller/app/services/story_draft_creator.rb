class StoryDraftCreator
  attr_reader :story

  class CreateTransactionError < StandardError ; end
  class DigestMismatchError < StandardError ; end
  class DigestMissingError < StandardError ; end

  # Initialized with attributes hash
  #
  # attributes[:user] - user creating this draft
  # attributes[:uid] - UID of existing story draft
  # attributes[:digest] - previous draft digest to ensure safe saving
  # attributes[:blocks] - array of json blocks for new draft
  # attributes[:theme] - display theme for this story draft
  # attributes[:copy_blocks] - copies blocks and attachments
  def initialize(attributes)
    @user = attributes[:user] || {}
    unless @user['id'] =~ FOUR_BY_FOUR_PATTERN
      raise ArgumentError.new('User attribute is not valid')
    end

    @uid = attributes[:uid]
    unless @uid.present? && @uid =~ FOUR_BY_FOUR_PATTERN
      raise ArgumentError.new("Uid attribute is not valid: '#{@uid}'")
    end

    @digest = attributes[:digest]

    # This will raise an exception if :blocks is not present.
    @blocks = attributes.fetch(:blocks) || []
    unless @blocks.is_a?(Array)
      raise ArgumentError.new('Blocks attribute is not an array')
    end

    @theme = attributes[:theme]
    if @theme.blank?
      raise ArgumentError.new('Theme attribute is empty')
    end

    @json_blocks = StoryJsonBlocks.new(
      @blocks,
      user,
      copy: attributes[:copy_blocks]
    )
    @story = nil
  end

  def create
    validate_digest_matches_against_last_draft

    ActiveRecord::Base.transaction do

      json_blocks.save!

      @story = DraftStory.new(
        uid: uid,
        block_ids: json_blocks.blocks.map(&:id),
        created_by: user['id'],
        theme: theme
      )
      @story.save!
    end

    @story
  end

  private
  attr_reader :user, :uid, :json_blocks, :digest, :theme

  def existing_story
    unless uid.blank?
      @existing_story ||= DraftStory.find_by_uid(uid)
    end
  end

  def validate_digest_matches_against_last_draft
    if existing_story.present?
      if digest.blank?
        raise DigestMissingError.new('Digest was not provided, yet older draft exists.')
      elsif digest != existing_story.digest
        raise DigestMismatchError.new('Provided digest does not match last known draft story digest.')
      end
    end
  end
end
