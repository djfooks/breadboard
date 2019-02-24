precision highp float;
precision highp int;

varying vec2 vP;

uniform vec3 color;
uniform sampler2D texture;

void main(void)
{
    //gl_FragColor = vec4(vP, 0.0, 1.0);

    vec4 textureColor = texture2D(texture, vP);
    gl_FragColor = vec4(textureColor.xyz * color, textureColor.w);
}
