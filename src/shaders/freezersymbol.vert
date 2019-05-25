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
    float size = 1.5;

    vec2 p = (p0 + p1) * vec2(0.5, 0.5);
    vec2 q = vec2((position.x - 0.5) * size, (position.y - 0.5) * size);

    vP = vec2((position.x - 0.5) * size, (position.y - 0.5) * size);
    vec4 mvPosition = vec4(p + q, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
