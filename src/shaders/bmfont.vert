precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

attribute vec2 uv;
attribute vec2 position;
attribute float color;

varying vec2 vUv;
varying float vRed;
void main()
{
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0.0, 1.0 );
    vRed = color;
}
