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

void main(void)
{

    vec2 q = distanceToInt(vP);
    const float every = 10.0;
    vec2 r = distanceToInt(vP / every) * every;

    float v = mix(grid(q), grid(r), 10.0 * feather / every);

    gl_FragColor = vec4(v, v, v, 1.0);
}
