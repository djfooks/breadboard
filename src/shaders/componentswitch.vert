precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform mat4 projectionMatrix;
uniform float radius;

uniform sampler2D texture;

attribute vec2 position;
attribute vec3 circle0;
attribute vec3 circle1;
attribute float connected;

varying vec2 vP;
varying vec3 vCircle0;
varying vec3 vCircle1;
varying float vConnected;

void main()
{
    float r = radius + feather * 2.0;
    vec2 p0Min = vec2(circle0.x - r, circle0.y - r);
    vec2 p0Max = vec2(circle0.x + r, circle0.y + r);
    vec2 p1Min = vec2(circle1.x - r, circle1.y - r);
    vec2 p1Max = vec2(circle1.x + r, circle1.y + r);

    vec2 min = min(p0Min, p1Min);
    vec2 max = max(p0Max, p1Max);

    vec2 p = vec2(mix(min.x, max.x, position.x), mix(min.y, max.y, position.y));

    float value0 = texture2D(texture, vec2(circle0.z / textureSize, 0.0)).x;
    float value1 = texture2D(texture, vec2(circle1.z / textureSize, 0.0)).x;

    vConnected = texture2D(texture, vec2(connected / textureSize, 0.0)).x;
    value0 = value0 + value1 * vConnected;
    value1 = value1 + value0 * vConnected;

    vP = p;
    vCircle0 = vec3(circle0.xy, value0);
    vCircle1 = vec3(circle1.xy, value1);

    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
