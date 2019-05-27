precision highp float;
precision highp int;

uniform float feather;

varying vec3 vP;

void main(void)
{
    gl_FragColor = vec4(vP, 1.0);
}
