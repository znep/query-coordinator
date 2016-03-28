#!/bin/bash

set -e

read -r -p "Have you scaled workers and web services to 0? [y/N] " response
if [[ $response =~ ^(yes|y|Y)$ ]] ; then

  read -r -p "Are you really really sure you know what you're doing and accept the risks? [y/N] " response
  if [[ $response =~ ^(yes|y|Y)$ ]] ; then
    read -r -p "Please enter the original database hostname: " original
    dumpfile="/tmp/storyteller-$original.dump"
    pg_dump -Fc -v -h $original -U storyteller_rwc -d storyteller_production > $dumpfile

    read -r -p "Please enter the new host: " destination
    if [[ $original = $destination ]] ; then
      echo "*******************************************************"
      echo "*                       HEY!!!                        *"
      echo "* Origin and destination databases can't be the same! *"
      echo "* You assured me you knew what you were doing!!       *"
      echo "*******************************************************"
      exit 1
    fi

    echo
    echo "WARNING: you are about to perform a DESTRUCTIVE action. Please verify that this is what you want to do!"
    echo "FROM: $original"
    echo "TO:   $destination"
    echo "EVERYTHING IN $destination WILL BE DELETED!!!"
    echo
    read -p "Press ENTER to continue..."

    pg_restore -v -h $destination -U storyteller_rwc -d storyteller_production $dumpfile

    rm $dumpfile
    echo
    echo "Remember to update the marathon config for storyteller and promote the config!"
    echo
  fi
fi
