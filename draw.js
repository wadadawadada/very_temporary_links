let isDrawing = false;
let x = 0;
let y = 0;
let currentPath = [];
let paths = {};
let originalPaths = {};

const pinataApiKey = '9b2c19fe686b4a404823';
const pinataSecretApiKey = '8e44607ecd28a80789d38d79b99a8c4f6169b1d1d46a3dc2662dc3adfd982015';

// Function to upload image to Pinata
async function uploadToPinata(imageBlob) {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    let data = new FormData();
    data.append('file', imageBlob);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${pinataApiKey}:${pinataSecretApiKey}`,
        },
        body: data
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Pinata upload failed: ${errorMessage}`);
    }

    return response.json();
}

// Function to combine image and drawings into one canvas and get Blob
function getCanvasWithDrawings(img, paths) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Create a new image element with crossOrigin attribute set
        const imgWithCrossOrigin = new Image();
        imgWithCrossOrigin.crossOrigin = 'Anonymous';
        imgWithCrossOrigin.src = img.src;

        imgWithCrossOrigin.onload = () => {
            ctx.drawImage(imgWithCrossOrigin, 0, 0);
            paths.forEach(path => {
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                path.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 5;
                ctx.stroke();
            });

            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas toBlob conversion failed.'));
                }
            }, 'image/png');
        };

        imgWithCrossOrigin.onerror = (err) => {
            reject(new Error('Image loading failed: ' + err.message));
        };
    });
}

function enableDrawing(container) {
    let canvas = container.querySelector('canvas');
    const img = container.querySelector('img');
    const clearIcon = container.querySelector('.clearIcon'); // Select the clear button

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
        originalPaths[img.src] = JSON.parse(JSON.stringify(savedPaths)); // Save original coordinates
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

    // Show the clear button if there are saved paths
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
            originalPaths[img.src] = JSON.parse(JSON.stringify(paths[img.src])); // Update original coordinates
            saveData(img.src, paths[img.src], img.width, img.height);
            clearIcon.classList.remove('hidden'); // Show clear button when something is drawn
        }
    });
    canvas.addEventListener('mouseout', () => isDrawing = false);

    new ResizeObserver(() => {
        resizeCanvas(canvas, img);
    }).observe(container);

    window.addEventListener('resize', () => resizeCanvas(canvas, img));

    // Clear button functionality
    clearIcon.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        paths[img.src] = []; // Clear paths data
        localStorage.removeItem(`drawing-data-${img.src}`); // Remove saved data
        clearIcon.classList.add('hidden'); // Hide clear button
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
        dimensions: { width: width, height: height }
    };
    localStorage.setItem(`drawing-data-${imgSrc}`, JSON.stringify(data));
}

function redrawPaths(ctx, paths, canvas, img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before redrawing
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
        paths[img.src] = resizedPaths; // Update paths after resizing
    }
}
