module DataLensMetadataHelper

  include CardTypeMapping

  COLUMN_ID_REGEX = /(:@)?([a-z][a-z_0-9\-]*)/i
  SYSTEM_COLUMN_ID_REGEX = /:([a-z][a-z_0-9\-]*)/i
  UID_REGEXP = /\w{4}-\w{4}/
  ADDRESS_REGEXP = /^[a-z0-9\-\.]*$/i  # Not technically correct since addresses cannot end in '-' or '.'

  # Given a dataset ID and metadata, this decorates the metadata based on whether
  # there is a migrated old backend dataset available, otherwise it will use a
  # new backend dataset
  def augment_dataset_metadata!(dataset_id, dataset_metadata)
    return unless dataset_id
    backend_view = dataset_view(dataset_id)
    return unless backend_view

    begin
      migrations = backend_view.migrations
      backend_view = dataset_view(migrations[:obeId])

    rescue CoreServer::ResourceNotFound
      # NOOP
    end

    if backend_view
      mirror_nbe_column_metadata!(backend_view, dataset_metadata)
    end
  end

  # Given a backend_view and a new backend dataset, this will attempt to
  # decorate the metadata with properties for position, visibility in table, and
  # various kinds of format options
  def mirror_nbe_column_metadata!(backend_view, nbe_dataset)

    # Add row label
    unless backend_view.metadata.nil? || backend_view.metadata.rowLabel.nil?
      nbe_dataset[:rowDisplayUnit] = backend_view.metadata.rowLabel
    end

    backend_view.columns.each do |column|
      nbe_column = nbe_dataset[:columns][column.fieldName.to_sym]

      unless nbe_column.nil?
        nbe_column[:position] = column.position
        nbe_column[:format] = column.format.data.reduce({}) do |acc, (key, val)|
          case key
            when 'noCommas', 'humane'
              # these property values should be coerced to the proper type;
              # we'll pass through any non-boolean-string values because that
              # will help diagnose an improperly stored value
              acc[key.to_sym] = case val
                when 'true' then true
                when 'false' then false
                else val
              end
            when 'precision'
              acc[key.to_sym] = val.to_i
            when 'currency', 'currencyStyle'
              acc[:currency] = case val
                when 'AFN' then '؋'
                when 'ALL' then 'Lek'
                when 'ANG' then 'ƒ'
                when 'ARS' then '$'
                when 'AUD' then '$'
                when 'AWG' then 'ƒ'
                when 'AZN' then 'ман'
                when 'BAM' then 'KM'
                when 'BBD' then '$'
                when 'BGN' then 'лв'
                when 'BMD' then '$'
                when 'BND' then '$'
                when 'BOB' then '$b'
                when 'BRL' then 'R$'
                when 'BSD' then '$'
                when 'BWP' then 'P'
                when 'BYR' then 'p.'
                when 'BZD' then 'BZ$'
                when 'CAD' then '$'
                when 'CHF' then 'CHF'
                when 'CLP' then '$'
                when 'CNY' then '¥'
                when 'COP' then '$'
                when 'CRC' then '₡'
                when 'CUP' then '₱'
                when 'CZK' then 'Kč'
                when 'DKK' then 'kr'
                when 'DOP' then 'RD$'
                when 'EEK' then 'kr'
                when 'EGP' then '£'
                when 'EUR' then '€'
                when 'FJD' then '$'
                when 'FKP' then '£'
                when 'GBP' then '£'
                when 'GGP' then '£'
                when 'GHC' then '¢'
                when 'GIP' then '£'
                when 'GTQ' then 'Q'
                when 'GYD' then '$'
                when 'HKD' then '$'
                when 'HNL' then 'L'
                when 'HRK' then 'kn'
                when 'HUF' then 'Ft'
                when 'INR' then 'Rp'
                when 'ILS' then '₪'
                when 'IMP' then '£'
                when 'IRR' then '﷼'
                when 'ISK' then 'kr'
                when 'JEP' then '£'
                when 'JMD' then 'J$'
                when 'JPY' then '¥'
                when 'KES' then 'KSh'
                when 'KGS' then 'лв'
                when 'KHR' then '៛'
                when 'KPW' then '₩'
                when 'KRW' then '₩'
                when 'KYD' then '$'
                when 'KZT' then 'лв'
                when 'LAK' then '₭'
                when 'LBP' then '£'
                when 'LKR' then '₨'
                when 'LRD' then '$'
                when 'LTL' then 'Lt'
                when 'LVL' then 'Ls'
                when 'MKD' then 'ден'
                when 'MNT' then '₮'
                when 'MUR' then '₨'
                when 'MXN' then '$'
                when 'MYR' then 'RM'
                when 'MZN' then 'MT'
                when 'NAD' then '$'
                when 'NGN' then '₦'
                when 'NIO' then 'C$'
                when 'NOK' then 'kr'
                when 'NPR' then '₨'
                when 'NZD' then '$'
                when 'OMR' then '﷼'
                when 'PAB' then 'B/.'
                when 'PEN' then 'S/.'
                when 'PHP' then 'Php'
                when 'PKR' then '₨'
                when 'PLN' then 'zł'
                when 'PYG' then 'Gs'
                when 'QAR' then '﷼'
                when 'RON' then 'lei'
                when 'RSD' then 'Дин.'
                when 'RUB' then 'руб'
                when 'SAR' then '﷼'
                when 'SBD' then '$'
                when 'SCR' then '₨'
                when 'SEK' then 'kr'
                when 'SGD' then '$'
                when 'SHP' then '£'
                when 'SOS' then 'S'
                when 'SRD' then '$'
                when 'SVC' then '$'
                when 'SYP' then '£'
                when 'THB' then '฿'
                when 'TRL' then '₤'
                when 'TRY' then 'TL'
                when 'TTD' then 'TT$'
                when 'TVD' then '$'
                when 'TWD' then 'NT$'
                when 'UAH' then '₴'
                when 'USD' then '$'
                when 'UYU' then '$U'
                when 'UZS' then 'лв'
                when 'VEF' then 'Bs'
                when 'VND' then '₫'
                when 'XCD' then '$'
                when 'YER' then '﷼'
                when 'ZAR' then 'R'
                when 'ZWD' then 'Z$'
              end
            when 'view'
              # based on conversion from `baseDTFormats` in datatypes.js
              # but using moment-specific format strings
              acc[:formatString] = case val
                when 'date'                         then 'MM/DD/YYYY'
                when 'date_dmonthy'                 then 'DD MMMM YYYY'
                when 'date_dmy'                     then 'DD/MM/YYYY'
                when 'date_dmy_time'                then 'DD/MM/YYYY hh:mm:ss A'
                when 'date_monthdy'                 then 'MMMM DD, YYYY'
                when 'date_monthdy_shorttime'       then 'MMMM DD, YYYY hh:mm A'
                when 'date_monthdy_time'            then 'MMMM DD, YYYY hh:mm:ss A'
                when 'date_monthy'                  then 'MMMM YYYY'
                when 'date_my'                      then 'MM/YYYY'
                when 'date_shortmonthdy'            then 'MMM DD, YYYY'
                when 'date_shortmonthdy_shorttime'  then 'MMM DD, YYYY hh:mm A'
                when 'date_shortmonthy'             then 'MMM YYYY'
                when 'date_time'                    then 'MM/DD/YYYY hh:mm:ss A'
                when 'date_y'                       then 'YYYY'
                when 'date_ym'                      then 'YYYY/MM'
                when 'date_ymd'                     then 'YYYY/MM/DD'
                when 'date_ymd_time'                then 'YYYY/MM/DD hh:mm:ss A'
                when 'date_ymonth'                  then 'YYYY MMMM'
                when 'date_ymonthd'                 then 'YYYY MMMM DD'
                when 'date_ymonthd_time'            then 'YYYY MMMM DD hh:mm:ss A'
                when 'date_yshortmonth'             then 'YYYY MMM'
              end
            else
              acc[key.to_sym] = val
          end
          acc
        end
        nbe_column[:dataTypeName] = column.dataTypeName
        nbe_column[:renderTypeName] = column.renderTypeName
        nbe_column[:hideInTable] = column.flag?('hidden')

        # EN-15164: Derived views have calendar_date columns that don't inherit physicalDatatype 'floating_timestamp'
        # we are assigning 'floating_timestamp' when 'renderTypeName' is 'calendar_date'
        if nbe_column[:renderTypeName] == 'calendar_date'
          nbe_column[:physicalDatatype] = 'floating_timestamp'
        end
      end
    end
    nbe_dataset
  end

  def dataset_view(id)
    begin
      View.find(id)
    rescue => error
      error_message = %Q(Error while retrieving old backend view of "(#{id.inspect}): #{error}")
      Airbrake.notify(
        :error_class => 'DatasetViewError',
        :error_message => error_message
      )
      Rails.logger.warn(error_message)
      nil
    end
  end

  def set_default_and_available_card_types_to_columns!(dataset_metadata, is_derived_view=false)
    dataset_id = dataset_metadata.try(:[], :body).try(:[], :id)
    unless dataset_id.present?
      error_message = 'Could not compute default and available card types ' \
        'for dataset: unable to determine dataset id.'
      Airbrake.notify(
        :error_class => 'DatasetMetadataCardTypeComputationError',
        :error_message => error_message
      )
      Rails.logger.error(error_message)
      return
    end

    columns = dataset_metadata.try(:[], :body).try(:[], :columns)

    unless columns.present?
      error_message = "Could not compute default and available card types " \
        "for dataset: no columns found (dataset_metadata: " \
        "#{dataset_metadata.inspect})."
      Airbrake.notify(
        :error_class => 'DatasetMetadataCardTypeComputationError',
        :error_message => error_message,
      )
      Rails.logger.error(error_message)
      return
    end

    this_dataset_size = get_dataset_size(dataset_id)

    # Note that this mutates the columns in-place.
    columns.each do |field_name, column|
      # Only compute card types for non-system columns
      unless SYSTEM_COLUMN_ID_REGEX.match(field_name)
        column['defaultCardType'] = default_card_type_for(column, this_dataset_size, is_derived_view)
        column['availableCardTypes'] = available_card_types_for(column, this_dataset_size, is_derived_view)
      end
    end
  end

  def normalize_pages_for_dataset_response!(pages_for_dataset_response)

    if pages_for_dataset_response[:status] == '200' &&
      pages_for_dataset_response[:body].present?

      response_body = pages_for_dataset_response[:body]
      if response_body.respond_to?('values')
        pages_for_dataset_response[:body] = { :publisher => response_body.values, :user => [] }
      end
    end
    pages_for_dataset_response
  end

  def exclude_non_v1_or_above_pages!(pages_for_dataset_response)

    if pages_for_dataset_response[:status] == '200' &&
      pages_for_dataset_response[:body].present?

      pages_for_dataset_response[:body].select! do |page_id, page_data|
        page_data[:version].to_i > 0
      end
    end
    pages_for_dataset_response
  end

  def get_dataset_size(dataset_id)
    # Get the size of the dataset so we can compare it against the cardinality
    # when creating cards.

    begin
      core_server_response = CoreServer::Base.connection.get_request(
        "/id/#{dataset_id}?%24query=select+count(0)&%24%24read_from_nbe=true&%24%24version=2.1",
        View.federation_headers
      )
      dataset_size = JSON.parse(core_server_response)[0]['count_0'].to_i
    rescue CoreServer::Error => error
      error_message = "Could not determine dataset size: server error " \
          "(#{error})) (core_server_response: #{core_server_response.inspect})."
      Airbrake.notify(
        :error_class => "DatasetSizeError",
        :error_message => error_message
      )
      Rails.logger.error(error_message)
      # Default to some sufficiently-high dataset size in order to not affect
      # cardinality decisions.
      dataset_size = 5_000_000
    end

    dataset_size
  end
end
