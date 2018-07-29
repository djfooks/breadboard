precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform mat4 projectionMatrix;
uniform float radius;
uniform vec3 color;

uniform sampler2D texture;

attribute vec2 position;
attribute vec3 circle;

varying vec2 vP;
varying vec3 vCircle;

void main()
{
    float r = radius + feather * 2.0;
    vec2 p1 = vec2(circle.x - r, circle.y - r);
    vec2 p2 = vec2(circle.x + r, circle.y + r);

    vec2 p = vec2(mix(p1.x, p2.x, position.x), mix(p1.y, p2.y, position.y));

    float value = texture2D(texture, vec2(circle.z / textureSize, 0.0)).x;
    vP = p;
    vCircle = vec3(circle.xy, value);
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
