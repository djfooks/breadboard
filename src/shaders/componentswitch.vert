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
varying vec2 vCircle0;
varying vec2 vCircle1;
varying float vValue0;
varying float vValue1;
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

    vP = p;
    vCircle0 = circle0.xy;
    vCircle1 = circle1.xy;
    vValue0 = texture2D(texture, vec2(circle0.z / textureSize, 0.0)).x;
    vValue1 = texture2D(texture, vec2(circle1.z / textureSize, 0.0)).x;
    vConnected = texture2D(texture, vec2(connected / textureSize, 0.0)).x;

    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
