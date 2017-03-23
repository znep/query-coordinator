# DataSlate

> Or: How I Learned to Stop Worrying and Love the Blob

DataSlate is a piece of functionality that allows CS to build custom pages for
customers. Here's what you need to know to get DataSlate pages in your own local
dev environment.

## How to define a page

There's actually a [handy guide](https://docs.google.com/document/d/1u5jjZdX63v3rVMo-PygLn7XBxtknu029l5Sc0_R0iKA) that explains the anatomy of a
DataSlate page if you want to build one from scratch. Here's a simple example:

```
{
  "name": "dataslate page",
  "path": "/test",
  "permission": "public",
  "privateData": false,
  "status": "published",
  "version": 1,
  "content": {
    "type" : "Container",
    "children": [
      {
        "type": "Text",
        "html": "<h1>test!</h1>"
      }
    ]
  }
}
```

You can also create copies of existing customer DataSlate pages. These pages can
be found on BitBucket (you may need to be invited by CS) or by fetching them via
API (e.g. [https://data.ny.gov/api/pages](https://data.ny.gov/api/pages) will
list all DataSlate pages for that customer). You may need to replace relative
links or references to customer assets in this case.

> In the wild, you may see very minimal DataSlate pages with a top-level node of
`#main` or similar. These are often used as entry points for React apps, and the
bulk of the code is loaded in via the custom JS configuration.

If you want to add custom CSS or JS to a DataSlate page, use the following
properties under the `site_theme` configuration in your internal panel:

* `custom_css`: Treat this field like a CSS file, defining whatever rules you
need for your page.
* `custom_tracking_code`: Treat this field like an HTML partial. The contents
will be injected directly into the end of the page; this is frequently used for
inline `<script>` tags.

**NOTE:** Those properties will also affect other old UX pages. Code safely!

## How to import a page locally

### Without Chalk

To create a brand new page, use the following commands:

```
DATASLATE_PAGE=path/to/page.json        # path to a DataSlate page JSON file
APP_TOKEN=OEHI9T2VtKRCaKwjCpx3WD4qB     # your user app token
EMAIL=firstname.lastname@socrata.com    # your user email address
read -rsp "password: " PASSWORD ; echo  # your user password

curl -X POST -d @$DATASLATE_PAGE -H "Content-Type: application/json" \
  --user $EMAIL:$PASSWORD -H "X-App-Token: $APP_TOKEN" -k \
  https://localhost/api/pages.json
```

To replace an existing page, edit your DataSlate page JSON so that the `version`
field matches the existing version number (and make any other changes you want),
then use the following commands:

```
PAGE_UID=abcd-1234                      # the 4x4 of the existing page
DATASLATE_PAGE=path/to/page.json        # path to a DataSlate page JSON file
APP_TOKEN=OEHI9T2VtKRCaKwjCpx3WD4qB     # your user app token
EMAIL=firstname.lastname@socrata.com    # your user email address
read -rsp "password: " PASSWORD ; echo  # your user password

curl -X PUT -d @$DATASLATE_PAGE -H "Content-Type: application/json" \
  --user $EMAIL:$PASSWORD -H "X-App-Token: $APP_TOKEN" -k \
  https://localhost/api/pages/$PAGE_UID.json
```

### With Chalk

**TODO**
