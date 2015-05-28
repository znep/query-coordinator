class StoryDraftCreator

  attr_reader :user, :four_by_four, :json_blocks, :new_blocks, :story

  def initialize(user, attributes)
    unless attributes[:blocks].is_a?(Array)
      raise ArgumentError.new('attributes[:blocks] is not array')
    end

    @user = user
    @four_by_four = attributes.fetch(:four_by_four, nil)
    @json_blocks = attributes[:blocks]
    @new_blocks = build_nonexisting_blocks
  end

  def create
    @story = nil

    unless four_by_four.present?
      @four_by_four = provision_new_four_by_four
    end

    unless existing_block_ids_in_previous_story_version?
      raise RuntimeError.new('invalid block ids')
    end

    begin
      ActiveRecord::Base.transaction do

        new_blocks.each do |block|
          block.save!
        end

        @story = DraftStory.new(
          four_by_four: four_by_four,
          blocks: merge_existing_and_new_block_ids,
          created_by: user
        )
        @story.save!
      end
    rescue => error
      raise RuntimeError.new('transaction failed')
    end

    @story
  end

  private

  # Instance variable memoization

  def block_ids_or_nils
    @block_ids_or_nils ||= begin
      json_blocks.map do |block|
        block.fetch(:id, nil)
      end
    end
  end

  def block_ids_from_previous_story_version
    @block_ids_from_previous_story_version ||= begin
      story = DraftStory.from_four_by_four(four_by_four)

      if story.present?
        story.blocks
      else
        []
      end
    end
  end

  # Interactions with Core Server

  def provision_new_four_by_four
    begin
      # TODO: Risky business
      'abcd-efgh'
    rescue
      raise RuntimeError.new('could not provision four_by_four')
    end
  end

  # Interactions with the Data Model

  def build_nonexisting_blocks
    json_blocks.map do |json_block|
      if json_block.fetch(:id, nil).nil?
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
end
