#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp int;

uniform sampler2D map;
uniform vec3 color;

varying vec2 vUv;

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  vec3 texRGB = texture2D(map, vUv).rgb;
  float sigDist = median(texRGB.r, texRGB.g, texRGB.b) - 0.5;
  float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(color.xyz, alpha);
}
