varying vec3 vWorldPosition;
varying vec2 vUV;

uniform float time;
uniform sampler2D grassNoise;
uniform sampler2D cloudShadow;

void main() {
    vec3 baseColor = 1.5 * texture2D(grassNoise, vUV).rgb - vec3(0.5);
    vec3 shadow = texture2D(cloudShadow, vUV + vec2(time / 5.0)).rgb;

    vec3 color = mix(baseColor, shadow, 0.4);
    gl_FragColor = vec4(color, 1.0);
}