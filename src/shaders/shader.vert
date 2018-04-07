precision highp float;
precision highp int;

uniform mat4 projectionMatrix;

attribute vec2 position;
attribute vec2 p1;
attribute vec2 p2;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
void main()
{
    vP1 = p1;
    vP2 = p2;

    vec2 n = p1 - p2;
    n = normalize(n) * 0.5;
    vec2 m = vec2(n.y, -n.x);

    vec2 p = mix(p1 + n, p2 - n, position.x);
    p += mix(-m, m, position.y);

    vP = p;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
