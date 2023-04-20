var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
if (canvas.width > 2.5 * canvas.height) {
  canvas.width = canvas.height;
}
var gl = canvas.getContext("webgl");
var menuOpen = false;
canvas.addEventListener("click", function(ev) {
  generateOptions(Math.random() > .75);/*75% of the time, stick with a safer preset expression, otherwise generate random combinator*/
});
var myoptions;
var data = document.getElementById("controls");
var modes = [ "multiply", "divide", "add", "subtract", "flip divide", "flip subtract"];
var operators = ["add", "subtract", "multiply", "divide"];
var functions = ["none", "sine", "tan"];
var primaryColors = ["#000000","#ffffff","#ff0000","#00ff00","#0000ff","#ff00ff","#00ffff","#ffff00","#ff6600","#7f00ff","#808080","#800000","#808000","#008000","#800080","#008080","#000080" ];
var hueColors = primaryColors.filter(c => c != "#000000" && c != "#ffffff");
var timeFunctions = ["none", "sine", "sine + cos"];
var gui;
var time = 0.0;
/*safer combinations of the colors and shapes that don't produce lots of black screens (unlike the randomly generated ones):*/
var presets = [
  { numerator:"s1+s2/s4", denominator:"s4-s1-s2+s3"},
  { numerator:"s1+s2/s4", denominator:"s4-s1-col2+col3"},
  { numerator:"s2*col2-col3", denominator:"s4+s3*s1"},
  { numerator:"col2 + col1", denominator:"s4+s3*s1"}
];
var panelExpressions = [
  "col1+col2+col3",
  "s1+s2+s3",
  "s1*col1+s2*col2+s3*col3"
]

/*INIT*/
window.addEventListener("resize", onWindowResize, false);
generateOptions(false);
draw();
/*END INIT*/

function generateOptions(randomMode) {
  myoptions = new Options(randomMode);
  generateWEBGL();
  genGui();
}

function Options(randomMode) {

  let preset = pick(presets);
  this.numerator = randomMode ? combinator(getRandomInt(1, 5)) : preset.numerator; 
  this.denominator = randomMode ? combinator(getRandomInt(1, 5)) : preset.denominator;
  this.panel = pick(panelExpressions);

  this.colorMode = pick(modes);

  this.color1 = tinycolor.random().toHexString();
  /*(if we're using a randomly generated color expression, use only random colors (safer, less zeros)):*/
  this.color2 = !randomMode && Math.random() > 0.75 ? pick(hueColors) : tinycolor.random().toHexString();
  this.color3 = !randomMode && Math.random() > 0.75 ? pick(primaryColors) : tinycolor.random().toHexString();
  this.rotation = getRandomInt(-10, 10);
  this.theta = getRandomInt(-12, 12);
  this.time = Math.random() * 0.03 - 0.015;
  this.timeFunc = Math.random() > 0.33 ? "none" : pick(timeFunctions);
  this.distanceModifier = getRandomFloat(-2, 2);

  this.periodicMultiplier = Math.random() < 0.25 ? 0 : getRandomInt(0, 10);
  this.motionIterations = getRandomInt(0, 3);
  this.motionMultiplier = getRandomFloat(0, 10);
  this.iterationMotion1 = Math.random() > 0.5;
  this.iterationMotion2 = Math.random() > 0.5;

  this.colorOperator1 = pick(operators);
  this.colorOperator2 = pick(operators);

  this.motionOperator1 = pick(operators);
  this.motionOperator2 = pick(operators);

  this.thetaFunc = Math.random() > 0.25 ? pick(["none", "sine"]) : pick(functions); /*tangent only sometimes*/
  this.pixelation = Math.random() > 0.75 ? getRandomInt(10, 300) : 0;
  this.planetEffect = Math.random()>.5;
  this.innerRadius = getRandomFloat(0,.5);
  this.outerRadius = getRandomFloat(0, this.innerRadius);

}

function genGui() {
  setValue();
  let wasClosed = !gui || gui.closed;
  gui && gui.destroy();
  gui = new dat.GUI();
  if (wasClosed) gui.close();

  gui.addColor(myoptions, "color1").onChange(setValue);
  gui.addColor(myoptions, "color2").onChange(setValue);
  gui.addColor(myoptions, "color3").onChange(setValue);

  gui.add(myoptions, "numerator").onFinishChange(numeratorChanged);
  gui.add(myoptions, "denominator").onFinishChange(numeratorChanged);
  gui.add(myoptions, "colorMode", modes).onChange(setValue);
  gui.add(myoptions, "panel").onFinishChange(setValue);

  gui.add(myoptions, "colorOperator1", operators).onChange(setValue);
  gui.add(myoptions, "colorOperator2", operators).onChange(setValue);
  gui.add(myoptions, "planetEffect").onChange(setValue);
  gui.add(myoptions, "innerRadius", 0.0, 1.0).onChange(setValue);
  gui.add(myoptions, "outerRadius", 0.0, 1.0).onChange(setValue);

  gui.add(myoptions, "time", -0.015, 0.015).onChange(setValue);
  gui.add(myoptions, "timeFunc", timeFunctions).onChange(setValue);
  gui.add(myoptions, "distanceModifier", -2, 2).onChange(setValue);

  gui.add(myoptions, "rotation", -10, 10).onChange(setValue);
  gui.add(myoptions, "theta", -12, 12).onChange(setValue);
  gui.add(myoptions, "thetaFunc", functions).onChange(setValue);
  gui.add(myoptions, "periodicMultiplier", 0, 20).onChange(setValue);

  gui.add(myoptions, "motionMultiplier", 0.0, 30.0).onChange(setValue);
  gui.add(myoptions, "motionIterations", 0, 10).onChange(setValue);
  gui.add(myoptions, "iterationMotion1").onChange(setValue);
  gui.add(myoptions, "iterationMotion2").onChange(setValue);
  gui.add(myoptions, "motionOperator1", operators).onChange(setValue);
  gui.add(myoptions, "motionOperator2", operators).onChange(setValue);
  gui.add(myoptions, "pixelation", 0, 300).onChange(setValue);

}

function numeratorChanged() {
  generateWEBGL();
  genGui();
}

function setValue() {
  /*send the control panel values to webGL*/
  time = 0.0;
  var col1 = tinycolor(myoptions.color1);
  col1.red = col1._r / 255;
  col1.green = col1._g / 255;
  col1.blue = col1._b / 255;
  var col2 = tinycolor(myoptions.color2);
  col2.red = col2._r / 255;
  col2.green = col2._g / 255;
  col2.blue = col2._b / 255;
  var col3 = tinycolor(myoptions.color3);
  col3.red = col3._r / 255;
  col3.green = col3._g / 255;
  col3.blue = col3._b / 255;
  
  gl.uniform3f(getUniformLocation(program, "color1"), col1.red, col1.green, col1.blue);
  gl.uniform3f(getUniformLocation(program, "color2"), col2.red, col2.green, col2.blue);
  gl.uniform3f(getUniformLocation(program, "color3"), col3.red, col3.green, col3.blue);
  gl.uniform1i(getUniformLocation(program, "colorMode"), modes.indexOf(myoptions.colorMode));
  gl.uniform1i(getUniformLocation(program, "colorOperator1"), operators.indexOf(myoptions.colorOperator1));
  gl.uniform1i(getUniformLocation(program, "colorOperator2"), operators.indexOf(myoptions.colorOperator2));

  gl.uniform1f(getUniformLocation(program, "motionMultiplier"), myoptions.motionMultiplier);
  gl.uniform1f(getUniformLocation(program, "motionIterations"), myoptions.motionIterations);
  gl.uniform1f(getUniformLocation(program, "iterationMotion1"), myoptions.iterationMotion1);
  gl.uniform1f(getUniformLocation(program, "iterationMotion2"), myoptions.iterationMotion2);
  gl.uniform1i(getUniformLocation(program, "motionOperator1"), operators.indexOf(myoptions.motionOperator1));
  gl.uniform1i(getUniformLocation(program, "motionOperator2"), operators.indexOf(myoptions.motionOperator2));
  
  gl.uniform1f(getUniformLocation(program, "rotation"), myoptions.rotation);
  gl.uniform1f(getUniformLocation(program, "thetaM"), parseInt(myoptions.theta));/*theta multiplier*/
  gl.uniform1i(getUniformLocation(program, "thetaFunc"), functions.indexOf(myoptions.thetaFunc));
  gl.uniform1f(getUniformLocation(program, "periodicMultiplier"),  myoptions.periodicMultiplier);
  gl.uniform1i(getUniformLocation(program, "timeFunc"), timeFunctions.indexOf(myoptions.timeFunc));
  gl.uniform1f(getUniformLocation(program, "distanceModifier"), myoptions.distanceModifier);
  gl.uniform1f(getUniformLocation(program, "pixelation"), myoptions.pixelation);
  gl.uniform1f(getUniformLocation(program, "planetEffect"), myoptions.planetEffect);
  gl.uniform1f(getUniformLocation(program, "innerRadius"), myoptions.innerRadius);
  gl.uniform1f(getUniformLocation(program, "outerRadius"), myoptions.outerRadius);


}

//************** Shader sources **************
function vertex() {
  return `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
  `;
}

function fragment(numerator, denominator, panel) {
  var fragmentSource = `
#define PI 3.14159265358979323846
precision highp float;

/*new shit*/
uniform int colorMode;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float rotation;
uniform float thetaM;
uniform int thetaFunc;
uniform float motionMultiplier;
uniform float motionIterations;
uniform bool iterationMotion1;
uniform bool iterationMotion2;
uniform int colorOperator1;
uniform int colorOperator2;
uniform int motionOperator1;
uniform int motionOperator2;
uniform float periodicMultiplier;
uniform int timeFunc;
uniform float distanceModifier;
uniform float pixelation;
uniform bool planetEffect;
uniform float innerRadius;
uniform float outerRadius;

uniform float width;
uniform float height;
vec2 resolution = vec2(width, height);
uniform float time;

vec2 rotate(vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle)) * _st;
    _st.y += 0.5;
		_st.x += .5;
    return _st;
}

void main(){

	//set up positions and time
  vec2 uv = gl_FragCoord.xy/resolution.xy;
	float t = mod(time, 20.0);
  vec2 pos = uv;
  pos = vec2(0.5, 0.5)-pos;

  if(pixelation>0.0){
    uv = fract(uv*pixelation);
  }
  //calculate distances and angles
  float d = length(pos);/*distance from center*/
  float id = distanceModifier - d;/*inverse distance, greater near the center*/
  float theta = -(atan(pos.y, pos.x));
  float rot = rotation + (id+1.0);

  rot *= timeFunc == 0 ? t :
         timeFunc == 1 ? sin(t/4.0) :
         (.5*sin(t/3.0)+.5*cos(t/4.0));

  rot = thetaFunc == 0 ? rot + (thetaM*theta) :
        thetaFunc == 1 ? rot + sin(thetaM*theta) :
        rot +  tan(thetaM*theta);
   
  //rotate both positions
  pos = rotate(pos, rot);
  uv = rotate(uv, rot);

  vec3 col1 = color1;
  vec3 col2 = color2;
  vec3 col3 = color3;

	//motionIterations:  using color1 and color2 inside these loops
  float m = motionMultiplier;
  for(float i = 1.0; i < 30.0; i+=1.0){ 
		  if(i<motionIterations){
        uv.x += m*col2.x*(cos(t+id*i)*uv.y*uv.x);
        if(iterationMotion1) {
            float firstArg = m/2.0*col2.y*(cos(t*col2.z)/d*i);
            uv  = motionOperator1 == 0 ? uv + firstArg: 
            motionOperator1 == 1 ? uv - firstArg : 
            motionOperator1 == 2 ? uv * firstArg : 
            uv / firstArg;
        }
        pos.y += m*col1.x*(sin(t+2.0*i));
        if(iterationMotion2) {
            float secondArg = (m/2.0*col1.y*col1.z*(sin(t)/d*i));
            pos = motionOperator2 == 0 ? pos + secondArg : 
            motionOperator2 == 1 ? pos - secondArg : 
            motionOperator2 == 2 ? pos * secondArg : 
            pos / secondArg;
        }
      }  
   }
	
	//shapes
  vec3 s1 = ((col1.z-col1.y))*col1.x*(cos(rot+id*abs(pos.xyx)/(col1)));
  vec3 s2 = (col2.x-col2.y)*col2.z*cos(id*abs(uv.xyx)/(col2));
  vec3 s3 = (col3.z-col3.x)*col3.y*sin(+d+rot+uv.xyx+pos.xyx);
  
  //for shapes 1 and 2, combine with distance/inverseDistance
  float dArg = planetEffect ? smoothstep(innerRadius,outerRadius, d) : d;
s1 = colorOperator1 == 0 ? s1+dArg :
    colorOperator1 == 1 ? s1-dArg :
    colorOperator1 == 2 ? s1*dArg :
    s1/dArg; 
s2 = colorOperator2 == 0 ? s2+dArg :
    colorOperator2 == 1 ? s2-dArg :
    colorOperator2 == 2 ? s2*dArg :
    s2/dArg;

  float arg = (d+rot+uv.x);
	vec3 s4 = mix(s1, s2, col3/cos(arg*periodicMultiplier));

  vec4 panel = vec4(((${panel})/3.0),1.0);
  vec4 thing = vec4((${numerator})/(${denominator}),1.0);

  gl_FragColor = colorMode == 0 ? panel * thing : 
                 colorMode == 1 ? panel / thing : 
                 colorMode == 2 ? panel + thing :
                 colorMode == 3 ? panel - thing :
                 colorMode == 4 ? thing / panel :
                 thing - panel;
}
`;
  return fragmentSource;
}

function onWindowResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (canvas.width > 2.5 * canvas.height) {
    canvas.width = canvas.height;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform1f(widthHandle, canvas.width);
  gl.uniform1f(heightHandle, canvas.height);
}

/*GENERATE AND DRAW*/
var widthHandle, heightHandle, timeHandle, program;

function generateWEBGL() {
  //Create vertex and fragment shaders
  var vertexShader = compileShader(vertex(), gl.VERTEX_SHADER);
  var fragmentShader = compileShader(
    fragment(myoptions.numerator, myoptions.denominator, myoptions.panel),
    gl.FRAGMENT_SHADER
  );

  //Create shader programs
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.useProgram(program);

  //Set up rectangle covering entire canvas
  var vertexData = new Float32Array([
    -1.0,
    1.0, // top left
    -1.0,
    -1.0, // bottom left
    1.0,
    1.0, // top right
    1.0,
    -1.0 // bottom right
  ]);

  //Create vertex buffer
  var vertexDataBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

  // Layout of our data in the vertex buffer
  var positionHandle = getAttribLocation(program, "position");

  gl.enableVertexAttribArray(positionHandle);
  gl.vertexAttribPointer(
    positionHandle,
    2, // position is a vec2 (2 values per component)
    gl.FLOAT, // each component is a float
    false, // don't normalize values
    2 * 4, // two 4 byte float components per vertex (32 bit float is 4 bytes)
    0 // how many bytes inside the buffer to start from
  );

  //Set uniform handle
  timeHandle = getUniformLocation(program, "time");
  widthHandle = getUniformLocation(program, "width");
  heightHandle = getUniformLocation(program, "height");
  gl.uniform1f(widthHandle, canvas.width);
  gl.uniform1f(heightHandle, canvas.height);
}

/*DRAW function*/
function draw() {
  //Update time
  time += myoptions.time;
  //Send uniforms to program
  gl.uniform1f(timeHandle, time);
  //Draw a triangle strip connecting vertices 0-4
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(draw);
}

/*HELPERS*/
function compileShader(shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
  }
  return shader;
}

function getAttribLocation(program, name) {
  var attributeLocation = gl.getAttribLocation(program, name);
  if (attributeLocation === -1) {
    throw "Cannot find attribute " + name + ".";
  }
  return attributeLocation;
}

function getUniformLocation(program, name) {
  var attributeLocation = gl.getUniformLocation(program, name);
  if (attributeLocation === -1) {
    throw "Cannot find uniform " + name + ".";
  }
  return attributeLocation;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function combinator(numTerms) {
  /*returns an expression like `col2*col3-col1`*/
  let options = ["s1", "s2", "s3", "s4", "col1", "col2", "col3"];
  let ops = ["+", "-", "+", "+", "-", "*", "/"];
  var result, lastPick;
  if (numTerms == 1) {
    result = pick(options);
  } else {
    lastPick = pick(options);
    result = lastPick + " " + pick(ops);
    lastPick = pick(options.filter(o => o != lastPick));
    result += " " + lastPick;
    for (let i = 2; i < numTerms; i++) {
      lastPick = pick(options.filter(o => o != lastPick));
      result += ` ${pick(ops)} ${lastPick} `;
    }
  }
  return result;
}