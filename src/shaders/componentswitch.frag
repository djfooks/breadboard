precision highp float;
precision highp int;

uniform float feather;

uniform sampler2D texture;

varying vec2 vP;
varying vec3 vCircle0;
varying vec3 vCircle1;
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

vec4 wire()
{
    vec2 n = vCircle0.xy - vCircle1.xy;
    n = normalize(n);
    n = vec2(n.y, -n.x);
    vec2 wireOffset = vP - vCircle0.xy;
    float d = abs(dot(wireOffset, n));

    float minX = min(vCircle0.x, vCircle1.x);
    float maxX = max(vCircle0.x, vCircle1.x);
    float minY = min(vCircle0.y, vCircle1.y);
    float maxY = max(vCircle0.y, vCircle1.y);
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

    float wireValue = sign(vCircle0.z + vCircle1.z);

    vec3 wireColor = getWireColor(wireValue);
    wireColor = mix(wireColor, vec3(0.0, 0.0, 0.0), max(min(v, 1.0), 0.0));

    return vec4(wireColor.rgb, alpha);
}

void main(void) {
    // gl_FragColor = vec4(0.9, 0.0, 0.0, 1.0);
    const float innerRadius = 0.26;
    const float outerRadius = 0.31;
    float outerR = outerRadius - feather * 0.5;
    float innerR = innerRadius - feather * 0.5;

    vec2 offset0 = vP - vCircle0.xy;
    float d0 = length(offset0);
    vec2 offset1 = vP - vCircle1.xy;
    float d1 = length(offset1);

    // bg
    float alphaBg = 1.0 - ((d0 - outerR) / feather);
    alphaBg = max(alphaBg, 1.0 - ((d1 - outerR) / feather));

    vec4 color = vec4(0.0, 0.0, 0.0, alphaBg);

    if (vConnected == 1.0)
    {
        vec4 wireColor = wire();
        color = blend(color, wireColor.rgb, wireColor.a);
    }

    // fg
    float alphaFg0 = 1.0 - ((d0 - innerR) / feather);
    vec3 fgColor0 = getWireColor(vCircle0.z);
    color = blend(color, fgColor0, alphaFg0);

    float alphaFg1 = 1.0 - ((d1 - innerR) / feather);
    vec3 fgColor1 = getWireColor(vCircle1.z);
    color = blend(color, fgColor1, alphaFg1);

    gl_FragColor = color;
}
