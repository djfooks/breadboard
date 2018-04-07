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
    n = normalize(n);

    vec2 q1 = p1;
    vec2 q2 = p2;
    q1 += n;
    q2 -= n;

    vec2 p = vec2(mix(q1.x, q2.x, position.x * 0.5 + 0.5),
                  mix(q1.y, q2.y, position.y * 0.5 + 0.5));

    vP = p;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
