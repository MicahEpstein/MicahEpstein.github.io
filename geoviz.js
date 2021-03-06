


function createTextCanvas(text, color, font, size) {
    size = size || 16;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fontStr = (size + 'px ') + (font || 'Arial');
    ctx.font = fontStr;
    var w = ctx.measureText(text).width;
    var h = Math.ceil(size);
    canvas.width = w;
    canvas.height = h;
    ctx.font = fontStr;
    ctx.fillStyle = color || 'black';
    ctx.fillText(text, 0, Math.ceil(size * 0.8));
    return canvas;
}

function createText2D(text, color, font, size, segW, segH) {
    var canvas = createTextCanvas(text, color, font, size);
    var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    var planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true
    });
    var mesh = new THREE.Mesh(plane, planeMat);
    mesh.scale.set(0.5, 0.5, 0.5);
    mesh.doubleSided = true;
    return mesh;
}

// from http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) { //TODO rewrite with vector output
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

var renderer = new THREE.WebGLRenderer({
    antialias: true
});
var w = window.innerWidth/2;
var h =  window.innerWidth/2;
renderer.setSize(w, h);
div = document.getElementById("geoviz"); 
div.appendChild(renderer.domElement);

renderer.setClearColorHex(0xEEEEEE, 0.0);

var camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
camera.position.z = 200;
camera.position.x = -100;
camera.position.y = 100;

var scene = new THREE.Scene();

var scatterPlot = new THREE.Object3D();
scene.add(scatterPlot);

var img = new THREE.MeshBasicMaterial({ //CHANGED to MeshBasicMaterial
    map:THREE.ImageUtils.loadTexture('images/brc.jpg')
});
img.map.needsUpdate = true; //ADDED

var plane = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),img);
plane.position.y = -60;
plane.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI-90); 
plane.overdraw = true;
scatterPlot.add(plane);

scatterPlot.rotation.y = 0;
scatterPlot.position.y =+ 10;

function v(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

var unfiltered = [],
    lowPass = [],
    highPass = [];

var format = d3.format("+.3f");

var data = d3.csv("black_rock_atlas_results.csv", function (d) {
    
    d.forEach(function (d,i) {
        unfiltered[i] = {
            x: +d.Latitude,
            y: +d.time_percent,
            z: +d.Longitude,
            imei: +d.imei+7
        };
    })

// var xExent = d3.extent(unfiltered, function (d) {return d.x; }),
//     yExent = d3.extent(unfiltered, function (d) {return d.y; }),
//     zExent = d3.extent(unfiltered, function (d) {return d.z; });

var xExent = [40.771032,40.801887],
    yExent = d3.extent(unfiltered, function (d) {return d.y; }),
    zExent = [-119.226738,-119.187010];

var vpts = {
    xMax: xExent[1],
    xCen: (xExent[1] + xExent[0]) / 2,
    xMin: xExent[0],
    yMax: yExent[1],
    yCen: (yExent[1] + yExent[0]) / 2,
    yMin: yExent[0],
    zMax: zExent[1],
    zCen: (zExent[1] + zExent[0]) / 2,
    zMin: zExent[0]
}

var colour = d3.scale.category10();

var xScale = d3.scale.linear()
              .domain(xExent)
              .range([-60,60]);
var yScale = d3.scale.linear()
              .domain(yExent)
              .range([-60,60]);                  
var zScale = d3.scale.linear()
              .domain(zExent)
              .range([-60,60]);

var lineGeo = new THREE.Geometry();
lineGeo.vertices.push(
    v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zCen)),
    v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zCen)),
    v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMin)),

    v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)),
    v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)),
    v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)),
    v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)),

    v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)),
    v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)),
    v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)),
    v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)),

    v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)),
    v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)),
    v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)),
    v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)),

    v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMax)),
    v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)),
    v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)),
    v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zCen)),

    v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)),
    v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)),
    v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)),
    v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)),

    v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMax)),
    v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)),
    v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)),
    v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax))

);
var lineMat = new THREE.LineBasicMaterial({
    color: 0x000000,
    lineWidth: 1
});
var line = new THREE.Line(lineGeo, lineMat);
line.type = THREE.Lines;
line.rotation.set(0,-90, 0); 
scatterPlot.add(line);




var titleY = createText2D('-T');
titleY.position.y = yScale(vpts.yMin) - 5;
scatterPlot.add(titleY);

var valueY = createText2D(format(yExent[0]));
valueY.position.y = yScale(vpts.yMin) - 15,
scatterPlot.add(valueY);

var titleY = createText2D('T');
titleY.position.y = yScale(vpts.yMax) + 15;
scatterPlot.add(titleY);

var valueY = createText2D(format(yExent[1]));
valueY.position.y = yScale(vpts.yMax) + 5,
scatterPlot.add(valueY);



var mat = new THREE.ParticleBasicMaterial({
    vertexColors: true,
    size: 2
});

var pointCount = unfiltered.length;
var pointGeo = new THREE.Geometry();
for (var i = 0; i < pointCount; i ++) {
    var x = xScale(unfiltered[i].x);
    var y = yScale(unfiltered[i].y);
    var z = zScale(unfiltered[i].z);

    pointGeo.vertices.push(new THREE.Vector3(x, y, z));
    console.log(pointGeo.vertices);
    //pointGeo.vertices[i].angle = Math.atan2(z, x);
    //pointGeo.vertices[i].radius = Math.sqrt(x * x + z * z);
    //pointGeo.vertices[i].speed = (z / 100) * (x / 100);
    pointGeo.colors.push(new THREE.Color().setRGB(
      hexToRgb(colour(unfiltered[i].imei)).r / 255, hexToRgb(colour(unfiltered[i].imei)).g / 255, hexToRgb(colour(unfiltered[i].imei)).b / 255 
    ));

}
var points = new THREE.ParticleSystem(pointGeo, mat);
scatterPlot.add(points);

renderer.render(scene, camera);
var paused = false;
var last = new Date().getTime();
var down = false;
var sx = 0,
    sy = 0;
    
window.onmousedown = function(ev) {
    down = true;
    sx = ev.clientX;
    sy = ev.clientY;
};
window.onmouseup = function() {
    down = false;
};
window.onmousemove = function(ev) {
    if (down) {
        var dx = ev.clientX - sx;
        var dy = ev.clientY - sy;
        scatterPlot.rotation.y += dx * 0.01;
        camera.position.y += dy;
        sx += dx;
        sy += dy;
    }
}
var animating = false;
window.ondblclick = function() {
    animating = !animating;
};

function animate(t) {
    if (!paused) {
        last = t;
        if (animating) {
            var v = pointGeo.vertices;
            for (var i = 0; i < v.length; i++) {
                var u = v[i];
                u.angle += u.speed * 0.01;
                u.x = Math.cos(u.angle) * u.radius;
                u.z = Math.sin(u.angle) * u.radius;
            }
            pointGeo.__dirtyVertices = true;
        }
        renderer.clear();
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
    window.requestAnimationFrame(animate, renderer.domElement);
};
animate(new Date().getTime());
onmessage = function(ev) {
    paused = (ev.data == 'pause');
};

})

 // camera.position.z = 0;
 // camera.position.x = 0;
 // camera.position.y = yExent[1]+100;
    //-->

$( "#top" ).click(function() {
    camera.position.z = 0;
    camera.position.x = 0;
    camera.position.y =3337;
    scatterPlot.scale.set(12,12,12);
});

$( "#side" ).click(function() {
camera.position.z =-100;
 camera.position.x = 100;
 camera.position.y =200;
});
