let stickers = [];
let engine, world, runner, boxes = [], circles = [], mouseConstraint;
let switchA = true;
let topBoundary;
let isTopBoundaryAtCenter = true; // 用于跟踪 topBoundary 的位置
let hasSwitched = false; // 用于跟踪是否已经切换过位置
let topBoundaryRemoved = false; // 用于跟踪是否已经移除了 topBoundary
let fixedCircles = []; // 用于存储固定的圆点

function preload() {
    stickers.push(loadImage('d.webp'));
    stickers.push(loadImage('i.webp'));
    stickers.push(loadImage('g.webp'));
    stickers.push(loadImage('i2.webp'));
    stickers.push(loadImage('p.webp'));
    stickers.push(loadImage('a.webp'));
    stickers.push(loadImage('c.webp'));
    stickers.push(loadImage('k.webp'));
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);

    // 从 Matter.js 中引入所需对象
    let Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite; // 确保正确引入 Composite

    // 创建引擎
    engine = Engine.create();
    world = engine.world;
    engine.gravity.y = -1;

    // 计算总宽度和起始位置
    let totalWidth = 0;
    for (let i = 0; i < stickers.length; i++) {
        totalWidth += stickers[i].width;
    }
    let startX = (width - totalWidth) / 2;

    // 创建多边形物体并关联图片
    let currentX = startX;
    for (let i = 0; i < stickers.length; i++) {
        let img = stickers[i];
        let boxWidth = img.width;
        let boxHeight = img.height;
        let box = Bodies.rectangle(currentX + img.width / 2, height / 2, boxWidth, boxHeight);
        box.label = 'sticker' + i; // 为每个物体标签
        box.img = img; // 存储图片对象在物体上
        boxes.push(box);
        Composite.add(world, box);
        currentX += img.width;
    }

    const canvasHeight = 600;
    // 添加边界
    topBoundary = Bodies.rectangle(width / 2, canvasHeight / 2, width, 300, { isStatic: true });
    Composite.add(world, [
        topBoundary,
        Bodies.rectangle(width / 2, -30, width, 60, { isStatic: true }),
        Bodies.rectangle(width / 2, height + 30, width, 60, { isStatic: true }),
        Bodies.rectangle(-15, height / 2, 30, height, { isStatic: true }),
        Bodies.rectangle(width + 15, height / 2, 30, height, { isStatic: true })
    ]);

    // 添加鼠标控制
    let canvasMouse = Mouse.create(canvas.elt);
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: canvasMouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    Composite.add(world, mouseConstraint);

    // 创建运行器
    runner = Runner.create();
    Runner.run(runner, engine);
}

function draw() {
    background(0);
    let { Composite, Body } = Matter;

    // 强制设置重力方向为向上
    engine.gravity.y = -1;

    let bodies = Composite.allBodies(world);

    noFill();
    noStroke();

    for (let i = 0; i < bodies.length; i++) {
        let body = bodies[i];
        let vertices = body.vertices;

        beginShape();
        for (let j = 0; j < vertices.length; j++) {
            vertex(vertices[j].x, vertices[j].y);
        }
        endShape(CLOSE);

        // 绘制图片
        if (boxes.includes(body)) {
            let imgIndex = boxes.indexOf(body);
            let img = stickers[imgIndex];
            let angle = body.angle;
            push();
            translate(body.position.x, body.position.y);
            rotate(angle);
            imageMode(CENTER);
            image(img, 0, 0, img.width, img.height); // 使用物体的宽高绘制图片
            pop();
        }
    }

    // 绘制固定的圆形
    for (let i = 0; i < fixedCircles.length; i++) {
        let circle = fixedCircles[i];
        ellipse(circle.position.x, circle.position.y, circle.circleRadius * 2);
    }
}

function mouseClicked() {
    if (!hasSwitched) { // 只有当还没有切换过时才执行
        for (let i = 0; i < boxes.length; i++) {
            let box = boxes[i];
            let distance = dist(mouseX, mouseY, box.position.x, box.position.y);
            if (distance < box.img.width / 2) { // 点击到物体内部
                switchBoundaryPosition();
                hasSwitched = true; // 标记已经切换过
                break; // 找到点击的物体后退出循环
            }
        }
    }
}

function switchBoundaryPosition() {
    let { Composite, Bodies } = Matter;
    
    if (isTopBoundaryAtCenter) {
        // 如果 topBoundary 在中心位置
        console.log('Removing top boundary');
        Composite.remove(world, topBoundary); // 移除 topBoundary
        topBoundaryRemoved = true; // 标记已经移除
        isTopBoundaryAtCenter = false;

        // 添加3个固定的圆点到高度1/4的位子
        let circleRadius = 1;
        let positions = [
            { x: width / 4, y: height / 2},
            { x: width-250, y: height / 2},
            // { x: (3 * width) / 4-10, y: height / 2}
        ];
        for (let i = 0; i < positions.length; i++) {
            let pos = positions[i];
            let fixedCircle = Bodies.circle(pos.x, pos.y, circleRadius, { isStatic: true });
            fixedCircles.push(fixedCircle);
            Composite.add(world, fixedCircle);
        }

    } else {
        // 如果 topBoundary 不在中心位置且已经移除过
        if (topBoundaryRemoved) {
            console.log('Re-adding top boundary');
            Composite.add(world, topBoundary); // 重新添加 topBoundary
            topBoundaryRemoved = false; // 标记未移除

            // 移除固定的圆点
            for (let i = 0; i < fixedCircles.length; i++) {
                Composite.remove(world, fixedCircles[i]);
            }
            fixedCircles = []; // 清空固定圆点数组
        }
        isTopBoundaryAtCenter = true;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}