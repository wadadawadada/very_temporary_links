document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.querySelector('.screen');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let ctx = canvas.getContext('2d');

    const w = canvas.width;
    const h = canvas.height;

    const bg = '#000000'; // Changed background to black

    class Circle {
        constructor(x, y, r, o, sin, os) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.o = o;
            this.sin = sin;
            this.os = os;
            this.t = 0;
            this.lw = 2; /*2*/
        }

        update() {
            // Update logic here if needed
        }

        render() {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(13, 255, 0, 0.094)`; // Changed color to #0dff0057
            ctx.arc(
                this.x - this.sin * this.os,
                this.y + this.sin * this.os / 5,
                this.r, 0, 2 * Math.PI);
            ctx.lineWidth = this.lw + this.sin * 1;
            ctx.stroke();
        }
    }

    const c = 95;
    const circles = [];
    for (let i = 0; i < c; i++) {
        circles.push(new Circle(
            w / 2,
            h / 52,
            c / 4 + c / (c / 17) * i * 1.6,
            ((i + 1) * (i + 1)) / (c * c * 0.5),
            Math.sin(Math.PI * 2 / c * i),
            i * 4 + 45
        ));
    }

    const render = () => {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < c; i++) {
            circles[i].t += 0.01;
            circles[i].sin = Math.sin(Math.PI * 5 / c * i + circles[i].t);
        }

        circles.forEach(e => e.render());

        requestAnimationFrame(render);
    };

    render();
});
