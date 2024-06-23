let isDrawing = false;
let x = 0;
let y = 0;
let currentPath = [];
let paths = {};
let originalPaths = {};

function enableDrawing(container) {
    let canvas = container.querySelector('canvas');
    const img = container.querySelector('img');
    const clearIcon = container.querySelector('.clearIcon');

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        container.appendChild(canvas);
        resizeCanvas(canvas, img);
    }

    const ctx = canvas.getContext('2d');
    const savedData = JSON.parse(localStorage.getItem(`drawing-data-${img.src}`)) || {};
    const savedPaths = savedData.paths || [];
    const savedDimensions = savedData.dimensions || { width: img.width, height: img.height };

    if (savedPaths.length > 0) {
        paths[img.src] = savedPaths;
        originalPaths[img.src] = JSON.parse(JSON.stringify(savedPaths));
        if (savedDimensions.width !== img.width || savedDimensions.height !== img.height) {
            const scaleX = img.width / savedDimensions.width;
            const scaleY = img.height / savedDimensions.height;
            const resizedPaths = savedPaths.map(path =>
                path.map(point => ({
                    x: point.x * scaleX,
                    y: point.y * scaleY
                }))
            );
            paths[img.src] = resizedPaths;
            redrawPaths(ctx, resizedPaths, canvas, img);
        } else {
            redrawPaths(ctx, savedPaths, canvas, img);
        }
    }

    if (savedPaths.length > 0) {
        clearIcon.classList.remove('hidden');
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [x, y] = [e.clientX - rect.left, e.clientY - rect.top];
        currentPath = [{ x, y }];
    });

    canvas.addEventListener('mousemove', (e) => draw(e, ctx, canvas, img));
    canvas.addEventListener('mouseup', () => {
        if (isDrawing) {
            isDrawing = false;
            paths[img.src] = paths[img.src] || [];
            paths[img.src].push(currentPath);
            originalPaths[img.src] = JSON.parse(JSON.stringify(paths[img.src]));
            saveData(img.src, paths[img.src], img.width, img.height);
            clearIcon.classList.remove('hidden');
        }
    });
    canvas.addEventListener('mouseout', () => isDrawing = false);

    new ResizeObserver(() => {
        resizeCanvas(canvas, img);
    }).observe(container);

    window.addEventListener('resize', () => resizeCanvas(canvas, img));

    clearIcon.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        paths[img.src] = [];
        localStorage.removeItem(`drawing-data-${img.src}`);
        clearIcon.classList.add('hidden');
    });
}

function draw(e, ctx, canvas, img) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const rect = canvas.getBoundingClientRect();
    [x, y] = [e.clientX - rect.left, e.clientY - rect.top];
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 5;
    ctx.stroke();
    currentPath.push({ x, y });
}

function saveData(imgSrc, paths, width, height) {
    const data = {
        paths: paths,
        dimensions: { width, height }
    };
    localStorage.setItem(`drawing-data-${imgSrc}`, JSON.stringify(data));
}

function redrawPaths(ctx, paths, canvas, img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    const ctx = canvas.getContext('2d');
    const savedData = JSON.parse(localStorage.getItem(`drawing-data-${img.src}`)) || {};
    const savedPaths = savedData.paths || [];
    const savedDimensions = savedData.dimensions || { width: img.width, height: img.height };

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (savedPaths.length > 0) {
        const scaleX = img.width / savedDimensions.width;
        const scaleY = img.height / savedDimensions.height;
        const resizedPaths = savedPaths.map(path =>
            path.map(point => ({
                x: point.x * scaleX,
                y: point.y * scaleY
            }))
        );
        redrawPaths(ctx, resizedPaths, canvas, img);
        paths[img.src] = resizedPaths;
    }
}
