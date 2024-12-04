// GradientMapEffect.js
import { Uniform } from "three"
import { Effect } from "postprocessing"
import { wrapEffect } from "@react-three/postprocessing"

// GradientMapEffect.js
const fragmentShader = `
uniform sampler2D uGradientMap;
uniform float uOpacity;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float luminance = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));

  // Optionally adjust luminance to prevent over-brightness
  luminance = clamp(luminance, 0.0, 0.9); // Adjust the max value as needed

  // Or apply a non-linear adjustment
  // luminance = pow(luminance, 0.8); // Adjust exponent as needed

  vec4 gradientColor = texture2D(uGradientMap, vec2(luminance, 0.0));
  outputColor = mix(inputColor, gradientColor, uOpacity);
}
`;


class GradientMapEffectImpl extends Effect {
    constructor({ gradientMap, opacity = 0.2 }) {
        super("GradientMapEffect", fragmentShader, {
            uniforms: new Map([
                ["uGradientMap", new Uniform(gradientMap)],
                ["uOpacity", new Uniform(opacity)],
            ]),
        })
    }
}

const GradientMapEffect = wrapEffect(GradientMapEffectImpl)

export { GradientMapEffect }
