class StoryCreator

  attr_reader :four_by_four, :user, :blocks, :invalid_blocks, :story

  def initialize(user, attributes)
    @four_by_four = attributes.fetch(:four_by_four, nil)
    @blocks = retrieve_or_build_blocks_from_json(attributes[:blocks])
    @user = user
  end

  def create(story_type)
    @story = nil

    unless four_by_four.present?
      @four_by_four = provision_new_four_by_four
    end

    begin
      ActiveRecord::Base.transaction do
        block_ids = []

        blocks.each do |block|
          unless block.persisted?
            block.save!
          end

          block_ids << block.id
        end

        @story = story_type.new(
          four_by_four: four_by_four,
          blocks: block_ids,
          created_by: user
        )
        @story.save!
      end
    rescue
      raise Error.new('transaction failed')
    end

    @story
  end

  private

  def block_ids_or_nils
    @block_ids_or_nils ||= begin
      json_blocks.map do |block|
        block.fetch(:id, nil)
      end
    end
  end

  # Permissions

  def all_blocks_belong_to_current_user?(blocks)
    true
  end

  # Interactions with Core Server

  def provision_new_four_by_four
    begin
      'abcd-efgh'
    rescue
      raise Error.new('could not provision four_by_four')
    end
  end

  # Interactions with the Data Model

  def retrieve_or_build_blocks_from_json

    # First verify that all of the existing blocks are valid and that they
    # belong to the current user.
    existing_blocks = retrieve_existing_blocks(json_blocks)
    unless all_blocks_are_valid?(existing_blocks)
      raise Error.new('invalid blocks')
    end
    unless all_blocks_belong_to_current_user?(existing_blocks)
      raise Error.new('permissions invalid')
    end

    # Then verify that all of the new blocks are valid.
    new_blocks = build_nonexisting_blocks(json_blocks)
    unless all_blocks_are_valid?(new_blocks)
      raise Error.new('invalid blocks')
    end

    # Finally, fold the existing and new block collections back together.
    block_objects = []
    existing_block_index = 0
    new_block_index = 0

    json_blocks.each do |json_block|
      block_id = json_block.fetch(:id, nil)

      if block_id.present?
        block_objects << existing_blocks[existing_block_index]
        existing_block_index += 1
      else
        block_objects << new_blocks[new_block_index]
        new_block_index += 1
      end
    end

    block_objects
  end

  def retrieve_existing_blocks
    # Block.where will ignore nil in the array of ids when retrieving rows
    # from the database.
    enforce_original_block_order(Block.where(id: block_ids_or_nils))
  end

  def enforce_original_block_order(blocks)
    # Pretend this works!
    blocks
  end

  def build_nonexisting_blocks
    # .compact removes nils from a collection.
    block_ids_or_nils.compact.map do |json_block|
      Block.from_json(json_block)
    end
  end

  def all_blocks_are_valid?(blocks)
    all_blocks_are_valid = true

    blocks.each do |block|
      unless block.valid?
        all_blocks_are_valid = false
      end
    end

    all_blocks_are_valid
  end
end
