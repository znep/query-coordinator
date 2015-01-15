require 'set'
require 'json'


class NewUxBootstrapController < ActionController::Base

  include CommonPhidippidesMethods
  include UserAuthMethods
  include CardTypeMapping

  before_filter :hook_auth_controller

  def bootstrap

    # This method needs to accomplish a few things in order to enable 'new UX' views of
    # existing datasets.
    #
    # 1. Check to make sure that the user is authorized to create a new view.
    #    Crucially, this includes SuperAdmins so that Socrata employees can
    #    test this functionality without having to impersonate customers.
    #
    # 2. Fetch the dataset metadata, which is used downstream to create cards.
    #    If we cannot fetch the dataset data then we fail early. We will let
    #    Airbrake know aout this, but not the user.
    #
    # 3. Check to see if any 'new UX' pages already exist.
    #
    # 4a. If they do, then we send the user to the default or the last page in
    #     the collection.
    #
    # 4b. If no pages already exist, then we need to create one. This is hacky
    #     and non-deterministic.


    # 1. Check to make sure that the user is authorized to create a new view
    unless can_update_metadata?
      return render :json => {
        error: true,
        reason: "User must be one of these roles: #{ROLES_ALLOWED_TO_UPDATE_METADATA.join(', ')}"
      }, :status => :forbidden
    end

    # 2. Fetch the dataset metadata, which is used downstream to create cards.
    dataset_metadata_response = phidippides.fetch_dataset_metadata(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    unless dataset_metadata_response[:status] == '200' && dataset_metadata_response.try(:[], :body).present?
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Could not retrieve dataset metadata.",
        :request => { :params => params },
        :context => { :response => dataset_metadata_response }
      )
      return render :nothing => true, :status => 404
    end

    dataset_metadata_response_body = dataset_metadata_response[:body]

    # 3. Check to see if any 'new UX' pages already exist.
    pages_response = page_metadata_manager.pages_for_dataset(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    # 4a. There is at least one 'New UX' page already, so we can find a default.
    if pages_response[:status] == '200' && pages_response.try(:[], :body).try(:[], :publisher).present?

      pages = pages_response[:body][:publisher]

      default_page = nil

      if dataset_metadata_response_body[:defaultPage]
        default_page = pages.find do |page|
          page[:pageId] == dataset_metadata_response_body[:defaultPage]
        end
      end

      if default_page.present?
        # If we found a default page as specified in the dataset_metadata,
        # redirect to it immediately.
        return redirect_to "/view/#{default_page[:pageId]}"
      else
        # If no pages match the default page listed in the dataset_metadata,
        # choose the last page in the collection and set it as the default page.
        set_default_page(dataset_metadata_response_body, pages.last[:pageId])
        return redirect_to "/view/#{pages.last[:pageId]}"
      end

    # 4b. If there are no pages, we will need to create a default 'New UX' page.
    elsif (pages_response[:status] == '200' && pages.blank?) || pages_response[:status] == '404'

      default_page_id = create_default_page(dataset_metadata_response_body)

      unless default_page_id.present?
        flash[:error] = I18n.t('screens.ds.new_ux_error')
        return redirect_to action: 'show', controller: 'datasets'
      end

      # Set the newly-created page as the default.
      set_default_page(dataset_metadata_response_body, default_page_id)
      return redirect_to "/view/#{default_page_id}"

    else

      # This is a server error so we should notify Airbrake.
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Dataset #{params[:id].inspect} failed to return pages for bootstrapping.",
        :request => { :params => params },
        :context => { :pages_response => pages_response }
      )
      Rails.logger.error("Dataset #{params[:id].inspect} failed to return pages for bootstrapping. " +
                         "Response: #{pages_response.inspect}")
      flash[:error] = I18n.t('screens.ds.new_ux_error')
      return redirect_to action: 'show', controller: 'datasets'

    end

  end


  private


  # An arbitrary number of cards to create, if there are that many columns available
  MAX_NUMBER_OF_CARDS = 10


  def set_default_page(dataset_metadata, page_id)

    # Set the specified page as the default.
    dataset_metadata[:defaultPage] = page_id

    # Send a request to phidippides to set the default page.
    dataset_metadata_response = phidippides.update_dataset_metadata(dataset_metadata)

    unless dataset_metadata_response[:status] == '200'
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Dataset #{params[:id].inspect} failed to return pages for bootstrapping.",
        :request => { :params => params },
        :context => { :pages_response => pages_response }
      )
      Rails.logger.error("Could not save new default page #{page_id.inspect} for " +
                         "Dataset #{params[:id].inspect}. " +
                         "Response: #{dataset_metadata_response.inspect}")
    end

  end


  def create_default_page(dataset_metadata)

    new_ux_page = generate_page_metadata(dataset_metadata)

    page_creation_response = page_metadata_manager.create(
      new_ux_page,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    page_id = page_creation_response.try(:[], :body).try(:[], :pageId)

    unless page_creation_response[:status] == '200' && page_id.present?

      # Somehow the page creation failed so we should notify Airbrake.
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Error creating page for dataset #{params[:id]}",
        :request => { :params => params },
        :context => { :page_creation_result => page_creation_response }
      )
      Rails.logger.error("Error creating page for dataset #{params[:id]}. " +
                         "Response: #{page_creation_response.inspect}")

    end

    page_id

  end


  def generate_page_metadata(new_dataset_metadata)
    # Keep track of the types of cards we added, so we can give a spread
    added_card_types = Set.new
    skipped_cards_by_type = Hash.new { |h, k| h[k] = [] }

    cards = new_dataset_metadata[:columns].map do |column|
      unless Phidippides::SYSTEM_COLUMN_ID_REGEX.match(column[:name])
        card_type = card_type_for(column, dataset_size)
        if card_type
          card = PageMetadataManager::CARD_TEMPLATE.deep_dup
          card.merge!(
            'fieldName' => column[:name],
            'cardinality' => column[:cardinality],
            'cardType' => card_type,
          )

          if added_card_types.add?(card_type)
            card
          else
            skipped_cards_by_type[card_type] << card
            nil
          end
        end
      end
    end.compact

    if cards.length < MAX_NUMBER_OF_CARDS
      # skipped_cards is an array of arrays, grouped by card type
      skipped_cards = skipped_cards_by_type.values
      # Find the card type with the most cards (to facilitate the zip operation)
      most_cards_of_this_type = skipped_cards.max_by(&:length)
      if most_cards_of_this_type.present?
        # Interleave the cards of different types, for the best variety
        interleaved_cards = most_cards_of_this_type.zip(*skipped_cards.select do |cards|
          cards != most_cards_of_this_type
        end).flatten(1).compact
        # Fill out the rest of the cards for the page
        cards = cards.concat(interleaved_cards.first(MAX_NUMBER_OF_CARDS - cards.length))
      else
        cards
      end
    else
      cards = cards.first(MAX_NUMBER_OF_CARDS)
    end

    {
      'datasetId' => new_dataset_metadata[:id],
      'name' => new_dataset_metadata[:name],
      'description' => new_dataset_metadata[:description],
      'cards' => cards
    }
  end


  def dataset_size
    # Get the size of the dataset so we can compare it against the cardinality when creating cards
    @dataset_size ||= begin
      JSON.parse(
        CoreServer::Base.connection.get_request("/id/#{params[:id]}?%24query=select+count(0)")
      )[0]['count_0'].to_i
    rescue CoreServer::Error => e
      Rails.logger.error('Core server error while retrieving dataset size of dataset ' +
                         "(#{params[:id]}): #{e}")
      nil
    end
  end


  def dataset
    View.find(params[:id])
  end

end

