# Handles async Document create and processing workflow
class CreateDocument

  attr_reader :document

  # @example
  #   create_document_service = CreateDocument.new(create_params)
  #   create_document_service.create
  #
  # @param params [Hash]
  def initialize(user, params)
    creating_user_id = (user || {})['id']
    if creating_user_id.blank?
      raise ArgumentError.new('User is not valid')
    end

    @document = Document.new(params)
    @document.created_by = creating_user_id
  end

  # @return [Boolean] Document saved
  def create
    saved = @document.save
    if saved
      queue_process
    end
    saved
  end

  private

  def queue_process
    ProcessDocumentJob.perform_later(@document.id)
  end

end
