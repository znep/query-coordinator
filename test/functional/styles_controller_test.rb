require 'test_helper'

class StylesControllerTest < ActionController::TestCase

  def setup
    init_current_domain
  end

  # We shouldn't have to worry about BOMs in individual stylesheets since it only causes a problem when the
  # BOM is intermingled with the CSS itself, not when it occurs at the top of a file.
  test 'should remove BOM from merged stylesheets' do
    file = 'bomb'
    STYLE_PACKAGES['package'] = [file, file]
    @controller.stubs(
      :params => {:stylesheet => 'package'},
      :cached => nil,
      :headers => {},
      :get_includes => '',
      :content_type => 'test/css'
    )
    path = "#{Rails.root}/app/styles/#{file}.scss"
    File.stubs(:exist?).with(path).returns(true)
    File.stubs(:read).with(path).returns("\xEF\xBB\xBFbody.scss { width: 100%; }")
    path = "#{Rails.root}/app/styles/#{file}.css"
    File.stubs(:exist?).with(path).returns(true)
    File.stubs(:read).with(path).returns("\xEF\xBB\xBFbody.css { width: 100%; }")
    @controller.merged
    assert_response :success
    stripped_response = @controller.send(:render_merged_stylesheets, '')
    assert_equal(
      "body.scss{width:100%}body.scss{width:100%}\n",
      stripped_response,
      "There is one or more invisible BOM in the response: #{stripped_response.dump}"
    )
  end

end
