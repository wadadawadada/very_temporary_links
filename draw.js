let isDrawing = false;
let x = 0;
let y = 0;

function enableDrawing(container) {
    const canvas = document.createElement('canvas');
    const img = container.querySelector('img');
    canvas.width = img.width;
    canvas.height = img.height;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [x, y] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    

    function draw(e) {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        [x, y] = [e.offsetX, e.offsetY];
    }

    container.querySelector('img').style.display = 'none';
    canvas.addEventListener('dblclick', () => {
        const dataUrl = canvas.toDataURL();
        img.src = dataUrl;
        img.style.display = 'block';
        canvas.remove();
    });
}
