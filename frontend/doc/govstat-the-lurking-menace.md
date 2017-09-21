## GovStat? Huh?

> NOTE: GovStat is the internal name for the product officially known as Open Performance.
> It is served by the Odysseus app.

It's true — the frontend repo plays a role in serving the GovStat app. The process isn't immediately obvious from reading the frontend repo's code; combined with low usage in dev environments and poor testing, it's possible to unwittingly introduce a regression in GovStat by making changes in this repo. Here's what you need to know:

* The `govStat` module+feature governs whether GovStat is active.
* When GovStat is active, it can be configured to be suppressed on particular routes — search for `suppress_govstat` to see details.
* Most GovStat routes begin with `/stat` and are handled by `OdysseusController`.
  * This controller only has one non-version route handler, `#index`, which effectively forwards requests to Odysseus.
  * Requests forwarded to Odysseus will have headers whose values are taken from `CurrentDomain.cname`, `CurrentDomain.default_locale`, `I18n.locale`, and the incoming frontend `Cookie` header.
  * The corresponding ERB file will inject a variety of scripts and styles for GovStat's use as well.
* There are two routes that begin with `/manage` and are handled by `GovstatController`.
  * These actually hook up to DataSlate.
  * In addition to locale and CNAME info, `CurrentDomain.theme` is also consumed here.

The key takeaways for preventing accidental regressions:

* Be mindful when mucking around with `CurrentDomain` or cookies.
* Be mindful when tinkering with routes.
* Double-check when changing/removing scripts and styles whose usage you aren't 100% certain about.
  * For example, you definitely won't affect GovStat by changing JavaScript files specific to Data Lens.

To enable GovStat on a domain:

* Go to the internal panel, expand "Pre-built Actions", and click "Enable GovStat".
* You then need to "bootstrap" GovStat. Go to /stat/my/goals, press ` twice, type ".bootstrap", and hit <enter>.
