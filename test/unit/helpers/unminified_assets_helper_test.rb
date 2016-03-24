require 'test_helper'

require_relative '../../../app/helpers/unminified_assets_helper'

class UnminifiedAssetsHelperTest < MiniTest::Unit::TestCase

  def setup
    @object = Object.new.tap { |object| object.extend(UnminifiedAssetsHelper) }
  end

  def test_dev_mode_delegates_to_include_javascripts_when_include_javascripts_unminified_is_called
    Rails.env.stubs( :development? => true )
    fake_packages = ['a', 'b', 'c']

    [true, false].each do |package_assets|
      Jammit.stubs(:package_assets => package_assets)
      @object.expects(:include_javascripts).with(*fake_packages).returns(:js_includes_mock).once
      assert_equal(
        :js_includes_mock,
        @object.include_javascripts_unminified(*fake_packages),
        'include_javascripts_unminified did not pass through return value from include_javascripts'
      )
    end
  end

  def test_prod_mode_returns_unminified_pkg_if_package_assets_true
    Rails.env.stubs( :development? => false )
    fake_package = 'test_pkg'
    fake_asset_url = 'fake_url'

    Jammit.stubs(:package_assets => true)
    @object.expects(:unminified_asset_url).with(fake_package, :js).returns(fake_asset_url).once
    @object.expects(:javascript_include_tag).with([fake_asset_url]).once
    @object.expects(:html_safe).once.returns(:expected_return)

    assert_equal(
      :expected_return,
      @object.include_javascripts_unminified(fake_package),
      'include_javascripts_unminified did not pass through return value from html_safe'
    )
  end

  def test_prod_mode_delegates_to_include_javascripts_when_include_javascripts_unminified_is_called_with_asset_packaging_disabled
    Rails.env.stubs( :development? => false )
    fake_packages = ['a', 'b', 'c']

    Jammit.stubs(:package_assets => false)
    @object.expects(:include_javascripts).with(*fake_packages).returns(:js_includes_mock).once
    assert_equal(
      :js_includes_mock,
      @object.include_javascripts_unminified(*fake_packages),
      'include_javascripts_unminified did not pass through return value from include_javascripts'
    )
  end

end
