precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vUV;

uniform sampler2D texture;

void main(void) {
    gl_FragColor = vec4(0.0, 0.9, 0.0, 1.0);
}
