# This class helps with the translation between the JSON representation of
# blocks and the blocks themselves. At the time we wrote this, we considered
# moving these methods into the (Draft|Published)Story models themselves, but
# that refactor was larger than we wanted to take on at the time.
class StoryJsonBlocks

  class InvalidNewBlocksError < StandardError ; end
  class CopyAttachmentsError < StandardError ; end

  attr_reader :json_blocks

  # @param json_blocks [Array] Hash representation of the blocks
  # @param user [Hash] The user that is associated with creating any blocks
  # @param attributes [Boolean] :copy make a copy of attachments?
  # @param attributes [Boolean] :validate_document_copy validate new document?
  def initialize(json_blocks, user, options = {})
    @json_blocks = json_blocks
    @user = user
    @copy = options[:copy]
    @validate_document_copy = options.fetch(:validate_document_copy, true)

    unless json_blocks.is_a?(Array)
      raise ArgumentError.new("json_blocks attribute is not an array: '#{json_blocks}'")
    end

    unless all_json_blocks_are_hashes?
      raise ArgumentError.new("json_blocks contains non-hashes: '#{json_blocks}'")
    end

    raise ArgumentError.new('user must be present') if user.nil?

    if copy
      new_blocks = copy_attachments
      @json_blocks = StoryJsonBlocks.blocks_to_json(new_blocks)
    end
  end

  def save
    blocks.map(&:save).all?
  end

  def save!
    raise InvalidNewBlocksError.new('invalid new blocks') unless valid?
    blocks.each(&:save!)
  end

  # Converts hash representation of blocks to new, unsaved blocks
  def blocks
    @blocks ||= json_blocks.map do |json_block|
      Block.from_json(
        json_block.
          merge(created_by: user['id']).
          except(:id)
      )
    end
  end

  def valid?
    blocks.all?(&:valid?)
  end

  def self.from_story(story, user, options = {})
    json_blocks = blocks_to_json(story.blocks)
    new(json_blocks, user, options)
  end

  def self.blocks_to_json(blocks)
    blocks.map { |block| block.as_json.symbolize_keys }
  end

  private
  attr_reader :copy, :user, :validate_document_copy

  def all_json_blocks_are_hashes?
    json_blocks.all? do |json_block|
      json_block.is_a?(Hash)
    end
  end

  # Looks for references to images in the components attribute of the blocks,
  # copies them to new Document objects, and updates the reference in the block
  def copy_attachments
    blocks.map do |block|
      components = block.components.clone.select do |component|
        Block::IMAGE_COMPONENT_TYPES.include?(component['type'])
      end

      components.each do |component|
        value = component['type'] == 'author' ?
          component['value']['image'] :
          component['value']

        document_id = value['documentId']
        document = Document.find_by_id(document_id)

        # old getty image blocks didn't have a documentId configured because they didn't have a document.
        next if document.nil?

        document_copy = document.dup
        document_copy.status = 'unprocessed'

        # We don't validate the Document model when we're running this from a migration
        # because we might have older Documents in the database that would no longer
        # pass validation today, i.e. because we have an older format of direct_upload_url.
        # We're assuming that if it is in the database, it validated at the time of creation.
        unless document_copy.save(validate: validate_document_copy)
          raise CopyAttachmentsError.new(
            "Error copying Document(#{document.id}) attachments: #{document_copy.errors.full_messages.to_sentence}"
          )
        end

        document_copy.copy_attachments_from(document)
        document_copy.update_attribute(:status, 'processed')

        value['documentId'] = document_copy.id
        value['url'] = document_copy.canonical_url
      end

      block
    end
  end

end
