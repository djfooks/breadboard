precision highp float;
precision highp int;

uniform float feather;
uniform mat4 projectionMatrix;

attribute vec2 position;
attribute vec2 p0;

varying vec2 vP;

void main()
{
    float size = 0.5 + feather * 0.5;
    vec2 min = vec2(p0.x - size, p0.y - size);
    vec2 max = vec2(p0.x + size, p0.y + size);

    vec2 p = vec2(mix(min.x, max.x, position.x), mix(min.y, max.y, position.y));

    vP = position - vec2(0.5, 0.5);
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
