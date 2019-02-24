precision highp float;
precision highp int;

uniform mat4 projectionMatrix;

attribute vec2 position;
attribute vec2 p1;
attribute vec2 p2;
attribute float colorIndex;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vColorIndex;
void main()
{
    vP1 = p1;
    vP2 = p2;
    vColorIndex = colorIndex;

    vec2 o = vP1 - vP2;
    float d = length(o);
    vec2 n = o / d;
    vec2 m = vec2(n.y, -n.x) * 0.5;

    vec2 p = mix(vP1, vP2, position.x);
    p += mix(-m, m, position.y);

    vP = p;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
