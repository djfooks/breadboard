precision highp float;
precision highp int;

uniform float feather;

uniform sampler2D texture;

varying vec2 vP;
varying vec2 vCircle0;
varying vec2 vCircle1;
varying float vValue0;
varying float vValue1;
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

void main(void) {
    // gl_FragColor = vec4(0.9, 0.0, 0.0, 1.0);
    const float innerRadius = 0.26;
    const float outerRadius = 0.31;

    vec2 offset0 = vP - vCircle0.xy;
    float d0 = length(offset0);
    float r0 = outerRadius - feather * 0.5;
    float alpha = 1.0 - ((d0 - r0) / feather);

    vec2 offset1 = vP - vCircle1.xy;
    float d1 = length(offset1);
    float r1 = outerRadius - feather * 0.5;
    alpha = max(alpha, 1.0 - ((d1 - r1) / feather));

    vec4 color = vec4(0.0, 0.0, 0.0, alpha);

    // vec3 fgColor = mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0 - vValue, 1.0 - vValue), fg);

    gl_FragColor = color;
}
