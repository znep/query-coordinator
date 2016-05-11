module SiteChromeAdminHelper
  def tab_link_classnames(index)
    "tab-link#{' current' if index == 0}"
  end

  def tab_section_classnames(index)
    "tab-content#{' current' if index == 0}"
  end
end
