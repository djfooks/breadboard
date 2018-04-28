precision highp float;
precision highp int;

uniform float feather;

varying vec2 vP;

const float gridLineWidth = 0.01;

vec2 distanceToInt(vec2 v)
{
    vec2 frac = fract(v);
    vec2 s = step(vec2(0.5, 0.5), frac);
    return abs(s - frac);
}

float grid(vec2 s)
{
    float d = min(s.x, s.y);
    float v = (d - gridLineWidth) / feather;
    return clamp(v, 0.0, 1.0) + 0.4;
}

float lerpWeight(float s)
{
    float w = s * feather;
    return clamp(w, 0.0, 1.0);
}

void main(void)
{
    const float every = 10.0;
    const float everySq = every * every;
    vec2 q = distanceToInt(vP);
    vec2 r = distanceToInt(vP / every) * every;
    vec2 s = distanceToInt(vP / (everySq)) * (everySq);

    float v = mix(grid(q), grid(r), lerpWeight(10.0 / every));
    v = mix(v, grid(s), lerpWeight(20.0 / (everySq)));
    //float v = grid(s);

    gl_FragColor = vec4(v, v, v, 1.0);
}
