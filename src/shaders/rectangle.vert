precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
uniform vec3 color;

attribute vec2 position;
attribute vec2 p1;
attribute vec2 p2;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vUV;
void main()
{
    vP1 = p1.xy;
    vP2 = p2.xy;

    vec2 p = mix(p1 - vec2(0.5, 0.5), p2 + vec2(0.5, 0.5), position);
    vP = p;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
