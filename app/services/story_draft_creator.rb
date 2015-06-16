class StoryDraftCreator
  attr_reader :new_blocks, :story

  class InvalidBlockIdsError < StandardError ; end
  class InvalidNewBlocksError < StandardError ; end
  class CreateTransactionError < StandardError ; end

  #TODO: Make user another attribute rather than its own thing.
  def initialize(user, attributes)
    @user = user

    @four_by_four = attributes[:four_by_four]
    if @four_by_four.present? && @four_by_four !~ FOUR_BY_FOUR_PATTERN
      raise ArgumentError.new("attributes[:four_by_four] is not valid: '#{@four_by_four}'")
    end

    # This will raise an exception if :blocks is not present.
    @json_blocks = attributes.fetch(:blocks)
    unless @json_blocks.is_a?(Array)
      raise ArgumentError.new('attributes[:blocks] is not array')
    end
    unless all_json_blocks_are_hashes?
      raise ArgumentError.new("attributes[:blocks] contains non-hashes: '#{@json_blocks}'")
    end

    @new_blocks = build_nonexisting_blocks
  end

  def create
    @story = nil

    unless four_by_four.present?
      @four_by_four = provision_new_four_by_four
    end

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

  private
  attr_reader :user, :four_by_four, :json_blocks

  # Instance variable memoization

  def block_ids_or_nils
    @block_ids_or_nils ||= begin
      json_blocks.map do |block|
        block[:id]
      end
    end
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

  # Interactions with Core Server

  def provision_new_four_by_four
    # TODO: Risky business
    'abcd-efgh'
  end

  # Interactions with the Data Model

  def all_json_blocks_are_hashes?
    @json_blocks.all? do |json_block|
      json_block.is_a?(Hash)
    end
  end

  def build_nonexisting_blocks
    json_blocks.map do |json_block|
      if json_block[:id].nil?
        Block.from_json(json_block.merge(created_by: user))
      else
        nil
      end
    end.compact
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
end
