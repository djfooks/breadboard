precision highp float;
precision highp int;

uniform sampler2D map;
uniform vec3 color;
const float smoothing = 0.1;
const float threshold = 0.4;

varying vec2 vUv;

void main() {
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    float distance = texture2D( map, vUv ).a;
    float alpha = smoothstep( threshold - smoothing, threshold + smoothing, distance );
    gl_FragColor = vec4( 1.0, 0.0, 0.0, alpha );
}
