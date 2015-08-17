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
  # attributes[:four_by_four] - UID of existing story draft
  # attributes[:digest] - previous draft digest to ensure safe saving
  # attributes[:blocks] - array of json blocks for new draft
  def initialize(attributes)
    @user = attributes[:user]
    if @user.blank?
      raise ArgumentError.new('attributes[:user] is empty')
    end

    @four_by_four = attributes[:four_by_four]
    unless @four_by_four.present? && @four_by_four =~ FOUR_BY_FOUR_PATTERN
      raise ArgumentError.new("attributes[:four_by_four] is not valid: '#{@four_by_four}'")
    end

    @digest = attributes[:digest]
    if @digest.blank?
      raise ArgumentError.new('attributes[:digest] is empty')
    end

    # This will raise an exception if :blocks is not present.
    @json_blocks = attributes.fetch(:blocks)
    unless @json_blocks.is_a?(Array)
      raise ArgumentError.new('attributes[:blocks] is not array')
    end
    unless all_json_blocks_are_hashes?
      raise ArgumentError.new("attributes[:blocks] contains non-hashes: '#{@json_blocks}'")
    end

    @story = nil

    # We want to maintain a mapping of old block id to new block id
    # We send this information back to the caller of the save endpoint.
    @block_id_mapping = @json_blocks.map do |block|
      { old_id: block[:id] }
    end

    @new_blocks = build_nonexisting_blocks
  end

  def create
    validate_digest_matches_against_last_draft

    unless existing_block_ids_in_previous_story_version?
      raise InvalidBlockIdsError.new('invalid block ids')
    end

    unless all_new_blocks_valid?
      raise InvalidNewBlocksError.new('invalid new blocks')
    end

    ActiveRecord::Base.transaction do

      new_blocks.each do |block|
        block.save!
      end

      @story = DraftStory.new(
        uid: four_by_four,
        block_ids: merge_existing_and_new_block_ids,
        created_by: user
      )
      @story.save!
    end

    @story
  end

  def block_id_mappings
    @block_id_mapping.map do |mapping|
      new_id = mapping[:new_block].try(:id) || mapping[:old_id]

      { oldId: mapping[:old_id], newId: new_id }
    end
  end

  private
  attr_reader :user, :four_by_four, :json_blocks, :digest

  # Instance variable memoization

  def block_ids_or_nils
    @block_ids_or_nils ||= begin
      json_blocks.map do |block|
        temp_block?(block) ? nil : block[:id]
      end
    end
  end

  def temp_block?(block)
    # temp block ids should be non-numeric in nature. We currently use 'sampleBlock...'
    # for new stories. The storyStore uses 'tempNNN...'. If we get a numeric ID, we're
    # going to assume it's a valid persisted block ID.
    block[:id].nil? || block[:id] =~ /[A-Za-z]/
  end

  def block_ids_from_previous_story_version
    @block_ids_from_previous_story_version ||= begin
      story = DraftStory.find_by_four_by_four(four_by_four)

      if story.present?
        story.block_ids
      else
        []
      end
    end
  end

  # Interactions with the Data Model

  def all_json_blocks_are_hashes?
    @json_blocks.all? do |json_block|
      json_block.is_a?(Hash)
    end
  end

  def build_nonexisting_blocks
    json_blocks.map do |json_block|

      new_block = nil

      if temp_block?(json_block)
        new_block = Block.from_json(json_block.merge(created_by: user).except(:id))
      end

      update_block_id_mapping_with_new_block(json_block[:id], new_block)

      new_block
    end.compact
  end

  def update_block_id_mapping_with_new_block(old_block_id, new_block)
    block_mapping = @block_id_mapping.detect {|mapping| mapping[:old_id] == old_block_id }

    unless block_mapping.nil?
      block_mapping[:new_block] = new_block
    end
  end

  def existing_block_ids_in_previous_story_version?
    # This asserts that each block id in block_ids_or_nils also exists in
    # block_ids_from_previous_story_version. Since a block may have been
    # deleted that previously existed, we only care about the existence of
    # current block ids in the previous verison, not the reverse.
    # (This operation is therefore not commutative!)
    (block_ids_or_nils.compact - block_ids_from_previous_story_version).empty?
  end

  def merge_existing_and_new_block_ids
    new_block_index = 0

    block_ids_or_nils.map do |block_id_or_nil|
      if block_id_or_nil.nil?
        new_block_id = new_blocks[new_block_index].id
        new_block_index += 1
        new_block_id
      else
        block_id_or_nil
      end
    end
  end

  def all_new_blocks_valid?
    new_blocks.all?(&:valid?)
  end

  def existing_story
    unless four_by_four.blank?
      @existing_story ||= DraftStory.find_by_four_by_four(four_by_four)
    end
  end

  def validate_digest_matches_against_last_draft
    if existing_story.present? && digest != existing_story.digest
      raise DigestMismatchError.new('Provided digest does not match last known draft story digest.')
    end
  end
end
