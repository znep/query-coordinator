module GeoregionsHelper
  def can_view_georegions_admin?(current_user)
    (current_user.is_admin? || current_user.roleName == 'administrator') &&
      feature_flag?(:enable_spatial_lens_admin, request)
  end
end
