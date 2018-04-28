precision highp float;
precision highp int;

uniform float feather;
uniform mat4 projectionMatrix;

attribute vec2 uv;
attribute vec3 circle;

varying vec2 vP;
varying vec3 vCircle;
void main()
{
    float radius = circle.z + feather * 2.0;
    vec2 p1 = vec2(circle.x - radius, circle.y - radius);
    vec2 p2 = vec2(circle.x + radius, circle.y + radius);

    vec2 p = vec2(mix(p1.x, p2.x, uv.x), mix(p1.y, p2.y, uv.y));

    vP = p;
    vCircle = circle;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
