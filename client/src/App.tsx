import React, { useEffect, useRef, useState } from "react";
import "./App.css";

interface Pixel {
    x: number;
    y: number;
    color: string;
}

interface IncomingMessage {
    type: string;
    payload: Pixel;
}

const App = () => {
    const [pixels, setPixels] = useState<Pixel[]>([]);
    const [currentColor, setCurrentColor] = useState<string>("#000000");
    const [isDrawing, setIsDrawing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket(`ws://localhost:8000/canvas`);


        ws.current.onmessage = (e) => {
            const decodedMessage = JSON.parse(e.data) as IncomingMessage;

            if (decodedMessage.type === "initialData") {
                setPixels([decodedMessage.payload]);
            } else if (decodedMessage.type === "DRAW_PIXEL") {
                const newPixel = decodedMessage.payload as Pixel;
                setPixels((prev) => [...prev, newPixel]);
            }
        };

        return () => {
            if (ws.current) {
                ws.current.close();

            }
        };
    }, []);


    const drawOnCanvas = (pixels: Pixel[]) => {
        const ctx = canvasRef.current?.getContext("2d");

        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            pixels.forEach((pixel) => {
                ctx.beginPath();
                ctx.arc(pixel.x, pixel.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = pixel.color;
                ctx.fill();
            });
        }
    };

    useEffect(() => {
        drawOnCanvas(pixels);
    }, [pixels]);

    const startDrawing = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            drawPixel(x, y);
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const drawPixel = (x: number, y: number) => {
        const newPixel: Pixel = { x, y, color: currentColor };

        setPixels((prev) => [...prev, newPixel]);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(
                JSON.stringify({
                    type: "DRAW_PIXEL",
                    payload: newPixel,
                })
            );
        } else {
            console.error("Cannot send message");
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDrawing) {
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                drawPixel(x, y);
            }
        }
    };

    return (
        <div>
            <h3>Canvas Drawing</h3>

            <canvas
                ref={canvasRef}
                width={1250}
                height={700}
                style={{background: "#FFFFFF", border: "1px solid black"}}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={handleMouseMove}
            ></canvas>
            <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
            />
        </div>
    );
};

export default App;
