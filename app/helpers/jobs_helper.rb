module JobsHelper

  def date_and_relative_day(time)
    "#{time.strftime('%d %b %Y at %H:%M:%S %Z')} (#{HumaneDateHelper.humane_date(time)})"
  end

  def icon_for_status(status)
    case status
      when 'not_started'
       'waiting'
      when 'in_progress'
       'processing'
      when 'success'
       'check'
      when 'failure'
       'failed'
      when 'success_with_data_errors'
        'warning'
    end
  end

  def status_to_snake(status)
    case status
      when 'NotStarted'
        'not_started'
      when 'InProgress'
        'in_progress'
      when 'Success'
        'success'
      when 'SuccessWithDataErrors'
        'success_with_data_errors'
      when 'Failure'
        'failure'
    end
  end

  def jobs_prefix
    'screens.admin.jobs'
  end

  def event_description(event)
    info = Hash[event.info.map do |key, value|
      [key.to_sym, value.is_a?(Array) ? value.to_sentence : value]
    end]
    begin
      I18n.translate! "#{event_message_prefix(event)}.description", info
    rescue I18n::MissingTranslationData => e
      Airbrake.notify e, :error_message => "unknown import error code while getting description: #{event.type}"
      nil
    rescue I18n::MissingInterpolationArgument => e
      Airbrake.notify e, :error_message => "missing interpolation argument for event type: #{event.type}"
      nil
    end
  end

  def event_message_prefix(event)
    "#{jobs_prefix}.show_page.event_messages.#{event.status}.#{event.type}"
  end

  def event_title(event)
    begin
      I18n.translate! "#{event_message_prefix(event)}.title"
    rescue I18n::MissingTranslationData => e
      Airbrake.notify e, :error_message => "unknown import error code while getting title: #{event.type}"
      I18n.translate "#{jobs_prefix}.show_page.fallback_event_title", error_code: event.type
    end
  end

  def display_restore_button(event)
    if event.dataset.nil?
      false
    else
      FeatureFlags.derive(nil, request).restore_dataset_button &&
      event.first_deleted_in_list &&
      event.dataset.deleted && event.activity_type == 'delete' &&
      event.dataset.publicationStage == 'published' &&
      event.dataset.flags.any? { |flag| flag.data == 'default' } &&
      event.dataset.displayType == 'table' &&
      event.dataset.viewType == 'tabular' &&
      (Date.today - event.created_at.to_date).to_i <= APP_CONFIG.restore_dataset_days
    end
  end

end
