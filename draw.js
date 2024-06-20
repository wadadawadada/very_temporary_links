let isDrawing = false;
let x = 0;
let y = 0;
let currentPath = [];
let paths = {};

function enableDrawing(container) {
    let canvas = container.querySelector('canvas');
    const img = container.querySelector('img');

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = img.offsetTop + 'px';
        canvas.style.left = img.offsetLeft + 'px';
        container.appendChild(canvas);
        resizeCanvas(canvas, img);
    }

    const ctx = canvas.getContext('2d');
    const savedPaths = JSON.parse(localStorage.getItem(`drawing-paths-${img.src}`)) || [];
    if (savedPaths.length > 0) {
        paths[img.src] = savedPaths;
        redrawPaths(ctx, savedPaths, canvas, img);
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [x, y] = [e.offsetX, e.offsetY];
        currentPath = [{ x, y }];
    });

    canvas.addEventListener('mousemove', (e) => draw(e, ctx, canvas, img));
    canvas.addEventListener('mouseup', () => {
        if (isDrawing) {
            isDrawing = false;
            paths[img.src] = paths[img.src] || [];
            paths[img.src].push(currentPath);
            savePaths(img.src, paths[img.src]);
        }
    });
    canvas.addEventListener('mouseout', () => isDrawing = false);

    window.addEventListener('resize', () => resizeCanvas(canvas, img));
}

function draw(e, ctx, canvas, img) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    [x, y] = [e.offsetX, e.offsetY];
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 5;
    ctx.stroke();
    currentPath.push({ x, y });
}

function savePaths(imgSrc, paths) {
    localStorage.setItem(`drawing-paths-${imgSrc}`, JSON.stringify(paths));
}

function redrawPaths(ctx, paths, canvas, img) {
    paths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 5;
        ctx.stroke();
    });
}

function resizeCanvas(canvas, img) {
    const ratio = img.width / canvas.width;
    const ctx = canvas.getContext('2d');
    const paths = JSON.parse(localStorage.getItem(`drawing-paths-${img.src}`)) || [];
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach(path => {
        path.forEach(point => {
            point.x *= ratio;
            point.y *= ratio;
        });
    });

    redrawPaths(ctx, paths, canvas, img);
}
