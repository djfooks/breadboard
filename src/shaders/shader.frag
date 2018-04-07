varying vec2 vUv;
// varying vec2 vP;
// varying vec2 vP1;
// varying vec2 vP2;
void main( void ) {
    gl_FragColor = vec4( 0.5 - vUv.y * 0.5, vUv.x, vUv.y, 1.0 );

    // vec2 offset = vP - vP1;
    // float d = offset.x * offset.x + offset.y * offset.y;
    // if (d < 1.0)
    // {
    //     gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
    // }
    // else
    // {
    //     gl_FragColor = vec4( 0.5 - vUv.y * 0.5, vUv.x, vUv.y, 1.0 );
    // }
    //gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
