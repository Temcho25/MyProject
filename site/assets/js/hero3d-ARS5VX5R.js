import{a as Dt,b as Ht}from"./chunk-LKY2OWZK.js";import{A as Fe,B as ce,C as d,D as Y,E as I,F as P,G as pt,H as J,I as mt,J as vt,K as gt,L as ue,M as xt,N as Tt,O as Et,P as Mt,Q as Ge,S as bt,T as wt,U as Ct,V as Z,W as $,Y as St,Z as Rt,a as it,aa as yt,ba as ee,c as De,ca as Ie,d as ne,da as Pt,e as oe,ea as Ne,f as at,fa as _t,g as nt,h as lt,ha as he,i as le,j as ct,k as ut,l as He,m as Ue,n as k,o as ht,p as re,q as ft,r as Ae,s as b,t as dt,u as O,w as V,x as y,y as se,z as Be}from"./chunk-YR62CVC5.js";import{a as st}from"./chunk-KGPK6D6U.js";var fe={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var w=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},qt=new mt(-1,1,1,-1,0,1),Le=class extends ce{constructor(){super(),this.setAttribute("position",new Fe([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Fe([0,2,0,0,2,0],2))}},Yt=new Le,F=class{constructor(e){this._mesh=new d(Yt,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,qt)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var de=class extends w{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof P?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=I.clone(e.uniforms),this.material=new P({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new F(this.material)}render(e,t,o){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=o.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var ie=class extends w{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,o){let r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let c,i;this.inverse?(c=0,i=1):(c=1,i=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,c,4294967295),s.buffers.stencil.setClear(i),s.buffers.stencil.setLocked(!0),e.setRenderTarget(o),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}},pe=class extends w{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var me=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let o=e.getSize(new b);this._width=o.width,this._height=o.height,t=new O(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:k}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new de(fe),this.copyPass.material.blending=ne,this.clock=new he}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());let t=this.renderer.getRenderTarget(),o=!1;for(let r=0,s=this.passes.length;r<s;r++){let c=this.passes[r];if(c.enabled!==!1){if(c.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),c.render(this.renderer,this.writeBuffer,this.readBuffer,e,o),c.needsSwap){if(o){let i=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(i.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(i.EQUAL,1,4294967295)}this.swapBuffers()}ie!==void 0&&(c instanceof ie?o=!0:c instanceof pe&&(o=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new b);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let o=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(o,r),this.renderTarget2.setSize(o,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(o,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var ve=class extends w{constructor(e,t,o=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=o,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new y}render(e,t,o){let r=e.autoClear;e.autoClear=!1;let s,c;this.overrideMaterial!==null&&(c=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:o),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=c),e.autoClear=r}};var Ut={name:"LuminosityHighPassShader",shaderID:"luminosityHighPass",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new y(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var te=class n extends w{constructor(e,t,o,r){super(),this.strength=t!==void 0?t:1,this.radius=o,this.threshold=r,this.resolution=e!==void 0?new b(e.x,e.y):new b(256,256),this.clearColor=new y(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),c=Math.round(this.resolution.y/2);this.renderTargetBright=new O(s,c,{type:k}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let m=0;m<this.nMips;m++){let T=new O(s,c,{type:k});T.texture.name="UnrealBloomPass.h"+m,T.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(T);let _=new O(s,c,{type:k});_.texture.name="UnrealBloomPass.v"+m,_.texture.generateMipmaps=!1,this.renderTargetsVertical.push(_),s=Math.round(s/2),c=Math.round(c/2)}let i=Ut;this.highPassUniforms=I.clone(i.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new P({uniforms:this.highPassUniforms,vertexShader:i.vertexShader,fragmentShader:i.fragmentShader}),this.separableBlurMaterials=[];let l=[3,5,7,9,11];s=Math.round(this.resolution.x/2),c=Math.round(this.resolution.y/2);for(let m=0;m<this.nMips;m++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[m])),this.separableBlurMaterials[m].uniforms.invSize.value=new b(1/s,1/c),s=Math.round(s/2),c=Math.round(c/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let f=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=f,this.bloomTintColors=[new V(1,1,1),new V(1,1,1),new V(1,1,1),new V(1,1,1),new V(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;let M=fe;this.copyUniforms=I.clone(M.uniforms),this.blendMaterial=new P({uniforms:this.copyUniforms,vertexShader:M.vertexShader,fragmentShader:M.fragmentShader,blending:oe,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new y,this.oldClearAlpha=1,this.basic=new se,this.fsQuad=new F(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let o=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(o,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(o,r),this.renderTargetsVertical[s].setSize(o,r),this.separableBlurMaterials[s].uniforms.invSize.value=new b(1/o,1/r),o=Math.round(o/2),r=Math.round(r/2)}render(e,t,o,r,s){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();let c=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=o.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=o.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let i=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=i.texture,this.separableBlurMaterials[l].uniforms.direction.value=n.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=n.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),i=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(o),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=c}getSeperableBlurMaterial(e){let t=[];for(let o=0;o<e;o++)t.push(.39894*Math.exp(-.5*o*o/(e*e))/e);return new P({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new b(.5,.5)},direction:{value:new b(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new P({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}};te.BlurDirectionX=new b(1,0);te.BlurDirectionY=new b(0,1);var At={name:"BokehShader",defines:{DEPTH_PACKING:1,PERSPECTIVE_CAMERA:1},uniforms:{tColor:{value:null},tDepth:{value:null},focus:{value:1},aspect:{value:1},aperture:{value:.025},maxblur:{value:.01},nearClip:{value:1},farClip:{value:1e3}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		#include <common>

		varying vec2 vUv;

		uniform sampler2D tColor;
		uniform sampler2D tDepth;

		uniform float maxblur; // max blur amount
		uniform float aperture; // aperture - bigger values for shallower depth of field

		uniform float nearClip;
		uniform float farClip;

		uniform float focus;
		uniform float aspect;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, nearClip, farClip );
			#else
			return orthographicDepthToViewZ( depth, nearClip, farClip );
			#endif
		}


		void main() {

			vec2 aspectcorrect = vec2( 1.0, aspect );

			float viewZ = getViewZ( getDepth( vUv ) );

			float factor = ( focus + viewZ ); // viewZ is <= 0, so this is a difference equation

			vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );

			vec2 dofblur9 = dofblur * 0.9;
			vec2 dofblur7 = dofblur * 0.7;
			vec2 dofblur4 = dofblur * 0.4;

			vec4 col = vec4( 0.0 );

			col += texture2D( tColor, vUv.xy );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );

			gl_FragColor = col / 41.0;
			gl_FragColor.a = 1.0;

		}`};var ge=class extends w{constructor(e,t,o){super(),this.scene=e,this.camera=t;let r=o.focus!==void 0?o.focus:1,s=o.aperture!==void 0?o.aperture:.025,c=o.maxblur!==void 0?o.maxblur:1;this.renderTargetDepth=new O(1,1,{minFilter:Ue,magFilter:Ue,type:k}),this.renderTargetDepth.texture.name="BokehPass.depth",this.materialDepth=new gt,this.materialDepth.depthPacking=ht,this.materialDepth.blending=ne;let i=At,l=I.clone(i.uniforms);l.tDepth.value=this.renderTargetDepth.texture,l.focus.value=r,l.aspect.value=t.aspect,l.aperture.value=s,l.maxblur.value=c,l.nearClip.value=t.near,l.farClip.value=t.far,this.materialBokeh=new P({defines:Object.assign({},i.defines),uniforms:l,vertexShader:i.vertexShader,fragmentShader:i.fragmentShader}),this.uniforms=l,this.fsQuad=new F(this.materialBokeh),this._oldClearColor=new y}render(e,t,o){this.scene.overrideMaterial=this.materialDepth,e.getClearColor(this._oldClearColor);let r=e.getClearAlpha(),s=e.autoClear;e.autoClear=!1,e.setClearColor(16777215),e.setClearAlpha(1),e.setRenderTarget(this.renderTargetDepth),e.clear(),e.render(this.scene,this.camera),this.uniforms.tColor.value=o.texture,this.uniforms.nearClip.value=this.camera.near,this.uniforms.farClip.value=this.camera.far,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),e.clear(),this.fsQuad.render(e)),this.scene.overrideMaterial=null,e.setClearColor(this._oldClearColor),e.setClearAlpha(r),e.autoClear=s}setSize(e,t){this.materialBokeh.uniforms.aspect.value=e/t,this.renderTargetDepth.setSize(e,t)}dispose(){this.renderTargetDepth.dispose(),this.materialDepth.dispose(),this.materialBokeh.dispose(),this.fsQuad.dispose()}};var Bt={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var xe=class extends w{constructor(){super();let e=Bt;this.uniforms=I.clone(e.uniforms),this.material=new yt({name:e.name,uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader}),this.fsQuad=new F(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,o){this.uniforms.tDiffuse.value=o.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},dt.getTransfer(this._outputColorSpace)===ft&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===at?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===nt?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===lt?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===le?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===ct?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===ut&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};function ze(n=1){let e=new Uint8Array(512),t=n*9301+49297,o=()=>(t=(t*9301+49297)%233280)/233280,r=Array.from({length:256},(i,l)=>l).sort(()=>o()-.5);for(let i=0;i<512;i++)e[i]=r[i&255];let s=(i,l,f)=>(i&1?-l:l)+(i&2?-f:f),c=i=>i*i*i*(i*(i*6-15)+10);return(i,l)=>{let f=Math.floor(i)&255,M=Math.floor(l)&255;i-=Math.floor(i),l-=Math.floor(l);let m=c(i),T=c(l),_=e[f]+M,j=e[f+1]+M,G=s(e[_],i,l)+m*(s(e[j],i-1,l)-s(e[_],i,l)),v=s(e[_+1],i,l-1)+m*(s(e[j+1],i-1,l-1)-s(e[_+1],i,l-1));return G+T*(v-G)}}function ke(n,e,t,o=5){let r=.5,s=1,c=0;for(let i=0;i<o;i++)c+=r*n(e*s,t*s),s*=2.02,r*=.5;return c}function Ft(n,e=1024){let t=document.createElement("canvas");t.width=t.height=e;let o=t.getContext("2d"),r=o.createImageData(e,e),s=ze(7),c=ze(13),i=4/e;for(let f=0;f<e;f++)for(let M=0;M<e;M++){let m=M*i,T=f*i,_=ke(s,m*1.2,T*1.2,6),j=Math.abs(Math.sin((m*1.6+T*.9)*2.4+_*6.5)),G=Math.pow(1-j,22)*.9+Math.pow(1-j,6)*.12,A=16+(ke(c,m*2.5,T*2.5,4)*.5+.5)*14,D=(f*e+M)*4;r.data[D]=Math.min(255,A+G*205),r.data[D+1]=Math.min(255,A*.92+G*182),r.data[D+2]=Math.min(255,A*.82+G*140),r.data[D+3]=255}o.putImageData(r,0,0),o.strokeStyle="rgba(0,0,0,.55)",o.lineWidth=2,o.strokeRect(1,1,e-2,e-2);let l=new Ge(t);return l.colorSpace=re,l.wrapS=l.wrapT=He,l.anisotropy=n.capabilities.getMaxAnisotropy(),l}function Gt(n,e=512){let t=document.createElement("canvas");t.width=t.height=e;let o=t.getContext("2d"),r=o.createImageData(e,e),s=ze(3),c=8/e;for(let l=0;l<e;l++)for(let f=0;f<e;f++){let m=200+(ke(s,f*c,l*c,5)*.5+.5)*55,T=(l*e+f)*4;r.data[T]=m,r.data[T+1]=m*.97,r.data[T+2]=m*.92,r.data[T+3]=255}o.putImageData(r,0,0);let i=new Ge(t);return i.colorSpace=re,i.wrapS=i.wrapT=He,i.repeat.set(3,2),i.anisotropy=n.capabilities.getMaxAnisotropy(),i}var g=11,Q=7.6,C=6.5,K=7,H=3.8,W=3.6;function $t(n,e,t=0){let o=n/2+t,r=new Z;return r.moveTo(-o,0),r.lineTo(-o,e),r.absarc(0,e,o,Math.PI,0,!0),r.lineTo(o,0),r.lineTo(-o,0),r}function eo(){let n=H/2,e=new Z;e.moveTo(-g/2,0),e.lineTo(-n,0),e.lineTo(-n,W),e.absarc(0,W,n,Math.PI,0,!0),e.lineTo(n,0),e.lineTo(g/2,0),e.lineTo(g/2,Q),e.lineTo(-g/2,Q),e.lineTo(-g/2,0);let t=new $(e,{depth:.7,bevelEnabled:!1,curveSegments:48});return t.translate(0,0,-.35),t}function to(n,e){let t=H/2+n,o=H/2+e,r=new Z;return r.moveTo(-o,0),r.lineTo(-o,W),r.absarc(0,W,o,Math.PI,0,!0),r.lineTo(o,0),r.lineTo(t,0),r.lineTo(t,W),r.absarc(0,W,t,0,Math.PI,!1),r.lineTo(-t,0),r.lineTo(-o,0),r}function oo(){let n=[],e=[{o:0,w:.18,d:.92},{o:.18,w:.12,d:.84},{o:.3,w:.08,d:.98}];for(let r of e){let s=new $(to(r.o,r.o+r.w),{depth:r.d,bevelEnabled:!0,bevelThickness:.025,bevelSize:.02,bevelSegments:3,curveSegments:64});s.translate(0,0,-r.d/2),n.push(s.index?s.toNonIndexed():s)}let t=new Z;t.moveTo(-.22,0),t.lineTo(.22,0),t.lineTo(.32,.62),t.lineTo(-.32,.62),t.lineTo(-.22,0);let o=new $(t,{depth:1.06,bevelEnabled:!0,bevelThickness:.03,bevelSize:.03,bevelSegments:3});return o.translate(0,W+H/2-.05,-.53),n.push(o.index?o.toNonIndexed():o),Ht(n)}function Te(n,e,t=.09){let o=new Z;o.moveTo(-n/2,-e/2),o.lineTo(n/2,-e/2),o.lineTo(n/2,e/2),o.lineTo(-n/2,e/2),o.lineTo(-n/2,-e/2);let r=new bt,s=n/2-t,c=e/2-t;r.moveTo(-s,-c),r.lineTo(-s,c),r.lineTo(s,c),r.lineTo(s,-c),r.lineTo(-s,-c),o.holes.push(r);let i=new $(o,{depth:.04,bevelEnabled:!0,bevelThickness:.025,bevelSize:.025,bevelSegments:2});return i.index?i.toNonIndexed():i}function ro(){let n=[],e=(o,r)=>n.push(new b(o,r));e(0,0),e(.46,0),e(.46,.14),e(.4,.16);for(let o=0;o<=8;o++){let r=-Math.PI/2+o/8*Math.PI;e(.36+Math.cos(r)*.07,.24+Math.sin(r)*.07)}e(.31,.34),e(.3,.42);for(let o=0;o<=12;o++){let r=o/12;e(.3-.04*r*r,.42+r*4.2)}e(.27,4.66),e(.3,4.7);for(let o=0;o<=8;o++){let r=o/8*(Math.PI/2);e(.3+Math.sin(r)*.14,4.7+(1-Math.cos(r))*.16)}return e(.46,4.9),e(.46,5.04),e(0,5.04),new wt(n,48)}function so(){let n=new Z;n.moveTo(0,0),n.lineTo(.05,0),n.quadraticCurveTo(.1,.1,.2,.12),n.lineTo(.22,.2),n.bezierCurveTo(.34,.22,.32,.38,.46,.42),n.lineTo(.48,.5),n.lineTo(0,.5),n.lineTo(0,0);let e=C*(K+2),t=new $(n,{depth:e,bevelEnabled:!1,curveSegments:12});return t.translate(0,0,-e+C*1.5),t}function io(){return new P({transparent:!0,depthWrite:!1,blending:oe,uniforms:{uTime:{value:0},uPx:{value:1}},vertexShader:`
      uniform float uTime; uniform float uPx;
      attribute float aSeed;
      varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*0.15 + aSeed*12.0)*0.35;
        p.y += mod(uTime*0.06*(0.4+aSeed) + aSeed*10.0, 7.0) - 3.5 + 3.6;
        p.z += cos(uTime*0.1 + aSeed*7.0)*0.3;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.2*uPx*(0.5+aSeed*1.5)) * (6.0 / max(-mv.z, 1.5));
        vA = smoothstep(26.0, 2.0, -mv.z) * (0.35 + 0.65*fract(aSeed*91.7));
      }`,fragmentShader:`
      varying float vA;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.0,d);
        gl_FragColor = vec4(1.0,0.86,0.62, a*a*vA*0.75);
      }`})}function ao(){return new P({transparent:!0,depthWrite:!1,blending:oe,side:De,uniforms:{uTime:{value:0},uOpacity:{value:.22}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",fragmentShader:`
      uniform float uTime; uniform float uOpacity; varying vec2 vUv;
      void main(){
        float edge = smoothstep(0.0,0.35,vUv.x)*smoothstep(1.0,0.65,vUv.x);
        float fall = pow(vUv.y, 1.6);
        float flick = 0.85 + 0.15*sin(uTime*0.7 + vUv.x*9.0);
        gl_FragColor = vec4(1.0,0.84,0.58, edge*fall*flick*uOpacity);
      }`})}function $o(n){let e=st(),t=new xt({canvas:n,antialias:e.tier!=="high",powerPreference:"high-performance",alpha:!1});t.setPixelRatio(e.dpr),t.outputColorSpace=re,t.toneMapping=le,t.toneMappingExposure=1.05,t.shadowMap.enabled=e.shadows,t.shadowMap.type=it;let o=new Et;o.background=new y(789258),o.fog=new Tt(854793,.05);let s=new vt(t).fromScene(new Dt,.04).texture;o.environment=s,o.environmentIntensity=.22;let c=new pt(50,1,.1,120),i=Gt(t),l=new ee({color:12167568,roughness:.92,metalness:0,bumpMap:i,bumpScale:.25}),f=new ee({color:15129286,roughness:.55,metalness:0}),M=f.clone();M.side=De;let m=new Ie({color:15524562,roughness:.32,clearcoat:.4,clearcoatRoughness:.4}),T=Ft(t,e.tier==="high"?1024:512),_=new Ie({color:16777215,map:T,roughness:.14,metalness:0,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.4}),j=new ee({color:2761758,roughness:.9}),G=new ee({color:13214828,roughness:.28,metalness:1}),v=new ue;o.add(v);let A=C*(K+4),D=new d(new J(g,A),_);D.rotation.x=-Math.PI/2,D.position.z=-A/2+C*2,D.receiveShadow=!0,v.add(D),T.repeat.set(1.4,A/g*1.4);let Ee=new d(new J(g,A),j);Ee.rotation.x=Math.PI/2,Ee.position.set(0,Q,D.position.z),v.add(Ee);let Oe=g/2-H/2-1.7,It=Te(Oe-.25,3.9),Nt=Te(Oe-.25,1.5),Lt=Te(C-1.6,3.6),zt=Te(C-1.6,1.3),kt=new J(A,Q);for(let a of[-1,1]){let h=new d(kt,l);h.rotation.y=a*-Math.PI/2,h.position.set(a*g/2,Q/2,D.position.z),h.receiveShadow=!0,v.add(h);let u=new d(so(),a>0?M:f);u.scale.x=a>0?-1:1,u.position.set(a*g/2,Q-.5,0),v.add(u);let x=new d(new Y(.08,.3,A),f);x.position.set(a*(g/2-.04),.15,D.position.z),v.add(x);for(let E=-1;E<K;E++){let X=-E*C-C/2,L=new d(Lt,f);L.rotation.y=a*-Math.PI/2,L.position.set(a*(g/2-.02),2.35,X),v.add(L);let U=new d(zt,f);U.rotation.y=a*-Math.PI/2,U.position.set(a*(g/2-.02),5.6,X),v.add(U)}}let Ot=eo(),Vt=oo(),Qt=ro(),Wt=[];for(let a=0;a<K;a++){let h=-a*C,u=new ue;u.position.z=h;let x=new d(Ot,l);x.castShadow=e.shadows,x.receiveShadow=!0,u.add(x);let E=new d(Vt,f);E.castShadow=e.shadows,E.receiveShadow=!0,u.add(E);for(let U of[-1,1]){let R=new d(Qt,m);R.position.set(U*(H/2+.95),0,.62),R.scale.setScalar(1.06),R.castShadow=e.shadows,R.receiveShadow=!0,u.add(R);let z=new d(new Y(1.1,.34,.5),f);z.position.set(U*(H/2+.95),5.52,.62),z.castShadow=e.shadows,u.add(z)}let X=g/2-H/2-1.7;for(let U of[1,-1])for(let R of[-1,1]){let z=R*(H/2+1.7+X/2),ot=new d(It,f);ot.position.set(z,2.55,U*.36),u.add(ot);let rt=new d(Nt,f);rt.position.set(z,5.75,U*.36),u.add(rt)}let L=new d(new Y(H+1.2,.006,.05),G);L.position.set(0,.004,.55),u.add(L),v.add(u),Wt.push(u)}let N=-K*C+1.2,jt=new St($t(H*1.15,W*1.05),64),Ve=new se({color:new y(1,.82,.58).multiplyScalar(3.2),toneMapped:!0}),Qe=new d(jt,Ve);Qe.position.set(0,0,N-.6),v.add(Qe);let Me=new ue,We=new ee({color:1775121,roughness:.6});for(let a of[-.75,.75]){let h=new d(new Y(.06,6.3,.06),We);h.position.set(a,3.1,N-.5),Me.add(h)}for(let a of[1.6,3.2,4.6]){let h=new d(new Y(H*1.2,.06,.06),We);h.position.set(0,a,N-.5),Me.add(h)}v.add(Me);let je=new d(new J(g,Q),l);je.position.set(0,Q/2,N-.62),v.add(je);let be=ao(),Xt=[];for(let a=0;a<0;a++){let u=new J(1.4+a*.4,26,1,1);u.translate(0,-26/2,0);let x=new d(u,be);x.position.set(-1.2+a*.8,5.6,N-.4),x.rotation.x=-1.32-a*.03,x.rotation.z=.06*(a-1.5),v.add(x),Xt.push(x)}let we=e.tier==="low"?500:1400,ae=new Float32Array(we*3),Xe=new Float32Array(we);for(let a=0;a<we;a++)ae[a*3]=(Math.random()-.5)*g*.9,ae[a*3+1]=0,ae[a*3+2]=4-Math.random()*(K*C+2),Xe[a]=Math.random();let Ce=new ce;Ce.setAttribute("position",new Be(ae,3)),Ce.setAttribute("aSeed",new Be(Xe,1));let Se=io();Se.uniforms.uPx.value=t.getPixelRatio();let Ze=new Mt(Ce,Se);Ze.frustumCulled=!1,v.add(Ze),o.add(new Pt(16771012,1709070,.1));let S=new _t(16766362,2.4);S.position.set(2.5,8,N-6),S.target.position.set(-1,0,4),S.castShadow=e.shadows,S.shadow.mapSize.set(e.tier==="high"?2048:1024,e.tier==="high"?2048:1024),S.shadow.camera.left=-8,S.shadow.camera.right=8,S.shadow.camera.top=10,S.shadow.camera.bottom=-10,S.shadow.camera.near=1,S.shadow.camera.far=70,S.shadow.bias=-4e-4,S.shadow.normalBias=.03,o.add(S,S.target);let Re=[];for(let a=0;a<K;a++)for(let h of[-1,1]){let u=new Ne(16756842,3.2,6.5,2);u.position.set(h*(g/2-.9),3.4,-a*C+C/2),v.add(u),Re.push(u);let x=new d(new Rt(.09,16,12),new se({color:new y(1,.75,.45).multiplyScalar(4)}));x.position.copy(u.position).setX(h*(g/2-.18)),v.add(x);let E=new d(new Ct(.015,.015,.4,8),G);E.rotation.z=Math.PI/2,E.position.copy(x.position).setX(h*(g/2-.05)),v.add(E)}let ye=new Ne(16763018,18,22,1.8);ye.position.set(0,3.2,N+1.5),v.add(ye);let B=null,q=null,Ke=null;e.post&&(B=new me(t),B.addPass(new ve(o,c)),Ke=new te(new b(256,256),.38,.55,.85),B.addPass(Ke),e.dof&&(q=new ge(o,c,{focus:9,aperture:.0016,maxblur:.006}),B.addPass(q)),B.addPass(new xe));let p={progress:0,target:0,mx:0,my:0,tmx:0,tmy:0,intro:0,visible:!0},Zt=9.5,Kt=N+11.5,qe=new V;function Pe(){let a=n.clientWidth,h=n.clientHeight;t.setSize(a,h,!1),c.aspect=a/h,c.fov=a/h<.8?66:a/h<1.2?58:50,c.updateProjectionMatrix(),B&&(B.setSize(a,h),B.setPixelRatio(t.getPixelRatio()))}Pe(),window.addEventListener("resize",Pe),window.addEventListener("pointermove",a=>{p.tmx=a.clientX/window.innerWidth*2-1,p.tmy=a.clientY/window.innerHeight*2-1},{passive:!0}),new IntersectionObserver(([a])=>{p.visible=a.isIntersecting},{rootMargin:"100px"}).observe(n);let Ye=a=>a<.5?4*a*a*a:1-Math.pow(-2*a+2,3)/2,Je=new he,_e=0,$e=0,et=!1;function tt(){if(requestAnimationFrame(tt),window.__mgPaused)return;let a=Math.min(Je.getDelta(),.05),h=Je.elapsedTime;if(!p.visible)return;!et&&h>1.5&&h<6&&(_e++,$e+=a,_e>90&&$e/_e>1/38&&(et=!0,q&&(q.enabled=!1),t.setPixelRatio(Math.max(1,t.getPixelRatio()*.75)),Pe())),p.progress+=(p.target-p.progress)*Math.min(1,a*4.5),p.mx+=(p.tmx-p.mx)*Math.min(1,a*3),p.my+=(p.tmy-p.my)*Math.min(1,a*3),p.intro=Math.min(1,p.intro+a*.35);let u=p.progress,x=Ye(p.intro),E=Ae.lerp(Zt+(1-x)*5,Kt,Ye(Math.min(1,u*1.02))),X=Math.sin(u*Math.PI*2.2)*.9*(1-u*.6),L=X+p.mx*.55,U=1.75+Math.sin(h*.6)*.04-p.my*.25+(1-x)*.8+Math.sin(u*Math.PI)*.35;if(c.position.set(L,U,E),qe.set(-X*.4+p.mx*.3,2.35-p.my*.15,E-8),c.lookAt(qe),c.rotation.z+=Math.cos(u*Math.PI*2.2)*.025+p.mx*-.01,q){let R=Math.ceil(-(E-.6)/C),z=-Math.max(0,R)*C;q.uniforms.focus.value=Ae.clamp(E-z,2,30)}Se.uniforms.uTime.value=h,be.uniforms.uTime.value=h,be.uniforms.uOpacity.value=.07+.06*u,Ve.color.setRGB(1,.82,.58).multiplyScalar(1.05+u*.25),ye.intensity=14+u*16;for(let R=0;R<Re.length;R++)Re[R].intensity=3.1+Math.sin(h*2.3+R*1.7)*.18;B?B.render(a):t.render(o,c)}return requestAnimationFrame(tt),{setProgress(a){p.target=a},compileAsync:()=>t.compileAsync?t.compileAsync(o,c):Promise.resolve()}}export{$o as initHero};
