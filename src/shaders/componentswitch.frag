precision highp float;
precision highp int;

uniform float feather;
uniform vec3 bgColor;

uniform sampler2D texture;

varying vec2 vP;
varying vec3 vBase;
varying vec3 vP0;
varying vec3 vP1;
varying float vConnected;

vec4 blend(vec4 color, vec3 inColor, float alpha)
{
    alpha = clamp(alpha, 0.0, 1.0);
    float outAlpha = color.a + alpha * (1.0 - color.a);
    if (outAlpha == 0.0)
    {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    vec3 v0 = inColor * alpha;
    vec3 v1 = color.rgb * color.a * (1.0 - alpha);
    vec3 v2 = (v0 + v1) / outAlpha;
    return vec4(v2, outAlpha);
}

vec3 getWireColor(float wireValue)
{
    return mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.53, 0.53), wireValue);
}

vec4 wire(vec3 base, vec3 pConnected)
{
    vec2 n = base.xy - pConnected.xy;
    float l = length(n);
    if (l == 0.0)
    {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    n = n / l;
    n = vec2(n.y, -n.x);
    vec2 wireOffset = vP - base.xy;
    float d = abs(dot(wireOffset, n));

    float minX = min(base.x, pConnected.x);
    float maxX = max(base.x, pConnected.x);
    float minY = min(base.y, pConnected.y);
    float maxY = max(base.y, pConnected.y);
    const float innerWire = 0.07;
    const float outerWire = 0.14;

    float outerBounds = outerWire + feather;
    bool inOuterWire = vP.x >= minX - (outerBounds * step(1.0, abs(n.x))) &&
                       vP.x <= maxX + (outerBounds * step(1.0, abs(n.x))) &&
                       vP.y >= minY - (outerBounds * step(1.0, abs(n.y))) &&
                       vP.y <= maxY + (outerBounds * step(1.0, abs(n.y)));
    if (!inOuterWire)
    {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }

    float v = (d - outerWire) / feather;
    float alpha = 1.0 - v;

    v = (d - innerWire) / feather;

    float wireValue = sign(base.z + pConnected.z);

    vec3 wireColor = getWireColor(wireValue);
    wireColor = mix(wireColor, bgColor, max(min(v, 1.0), 0.0));

    return vec4(wireColor.rgb, alpha);
}

void main(void) {
    // gl_FragColor = vec4(vBase.z, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4(0.9, 0.0, 0.0, 1.0);
    const float innerRadius = 0.26;
    const float outerRadius = 0.31;
    float outerR = outerRadius - feather * 0.5;
    float innerR = innerRadius - feather * 0.5;

    vec2 offsetBase = vP - vBase.xy;
    float dBase = length(offsetBase);
    vec2 offset0 = vP - vP0.xy;
    float d0 = length(offset0);
    vec2 offset1 = vP - vP1.xy;
    float d1 = length(offset1);

    float is3Pin = length(vBase - vP0);

    // bg
    float alphaBg = (1.0 - ((dBase - outerR) / feather)) * is3Pin;
    alphaBg = max(alphaBg, 1.0 - ((d0 - outerR) / feather));
    alphaBg = max(alphaBg, 1.0 - ((d1 - outerR) / feather));
    vec4 color = vec4(bgColor, alphaBg);

    // wire
    vec4 wireColor = wire(vBase, vConnected == 1.0 ? vP1 : vP0);
    color = blend(color, wireColor.rgb, wireColor.a);

    // fg
    float alphaFgBase = (1.0 - ((dBase - innerR) / feather)) * is3Pin;
    vec3 fgColorBase = getWireColor(vBase.z);
    color = blend(color, fgColorBase, alphaFgBase);

    float alphaFg0 = 1.0 - ((d0 - innerR) / feather);
    vec3 fgColor0 = getWireColor(vP0.z);
    color = blend(color, fgColor0, alphaFg0);

    float alphaFg1 = 1.0 - ((d1 - innerR) / feather);
    vec3 fgColor1 = getWireColor(vP1.z);
    color = blend(color, fgColor1, alphaFg1);

    gl_FragColor = color;
}
