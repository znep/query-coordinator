module JobsHelper

  def date_and_relative_day(time)
    "#{time.strftime('%d %b %Y at %H:%M:%S %Z')} (#{HumaneDateHelper.humane_date(time)})"
  end

  def relative_day(time)
    diff = Time.now - time
    if diff < 1.day
      t('core.date_time.current_day_past').capitalize
    elsif diff < 2.days
      t('core.date_time.single_day_past').capitalize
    else
      time.strftime('%d %b %Y')
    end
  end

  def icon_for_status(status)
    case status
      when 'notstarted'
       'waiting'
      when 'inprogress'
       'processing'
      when 'success'
       'check'
      when 'failure'
       'failed'
    end
   end

  def jobs_prefix
    'screens.admin.jobs'
  end

  def event_description(event)
    begin
      info = Hash[event.info.map do |key, value|
        [key.to_sym, value.is_a?(Array) ? value.to_sentence : value]
      end]
      I18n.translate! "#{jobs_prefix}.show_page.import_failures.#{event.type}.description", info
    rescue I18n::MissingTranslationData => e
      Airbrake.notify e, :error_message => "unknown import error code while getting description: #{event.type}"
      nil
    rescue I18n::MissingInterpolationArgument => e
      Airbrake.notify e, :error_message => "missing interpolation argument for event type: #{event.type}"
      nil
    end
  end

  def event_title(event)
    begin
      I18n.translate! "#{jobs_prefix}.show_page.import_failures.#{event.type}.title"
    rescue I18n::MissingTranslationData => e
      Airbrake.notify e, :error_message => "unknown import error code while getting title: #{event.type}"
      I18n.translate "#{jobs_prefix}.show_page.fallback_event_title", error_code: event.type
    end
  end

end