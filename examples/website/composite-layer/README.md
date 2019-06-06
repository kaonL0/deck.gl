This is an experimentation of how to extend ArcLayer :
- create custom Layer (MyArcLayer) that extends ArcLayer
- adapt vertex and fragment shader
- pass attribute to shader (random value, that modify arc length)
- create composite layer (ArcTextLayer) that use TextLayer and MyArcLayer

### Usage

Copy the content of this folder to your project.

To see the base map, you need a [Mapbox access token](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/).

You need to set `MAPBOX_TOKEN` directly in `app.js`.

```bash
# install dependencies
yarn
# bundle and serve the app with webpack
npm start
```