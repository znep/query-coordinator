module AdminHelper
  include ThirdPartySurvey

  def select_for_role(id, options = {})
    name = options.fetch('name', 'role')
    current_role = options['current_role']
    css_class = options.fetch('css_class', '')
    include_none = options.fetch('include_none', true)
    show_label = options.fetch('show_label', true)

    stories_roles = ['editor_stories', 'publisher_stories']
    stories_disabled = !FeatureFlags.derive(nil, request).stories_enabled

    roles = User.roles_list

    out = %Q(<label for="#{id}")
    out << 'style="display: none"' unless show_label
    out << %Q(>#{I18n.t('screens.admin.users.role')}</label>)
    out << %Q(<select class="#{css_class}" name="#{name}" id="#{id}">)
    out << %Q(<option value="0">#{t('screens.admin.users.roles.none')}</option>) if include_none

    roles.each do |role|
      out << %Q(<option value="#{role}")
      out << ' selected="selected"' if current_role && role == current_role
      out << ' disabled' if stories_disabled && stories_roles.include?(role)
      # Use default to allow user-translated role names.
      out << %Q(>#{I18n.t(role, scope: 'screens.admin.users.roles', default: role).titleize}</option>)
    end
    out << '</select>'
  end

  def form_button(url_opts, button_text, opts = {}, button_opts = {})
    form_tag(url_opts, opts) do
      ((yield if block_given?) || ''.html_safe) +
        submit_tag(button_text, {:class => 'button'}.merge(button_opts))
    end
  end

  def form_checkbox_button(options)
    url_opts = options[:url_opts]
    id = options[:id]
    disabled = options.fetch(:disabled, false)
    checked = options[:checked]
    title = options[:title]
    button_opts = options.fetch(:button_opts, {})

    form_tag(url_opts, :method => :put) do
      if disabled
        checkbox_label = t('screens.admin.georegions.disable_default_label')
        raw(%Q{
          <span
            class="form-checkbox disabled"
            role="checkbox"
            tabindex="0"
            aria-disabled="true"
            aria-checked="false"
            aria-label="#{checkbox_label}"
            title="#{checkbox_label}">
          </span>
        })
      else
        button_options = {
          'class' => 'form-checkbox',
          'id' => id,
          'aria-checked' => checked,
          'aria-label' => title,
          'role' => 'checkbox',
          'title' => title
        }.merge(button_opts)

        submit_tag('', button_options) +
          label_tag(id, nil, 'aria-hidden' => true, 'role' => 'presentation') do
            raw(%Q{<span class="icon-check #{'unchecked' unless checked}"></span>})
          end
      end
    end
  end

  def notification_interval_select_options(selected_option = nil)
    options_for_select(Approval.notification_intervals.invert.sort { |a, b|
      a.last.to_i - b.last.to_i }, (selected_option || '').to_s)
  end

  def admin_nav_link_to(title, options)
    link_to_unless_current raw(%Q(<span class="icon"></span>#{title})), options
  end

  def user_can?(user, action, current_domain = CurrentDomain)
    current_domain.user_can?(user, action)
  end

  def a11y_metadata_category_summary(categories, columns)
    a11y_summary(
      :columns => columns,
      :rows => categories.map(&:first),
      :a11y_table_description => t('screens.admin.metadata.category_table_description')
    )
  end

  def a11y_metadata_fieldset_summary(metadata_fields, columns)
    a11y_summary(
      :columns => columns,
      :rows => metadata_fields.fetch('fields', []).pluck('name'),
      :a11y_table_description => t('screens.admin.metadata.metadata_field_table_description', :name => metadata_fields['name'])
    )
  end

  def a11y_users_summary(users, columns)
    a11y_summary(
      :columns => columns,
      :rows => users.map(&:displayName),
      :a11y_table_description => t('screens.admin.users.users_table_description')
    )
  end

  def a11y_pending_users_summary(users, columns)
    a11y_summary(
      :columns => columns,
      :rows => users.map(&:email),
      :a11y_table_description => t('screens.admin.users.pending_users_table_description')
    )
  end

  def render_admin_qualtrics
    render_qualtrics_survey('admin')
  end

  def render_admin_userzoom
    render_userzoom_survey('admin')
  end

  private

  def a11y_summary(opts)
    if opts[:columns].blank? || opts[:rows].blank?
      return t('table.no_summary_available')
    end
    columns = opts[:columns].map { |value| %("#{value}") }
    rows = opts[:rows].map { |row| %("#{row}") }
    row_headings = ''
    if rows.size < 5
      row_headings = rows.join(', ')
    end

    template_opts = {
      :data_description => opts[:a11y_table_description],
      :column_heading_count => columns.size,
      :column_headings => columns.join(', '),
      :row_heading_count => rows.size,
      :row_headings => row_headings
    }

    t('table.summary', template_opts)
  end

end
