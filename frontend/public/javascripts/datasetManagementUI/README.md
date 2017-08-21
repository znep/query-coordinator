# Dataset Management User Interface (dsmui)
This is a doc for notes about why things are the way they are

## Non-obvious concepts

### Shortcuts
Why is the Geocoding functionality called a shortcut? Why is it not just a regular feature? Why are there references to shortcuts?

DSMAPI is just an interpreter which takes a SoQL expression and executes it. This means all functionality that transforms data is just some UI that generates expressions. The geocoding dialog is just a simple UI that generates an function like "geocode(`address`, `city`, `state`, `zip`)". The reason it's called a shortcut is because it's not an abstract expression builder; it's a very specific UI that simplifies the process of programming a geocode expression.

It's called a shortcut because it's a non-abstract expression builder, which implies someday we might have an abstract expression builder UI. Some day...
