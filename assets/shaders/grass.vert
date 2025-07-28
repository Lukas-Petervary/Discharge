varying vec3 vWorldPosition;
varying vec2 vUV;

uniform sampler2D windNoise;
uniform float time;

vec3 sphericalTransform(float m, float d, float h) {
    float sinmy = sin(m * h);
    float cosmy = cos(m * h);
    float sind = sin(d);
    float cosd = cos(d);

    return vec3(sinmy * cosd, cosmy, sinmy * sind) * h;
}

void main() {
    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vUV = worldPosition.xz * 0.05;

    vec3 noise = texture2D(windNoise, vUV + vec2(time / 5.0)).rgb;
    float mag = 1.0 - noise.r * 2.0;
    float dir = noise.b * 3.14159265359;

    vec3 offset = sphericalTransform(1.73 - mag, 1.1 * dir, position.y);
    worldPosition.xyz += offset;

    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
}