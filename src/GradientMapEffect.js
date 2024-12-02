// GradientMapEffect.js
import { Uniform } from "three"
import { Effect } from "postprocessing"
import { wrapEffect } from "@react-three/postprocessing"

const fragmentShader = `
uniform sampler2D uGradientMap;
uniform float uOpacity;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float luminance = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  vec4 gradientColor = texture2D(uGradientMap, vec2(luminance, 0.0));
  outputColor = gradientColor;
}

`

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
