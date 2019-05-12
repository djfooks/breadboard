precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
uniform float size;

attribute vec2 position;
attribute vec2 p0;

varying vec2 vP;

void main()
{
    vec2 min = p0 - vec2(size, size);
    vec2 max = p0 + vec2(size, size);

    vec2 p = mix(min, max, position);

    vP = vec2(position.x, 1.0 - position.y);
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
