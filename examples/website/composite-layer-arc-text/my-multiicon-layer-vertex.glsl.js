// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

export default `\
#define SHADER_NAME multi-icon-layer-vertex-shader


attribute float instanceHeights;
attribute float instanceTilts;
uniform float numSegments;

attribute vec2 positions;

attribute vec3 instanceStartPosition;
attribute vec3 instanceEndPosition;
attribute vec3 instanceArcPosition;
attribute vec2 instancePositions64xyLow;
attribute float instanceSizes;
attribute float instanceAngles;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;
attribute vec4 instanceIconFrames;
attribute float instanceColorModes;
attribute vec2 instanceOffsets;

// the following three attributes are for the multi-icon layer
attribute vec2 instancePixelOffset;

uniform float sizeScale;
uniform float sizeMinPixels;
uniform float sizeMaxPixels;
uniform vec2 iconsTextureDim;
uniform float gamma;
uniform float opacity;
uniform bool billboard;

varying float vColorMode;
varying vec4 vColor;
varying vec2 vTextureCoords;
varying float vGamma;

// this 3 functions (paraboloid, getPos, getSegmentRatio) have been copied from arcLayer vertex shader
float paraboloid(vec2 source, vec2 target, float ratio) {

  vec2 x = mix(source, target, ratio);
  vec2 center = mix(source, target, 0.5);

  float dSourceCenter = distance(source, center);
  float dXCenter = distance(x, center);
  return (dSourceCenter + dXCenter) * (dSourceCenter - dXCenter);
}

vec3 getPos(vec2 source, vec2 target, float segmentRatio) {
  float vertexHeight = sqrt(max(0.0, paraboloid(source, target, segmentRatio))) * instanceHeights;

  float tiltAngle = radians(instanceTilts);
  vec2 tiltDirection = normalize(target - source);
  vec2 tilt = vec2(-tiltDirection.y, tiltDirection.x) * vertexHeight * sin(tiltAngle);

  return vec3(
    mix(source, target, segmentRatio) + tilt,
    vertexHeight * cos(tiltAngle)
  );
}

float getSegmentRatio(float index) {
  return smoothstep(0.0, 1.0, index / (numSegments - 1.0));
}

vec2 rotate_by_angle(vec2 vertex, float angle) {
  float angle_radian = angle * PI / 180.0;
  float cos_angle = cos(angle_radian);
  float sin_angle = sin(angle_radian);
  mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
  return rotationMatrix * vertex;
}

void main(void) {
  vec2 iconSize = instanceIconFrames.zw;

  // project meters to pixels and clamp to limits
  float sizePixels = clamp(
    project_size_to_pixel(instanceSizes * sizeScale),
    sizeMinPixels, sizeMaxPixels
  );

  // scale icon height to match instanceSize
  float instanceScale = iconSize.y == 0.0 ? 0.0 : sizePixels / iconSize.y;

  // scale and rotate vertex in "pixel" value and convert back to fraction in clipspace
  vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;

  pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
  pixelOffset += instancePixelOffset;

  vec2 source = project_position(instanceStartPosition).xy;
  vec2 target = project_position(instanceEndPosition).xy;
  float segmentRatio = getSegmentRatio(25.);

  if (billboard)  {
    pixelOffset.y *= -1.0;
    // gl_Position = project_position_to_clipspace(instancePositions, instancePositions64xyLow, vec3(0.0));

    // we need to change the position (calculate top of arc)
    // vec3(0., 0., 0.) was a test to change position
    vec3 pos = getPos(source, target, 0.5) + vec3(0., 0., 0.);
    gl_Position = project_common_position_to_clipspace(vec4(pos, 1.0));

    gl_Position.xy += project_pixel_size_to_clipspace(pixelOffset);

  } else {
    vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
    //gl_Position = project_position_to_clipspace(instancePositions, instancePositions64xyLow, offset_common);

    // we need to change the position (calculate top of arc)
    vec3 pos = getPos(source, target, 0.5) + vec3(0., 0., 0.);
    gl_Position = project_common_position_to_clipspace(vec4(pos, 1.0));
  }

  vTextureCoords = mix(
    instanceIconFrames.xy,
    instanceIconFrames.xy + iconSize,
    (positions.xy + 1.0) / 2.0
  ) / iconsTextureDim;

  vTextureCoords.y = 1.0 - vTextureCoords.y;

  vColor = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;
  // vColor = vec4(instanceColors.rgb, instanceColors.a * opacity);
  // vColor = vec4(instanceColors.rgb, .5);
  picking_setPickingColor(instancePickingColors);

  vGamma = gamma / (sizeScale * iconSize.y);
}
`;
