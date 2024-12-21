precision highp float;
precision highp int;

uniform float uTime;
uniform vec4 uMouse;
uniform sampler2D uChannel0;

uniform vec3 uSunColor;
uniform vec3 uLightColor;
uniform vec3 uDarkColor;
uniform vec3 uBaseSkyColor;

varying vec2 vUv;

vec3 gamma(vec3 col, float g) {
    return pow(col, vec3(g));
}

float noiseLayer(vec2 uv) {
    float t = (uTime + uMouse.x) / 5.;
    uv.y -= t / 60.;
    float e = 0.;
    for(float j = 1.; j < 9.; j++) {
        float timeOffset = t * mod(j, 2.989) * .02 - t * .015;
        e += 1. - texture(uChannel0, uv * (j * 1.789) + j * 159.45 + timeOffset).r / j;
    }
    e /= 3.5;
    return e;
}

vec3 drawSky(vec2 uv, vec2 uvInit) {
    float clouds = noiseLayer(uv);
    float eps = 0.1;
    vec3 n = vec3(clouds - noiseLayer(uv + vec2(eps, 0.)), -.3, clouds - noiseLayer(uv + vec2(0., eps)));
    n = normalize(n);
    float l = dot(n, normalize(vec3(uv.x, -.2, uv.y + .5)));
    l = clamp(l, 0., 1.);

    vec3 cloudColor = mix(uBaseSkyColor, uDarkColor, length(uvInit) * 1.7);
    cloudColor = mix(cloudColor, uSunColor, l);

    vec3 skyColor = mix(uLightColor, uBaseSkyColor, clamp(uvInit.y * 2., 0., 1.));
    skyColor = mix(skyColor, uDarkColor, clamp(uvInit.y * 3. - .8, 0., 1.));
    skyColor = mix(skyColor, uSunColor, clamp(-uvInit.y * 10. + 1.1, 0., 1.));

    if(length(uvInit - vec2(0., .04)) < .03) {
        skyColor += vec3(2., 1., .8);
    }

    float cloudMix = clamp(0., 1., clouds * 4. - 8.);
    vec3 color = mix(cloudColor, skyColor, clamp(cloudMix, 0., 1.));

    return color;
}

void main() {
    vec2 uvInit = vUv;
    vec2 uv = uvInit;
    uv.y -= .01;
    uv.y = abs(uv.y);
    uv.y = log(uv.y) / 2.;
    uv.x *= 1. - uv.y;
    uv *= .2;

    vec3 col = drawSky(uv, uvInit);
    col += vec3(1., .8, .6) * (0.55 - length(uvInit));
    col *= .75;
    col = gamma(col, 1.3);

    gl_FragColor = vec4(col, 1.);
}
