class Displays::Calendar < Displays::Base
    def can_publish?
        false
    end

    def scrolls_inline?
        false
    end

    def required_javascripts
        [ 'shared-calendar' ]
    end

    def required_stylesheets
        [ 'fullcalendar' ]
    end

    def render_inline_runtime_js(context)
        js = <<END
$('#dataGrid').blistCalendar({
    viewId: blist.display.viewId,
    editable: blist.display.editable,
    displayFormat: blist.display.options
});
END
        super << js
    end
end
