module ViewsHelper
  attr_reader :view

  DEFAULT_META_KEYWORDS = %w( public data statistics dataset ).freeze

  # Return the description we'll use in the meta description tag
  def view_meta_description
    return nil if view.nil?

    if view.description.blank?
      display_type = I18n.t("core.view_types.#{view.displayType}")
      updated_at = view.rowsUpdatedAt.nil? ? nil : format_date(view.rowsUpdatedAt, 'long')

      desc = I18n.t('core.view.default_meta_description', type: display_type)

      if updated_at
        desc << I18n.t('core.view.default_meta_description_last_updated', updated_at: updated_at)
      end
      desc
    else
      view.description
    end
  end

  # Return a list keywords we'll use in the meta keywords tag
  def view_meta_keywords
    return nil if view.nil?

    ((view.tags || []).map(&:to_s) + DEFAULT_META_KEYWORDS).uniq
  end

end
