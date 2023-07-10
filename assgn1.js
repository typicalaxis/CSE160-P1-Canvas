// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  `attribute vec4 a_Position;
   uniform float uSize;
   void main() {
    gl_Position = a_Position;
    gl_PointSize = uSize;
   }`

// Fragment shader program
var FSHADER_SOURCE =
 `precision mediump float;
  uniform vec4 u_FragColor;  
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedSegments = 10;
let g_selectedType = POINT;
let pic_dis = false;
let game_mode = false;
let gameInt;
let pongVect = [0.05,0.1];
let pongCoord = [0,0];
let paddleCoord = [0,0];
let pingCoord = [0,0];
let pScore;
let bScore;



function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true})
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
}
function setUpHtmlUI(){
    document.getElementById("redSlide").addEventListener("mouseup",function(){g_selectedColor[0] = this.value/100;});
    document.getElementById("greenSlide").addEventListener("mouseup",function(){g_selectedColor[1] = this.value/100;});
    document.getElementById("blueSlide").addEventListener("mouseup",function(){g_selectedColor[2] = this.value/100;});

    document.getElementById("sizeSlide").addEventListener("mouseup",function(){g_selectedSize = this.value;});
    document.getElementById("segSlide").addEventListener("mouseup",function(){g_selectedSegments = this.value;});

    document.getElementById("clearButton").onclick = function(){g_shapesList = []; pic_dis = false; game_mode = false; renderAllShapes();clearInterval(gameInt);};

    document.getElementById("pointButton").onclick = function(){g_selectedType = POINT;};
    document.getElementById("triangleButton").onclick = function(){g_selectedType = TRIANGLE};
    document.getElementById("circleButton").onclick = function(){g_selectedType = CIRCLE};

    document.getElementById("picButton").onclick = function(){g_shapesList = []; pic_dis = true; game_mode = false; renderAllShapes(); drawPicture();};
    document.getElementById("gameButton").onclick = function(){g_shapesList = []; pic_dis = false;  renderAllShapes(); startGame();};
    document.getElementById("endButton").onclick = function(){g_shapesList = []; game_mode = false; renderAllShapes(); clearInterval(gameInt);};
}
function startGame(){
    if(game_mode == false){
        gameInt = setInterval(playGame, 150);
        game_mode = true;
        pongVect = [0.05,0.1];
        pongCoord = [0,0];
        paddleCoord = [0,-0.95];
        pingCoord = [0,0.95];
        pScore = 0;
        bScore = 0;
    }
}
function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    // Get the storage location of uSize
    u_Size = gl.getUniformLocation(gl.program, 'uSize');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    setUpHtmlUI();
    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev){if(ev.buttons == 1){click(ev)}};

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}


var g_shapesList = [];

//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = [];
function click(ev) {
    [x,y] = convertCoordinatesEventToGL(ev);
    if(game_mode){
        paddleCoord = [x,-0.95];
    }
    else{
        let point;
        if(g_selectedType == POINT){
            point = new Point();
        }
        else if(g_selectedType == CIRCLE){
            point = new Circle();
            point.segments = g_selectedSegments;
        }
        else{
            point = new Triangle();
        }
        point.position = [x,y];
        point.color = g_selectedColor.slice();
        point.size = g_selectedSize;
        g_shapesList.push(point);
        renderAllShapes();
    }
    
    
}

function renderAllShapes(){
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    if(pic_dis){
        drawPicture();
    }
    var len = g_shapesList.length;
    for(var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }
    
}
function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();


    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}
function drawPicture(){
    var centerX = canvas.width/2; 
    var centerY = canvas.height/2;
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 1.0);
    // Pass the size of a point to uSize variable
    gl.uniform1f(u_Size, g_selectedSize);
    //body
    drawTriangle([-0.45, 0, 0.15, 0, 0.15, 0.1]);
    drawTriangle([-0.45, 0, 0.15, 0, 0.15, -0.25]);
    drawTriangle([0.15, 0.1, 0.15, -0.1, 0.25, -0.1]);
    drawTriangle([0.15, -0.1, 0.15, -0.25, 0.25, -0.1]);
    //teeth
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    drawTriangle([0.55,0.25, 0.575,0.15, 0.60,0.25]);
    drawTriangle([0.5,0.05, 0.525,0.15, 0.55,0.05]);

    //head
    gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 1.0);
    drawTriangle([0.05,0.15, 0.25,0, 0.25,0.15]);
    drawTriangle([0.05,0.15, 0.1,0.15, 0.1,0.25]);
    drawTriangle([0.1,0.15, 0.1,0.25, 0.25,0.15]);
    drawTriangle([0.1,0.25, 0.25,0.15, 0.25,0.25]);
    drawTriangle([0.1,0.25, 0.25,0.35, 0.25,0.25]);
    drawTriangle([0.65,0.25, 0.25,0.35, 0.25,0.25]);
    drawTriangle([0.65,0.25, 0.25,0.15, 0.25,0.25]);
    drawTriangle([0.65,0.05, 0.25,0.15, 0.25,0.05]);
    drawTriangle([0.65,0.05, 0.25,0, 0.25,0.05]);
    
    //leg
    drawTriangle([-0.35,0, -0.35,-0.25, 0,-0.25]);
    drawTriangle([-0.15,-0.5, -0.15,-0.25, 0,-0.25]);
    drawTriangle([-0.15,-0.5, -0.15,-0.55, 0.05,-0.55]);
    drawTriangle([-0.15,-0.5, -0.15,-0.55, -0.2,-0.55]);

    //tail
    drawTriangle([-0.9,0, -0.15,0.05, -0.15,0]);
    drawTriangle([-0.9,0, -0.15,-0.1, -0.15,0]);


    //eye
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
    drawTriangle([0.3,0.3, 0.35,0.3, 0.325,0.25]);

    
}
function playGame(){
    if(pongCoord[0]+pongVect[0] >= 1 || pongCoord[0]+pongVect[0] <= -1){
        pongVect[0] = pongVect[0] *-1.1;
    }
    if(pongCoord[1]+pongVect[1] > 1 ){
        pScore = pScore + 1;
        pongVect = [0.05,0.1];
        pongCoord = [0,0];
        paddleCoord = [0,-0.95];
        pingCoord = [0,0.95];
    }
    else if(pongCoord[1]+pongVect[1] <= -1){
        bScore = bScore + 1;
        pongVect = [0.05,0.1];
        pongCoord = [0,0];
        paddleCoord = [0,-0.95];
        pingCoord = [0,0.95];
    }

    if(pongCoord[0]+pongVect[0] >= paddleCoord[0]-0.2 && pongCoord[0]+pongVect[0] <= paddleCoord[0]+0.2 && pongCoord[1]+pongVect[1] <= -0.9){
        pongVect[1] = pongVect[1] *-1.01;
    }
    if(pongCoord[0]+pongVect[0] >= pingCoord[0]-0.2 && pongCoord[0]+pongVect[0] <= pingCoord[0]+0.2 && pongCoord[1]+pongVect[1] >= 0.9){
        pongVect[1] = pongVect[1] *-1.01;
    }
    

    pongCoord[0] = pongCoord[0]+pongVect[0];
    pongCoord[1] = pongCoord[1]+pongVect[1];
    g_shapesList = []; 
    let point = new Point();
    point.position = pongCoord;
    point.color = g_selectedColor.slice();
    point.size = 10;
    g_shapesList.push(point);

    let pad = new pong();
    pad.position = paddleCoord;
    pad.color = g_selectedColor.slice();
    pad.size = 35;
    g_shapesList.push(pad);

    pingCoord = [pongCoord[0],pingCoord[1]];
    let opp = new ping();
    opp.position = pingCoord;
    opp.color = g_selectedColor.slice();
    opp.size = 35;
    g_shapesList.push(opp);
    renderAllShapes();
    document.getElementById("pScore").innerHTML = ""+pScore;
    document.getElementById("bScore").innerHTML = ""+bScore;
}