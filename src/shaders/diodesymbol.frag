precision highp float;
precision highp int;

uniform float feather;
uniform float border;

varying vec2 vP;

const float thickness = 0.02;

float lineDistance(vec2 a, vec2 b)
{
    vec2 v = a - b;
    float lSq = dot(v, v);
    float t = max(0.0, min(1.0, dot(vP - b, v) / lSq));
    vec2 projection = b + t * v;
    return distance(vP, projection);
}

float line(vec2 a, vec2 b)
{
    float d = lineDistance(a, b);
    return max(1.0 - (max(0.0, d - (thickness - feather * 0.5)) / feather), 0.0);
}

void main(void)
{
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    float alpha = 0.0;
    alpha = max(alpha, line(vec2(0.0, 0.1), vec2(border,  -0.1)));
    alpha = max(alpha, line(vec2(0.0, 0.1), vec2(-border, -0.1)));
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
