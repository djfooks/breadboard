precision highp float;
precision highp int;

uniform float time;
uniform float feather;
uniform vec3 bgColor;

varying vec2 vP;

const float thickness = 0.02;
const float offsetX = 0.25;
const float offsetY = 0.3;
const float bump = 0.4;

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

float quadraticEaseInOut(float p)
{
    if(p < 0.5)
    {
        return 2.0 * p * p;
    }
    else
    {
        return (-2.0 * p * p) + (4.0 * p) - 1.0;
    }
}

void main(void)
{
    // gl_FragColor = vec4(vP.xy, 0.0, 1.0);

    const float sinv = 0.8660254037844386;
    const float cosv = 0.5;

    float alpha = 0.0;
    const float animSpeed = 0.4;
    float t = fract(time * animSpeed);
    t = t < 0.5 ? t : 1.0 - t;
    float scale = 1.0 + quadraticEaseInOut(t * 2.0) * 0.1;

    mat2 rot60 = mat2(cosv, -sinv, sinv, cosv);
    mat2 rot = mat2(scale, 0, 0, scale);
    for (int i = 0; i < 6; ++i)
    {
        alpha = max(alpha, line(rot * vec2(0.0, 0.0), rot * vec2(0.0, 0.5)));

        alpha = max(alpha, line(rot * vec2(0.0, 0.4), rot * vec2(0.1, 0.5)));
        alpha = max(alpha, line(rot * vec2(0.0, 0.4), rot * vec2(-0.1, 0.5)));

        alpha = max(alpha, line(rot * vec2(0.0, 0.2), rot * vec2(0.17, 0.3)));
        alpha = max(alpha, line(rot * vec2(0.0, 0.2), rot * vec2(-0.17, 0.3)));
        rot = rot * rot60;
    }

    float dist = length(vP);
    float l = fract(time * animSpeed) - 0.5;
    float c = clamp(1.0 - abs(dist - (l * 3.0)), 0.0, 1.0);

    gl_FragColor = vec4(bgColor + vec3(0.0, 0.0, c), alpha);
}
