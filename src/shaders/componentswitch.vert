precision highp float;
precision highp int;

uniform float feather;
uniform float textureSize;
uniform mat4 projectionMatrix;
uniform float radius;

uniform sampler2D texture;

attribute vec2 position;
attribute vec3 base;
attribute vec3 p0;
attribute vec3 p1;
attribute float signal;

varying vec2 vP;
varying vec3 vBase;
varying vec3 vP0;
varying vec3 vP1;
varying float vConnected;

void main()
{
    float r = radius + feather * 2.0;
    vec2 p0Min = vec2(base.x - r, base.y - r);
    vec2 p0Max = vec2(base.x + r, base.y + r);
    vec2 p1Min = vec2(p0.x - r, p0.y - r);
    vec2 p1Max = vec2(p0.x + r, p0.y + r);
    vec2 p2Min = vec2(p1.x - r, p1.y - r);
    vec2 p2Max = vec2(p1.x + r, p1.y + r);

    vec2 min = min(min(p0Min, p1Min), p2Min);
    vec2 max = max(max(p0Max, p1Max), p2Max);

    vec2 p = vec2(mix(min.x, max.x, position.x), mix(min.y, max.y, position.y));

    float valueBase = texture2D(texture, vec2((base.z + 0.5) / textureSize, 0.5)).x;
    float valueP0 = texture2D(texture, vec2((p0.z + 0.5) / textureSize, 0.5)).x;
    float valueP1 = texture2D(texture, vec2((p1.z + 0.5) / textureSize, 0.5)).x;
    vConnected = texture2D(texture, vec2((signal + 0.5) / textureSize, 0.5)).x;

    vP = p;
    vBase.xy = base.xy;
    vP0.xy = p0.xy;
    vP1.xy = p1.xy;

    float is3Pin = length(vBase - vP0);
    float isSimpleSwitch = 1.0 - is3Pin;

    vBase.z = sign(valueBase + valueP1 * vConnected + valueP0 * (1.0 - vConnected));
    vP0.z = sign(valueP0 + (isSimpleSwitch * vConnected * valueP1) + (valueBase * (is3Pin * (1.0 - vConnected))));
    vP1.z = sign(valueP1 + (isSimpleSwitch * vConnected * valueP0) + (valueBase * (is3Pin * (      vConnected))));

    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
