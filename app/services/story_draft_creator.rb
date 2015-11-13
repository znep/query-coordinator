class StoryDraftCreator
  attr_reader :new_blocks, :story

  class InvalidBlockIdsError < StandardError ; end
  class InvalidNewBlocksError < StandardError ; end
  class CreateTransactionError < StandardError ; end
  class DigestMismatchError < StandardError ; end

  #TODO: Make user another attribute rather than its own thing.

  # Initialized with attributes hash
  #
  # attributes[:user] - user creating this draft
  # attributes[:uid] - UID of existing story draft
  # attributes[:digest] - previous draft digest to ensure safe saving
  # attributes[:blocks] - array of json blocks for new draft
  # attributes[:theme] - display theme for this story draft
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
    if @digest.blank?
      raise ArgumentError.new('Digest attribute is empty')
    end

    # This will raise an exception if :blocks is not present.
    @json_blocks = attributes.fetch(:blocks) || []
    unless @json_blocks.is_a?(Array)
      raise ArgumentError.new('Blocks attribute is not an array')
    end
    unless all_json_blocks_are_hashes?
      raise ArgumentError.new("Blocks contains non-hashes: '#{@json_blocks}'")
    end

    @theme = attributes[:theme]
    if @theme.blank?
      raise ArgumentError.new('Theme attribute is empty')
    end

    @story = nil

    @new_blocks = deserialize_json_blocks
  end

  def create
    validate_digest_matches_against_last_draft

    unless all_new_blocks_valid?
      raise InvalidNewBlocksError.new('invalid new blocks')
    end

    ActiveRecord::Base.transaction do

      new_blocks.each(&:save!)

      @story = DraftStory.new(
        uid: uid,
        block_ids: new_blocks.map(&:id),
        created_by: user['id'],
        theme: theme
      )
      @story.save!
    end

    @story
  end

  private
  attr_reader :user, :uid, :json_blocks, :digest, :theme

  # Interactions with the Data Model

  def all_json_blocks_are_hashes?
    @json_blocks.all? do |json_block|
      json_block.is_a?(Hash)
    end
  end

  def deserialize_json_blocks
    json_blocks.map do |json_block|
      Block.from_json(
        json_block.
          merge(created_by: user['id']).
          except(:id)
      )
    end
  end

  def all_new_blocks_valid?
    new_blocks.all?(&:valid?)
  end

  def existing_story
    unless uid.blank?
      @existing_story ||= DraftStory.find_by_uid(uid)
    end
  end

  def validate_digest_matches_against_last_draft
    if existing_story.present? && digest != existing_story.digest
      raise DigestMismatchError.new('Provided digest does not match last known draft story digest.')
    end
  end
end
