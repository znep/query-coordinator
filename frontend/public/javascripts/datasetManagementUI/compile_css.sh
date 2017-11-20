#!/bin/bash
# CONSTANTS
MANIFESTS_DIR="./public/javascripts/datasetManagementUI/manifests"
COMPILED_CSS_DIR="./public/javascripts/datasetManagementUI/styles/styleguide"
STYLEGUIDE_DIR="../common/styleguide"

# if manifest dir exists, delete it then create a new empty one
if [ -d $MANIFESTS_DIR ]; then
  rm -rf $MANIFESTS_DIR
fi

mkdir $MANIFESTS_DIR

# for each partial in styleguide, create a manifest file for it;
# the conditionals are due to two partials that depend on classes
# defined in other partials
for filepath in $STYLEGUIDE_DIR/partials/*.scss; do
  filename=$(basename $filepath)
  filename=${filename:1}
  touch "$MANIFESTS_DIR/$filename"

  if [ $filename == "modal.scss" ]; then
  cat << END > $MANIFESTS_DIR/$filename
@import "node_modules/modularscale-sass/stylesheets/modular-scale";
@import "node_modules/bourbon/app/assets/stylesheets/bourbon";
@import "$STYLEGUIDE_DIR/variables/colors";
@import "$STYLEGUIDE_DIR/variables/grid";
@import "$STYLEGUIDE_DIR/variables/layout";
@import "$STYLEGUIDE_DIR/variables/typography";
@import "$STYLEGUIDE_DIR/variables/mixins";
@import "node_modules/bourbon-neat/app/assets/stylesheets/neat";
@import "$STYLEGUIDE_DIR/partials/typography";
@import "$STYLEGUIDE_DIR/partials/$filename";
END
elif [ $filename == "nav_tabs.scss" ]; then
    cat << END > $MANIFESTS_DIR/$filename
@import "node_modules/modularscale-sass/stylesheets/modular-scale";
@import "node_modules/bourbon/app/assets/stylesheets/bourbon";
@import "$STYLEGUIDE_DIR/variables/colors";
@import "$STYLEGUIDE_DIR/variables/grid";
@import "$STYLEGUIDE_DIR/variables/layout";
@import "$STYLEGUIDE_DIR/variables/typography";
@import "$STYLEGUIDE_DIR/variables/mixins";
@import "node_modules/bourbon-neat/app/assets/stylesheets/neat";
@import "$STYLEGUIDE_DIR/partials/list";
@import "$STYLEGUIDE_DIR/partials/$filename";
END
  else
    cat << END > $MANIFESTS_DIR/$filename
@import "node_modules/modularscale-sass/stylesheets/modular-scale";
@import "node_modules/bourbon/app/assets/stylesheets/bourbon";
@import "$STYLEGUIDE_DIR/variables/colors";
@import "$STYLEGUIDE_DIR/variables/grid";
@import "$STYLEGUIDE_DIR/variables/layout";
@import "$STYLEGUIDE_DIR/variables/typography";
@import "$STYLEGUIDE_DIR/variables/mixins";
@import "node_modules/bourbon-neat/app/assets/stylesheets/neat";
@import "$STYLEGUIDE_DIR/partials/$filename";
END
  fi
done

# if there is a css file, delete it and create a new empty one
if [ -d $COMPILED_CSS_DIR ]; then
  rm -rf $COMPILED_CSS_DIR
fi

mkdir -p $COMPILED_CSS_DIR

# for each manifest, compile it and put the result in the css directory
for filepath in $MANIFESTS_DIR/*.scss; do
  filename=$(basename $filepath)
  node_modules/.bin/node-sass $filepath $COMPILED_CSS_DIR/$filename --output-style expanded
done

# cleanup
rm -rf $MANIFESTS_DIR
