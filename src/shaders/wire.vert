precision highp float;
precision highp int;

uniform mat4 projectionMatrix;

attribute vec2 position;
attribute vec3 p1;
attribute vec3 p2;

varying vec2 vP;
varying vec2 vP1;
varying vec2 vP2;
varying float vUV;
void main()
{
    vP1 = p1.xy;
    vP2 = p2.xy;
    vUV = mix(p1.z, p2.z, position.x);

    vec2 n = vP1 - vP2;
    n = normalize(n) * 1.0;
    vec2 m = vec2(n.y, -n.x);

    vec2 p = mix(vP1 + n, vP2 - n, position.x);
    p += mix(-m, m, position.y);

    vP = p;
    vec4 mvPosition = vec4(p, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
