precision highp float;
precision highp int;

uniform float feather;
uniform mat4 projectionMatrix;

attribute vec2 position;
attribute vec2 p0;
attribute vec2 p1;

varying vec2 vP;

void main()
{
    float size = 0.5;

    vec2 v = p1 - p0;
    vec2 n = v * size;
    vec2 m = vec2(n.y, -n.x);

    vec2 p = mix(-n, n, position.y);
    p += mix(-m, m, position.x);

    vP = vec2(position.x - size, position.y - size);
    vec4 mvPosition = vec4(p + p0 + v * 0.1, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
