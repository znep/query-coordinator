module ActivityFeedHelper
  def render_admin_activity_feed_initial_data
    activities_json = json_escape(@activities.to_json)
    pager_info_json = json_escape(@pager_info.to_json)
    javascript_tag("var initialData = {activities: #{activities_json}, pager_info: #{pager_info_json}}")
  end

  def activity_feed_translations
    parts = [
      LocalePart.screens.admin.jobs,
      LocalePart.plugins.daterangepicker,
      LocalePart.table,
      LocalePart.shared.components.filter_bar
    ]

    LocaleCache.render_translations parts
  end

  def render_activity_feed_translations
    javascript_tag "window.translations = #{activity_feed_translations.to_json}"
  end

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

  def activity_feed_prefix
    'screens.admin.jobs'
  end

  def event_description(event)
    if event.info.keys.sort == %w(params type)
      info = event.info[:params]
    end
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
    "#{activity_feed_prefix}.show_page.event_messages.#{event.status}.#{event.type}"
  end

  def event_title(event)
    begin
      I18n.translate! "#{event_message_prefix(event)}.title"
    rescue I18n::MissingTranslationData => e
      Airbrake.notify e, :error_message => "unknown import error code while getting title: #{event.type}"
      I18n.translate "#{activity_feed_prefix}.show_page.fallback_event_title", error_code: event.type
    end
  end

  def display_restore_button(event)
    if event.dataset.nil?
      false
    else
        event.first_deleted_in_list &&
        event.dataset.deleted && event.activity_type == 'delete'
    end
  end

  def restore_button_disabled(event)
    # we still want to show the button for restorable events, but
    # disable it and show a tooltip (tooltip is set in JS)
    !event.dataset.restorable?
  end

  def restore_button_class_name(event)
    'button restore-dataset not-restorable-'.tap do |class_name|
      class_name <<
        if event.dataset.flags.any? { |flag| flag.data == 'restorePossibleForType' }
          'time'
        elsif !event.dataset.restorable
          'type'
        end
    end
  end

  def restore_button(activity)
    # If activity is a delete, show button to restore dataset.
    # If the activity is for a non-restorable dataset (wrong type or too long deleted),
    #  we still show the button but have it disabled with a tooltip.
    if display_restore_button(activity)
      button_tag(
        t("#{activity_feed_prefix}.index_page.restore_deleted_dataset.button"),
        class: restore_button_class_name(activity),
        disabled: restore_button_disabled(activity),
        data: {
          dataset_id: activity.dataset.id,
          dataset_name: activity.dataset.name
        }
      )
    end
  end

end
