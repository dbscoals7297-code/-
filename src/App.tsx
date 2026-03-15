import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trash2, Eraser, Palette, Calculator as CalcIcon, Timer as TimerIcon, Pencil, FileText, Bell, BellOff, Maximize2, GripHorizontal } from 'lucide-react';

// --- Resizable Container Wrapper ---
const ResizableContainer = ({ children, initialWidth }: { children: React.ReactNode, initialWidth: number }) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const scale = width / initialWidth;

  useEffect(() => {
    if (contentRef.current) {
      // Measure height at scale 1
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, [children]);

  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Allow resizing between 0.5x and 2.5x of initial width
        const newWidth = Math.max(initialWidth * 0.5, Math.min(initialWidth * 2.5, clientX - rect.left));
        setWidth(newWidth);
      }
    };

    const handleEnd = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
      document.body.style.cursor = 'nwse-resize';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, initialWidth]);

  return (
    <div 
      ref={containerRef}
      className="relative group"
      style={{ 
        width: `${width}px`,
        height: `${contentHeight * scale}px`,
        transition: isResizing ? 'none' : 'all 0.2s ease-out'
      }}
    >
      <div 
        ref={contentRef}
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${initialWidth}px`,
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {children}
      </div>
      
      {/* Resize Handle Icon */}
      <div
        onMouseDown={startResizing}
        onTouchStart={startResizing}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize z-30 flex items-center justify-center text-zinc-300 hover:text-emerald-500 transition-colors"
        title="드래그하여 크기 조절"
      >
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round"
        >
          <line x1="22" y1="6" x2="6" y2="22" />
          <line x1="22" y1="14" x2="14" y2="22" />
        </svg>
      </div>
    </div>
  );
};

// --- Timer Component ---
const Timer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const playAlert = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1); // Play for 1 second
    } catch (e) {
      console.error("Audio context error:", e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      playAlert();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, isMuted]);

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(inputMinutes * 60);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = parseInt(e.target.value) || 0;
    setInputMinutes(mins);
    setSeconds(mins * 60);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-white p-1.5 rounded-lg shadow-sm border border-black/5 flex flex-col items-center w-full">
      <button
        onClick={() => setIsMuted(!isMuted)}
        className={`absolute top-1 right-1 p-0.5 rounded-md transition-all ${isMuted ? 'text-red-400' : 'text-zinc-300 hover:text-zinc-500'}`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <BellOff size={10} /> : <Bell size={10} />}
      </button>
      <div className="flex items-center gap-1 mb-1 text-zinc-500">
        <TimerIcon size={10} />
        <span className="text-[8px] font-medium uppercase tracking-wider">Timer</span>
      </div>
      <div className="text-xl font-mono font-light tracking-tighter mb-1 text-zinc-900">
        {formatTime(seconds)}
      </div>
      <div className="flex gap-1 mb-1 w-full">
        <input
          type="number"
          placeholder="Min"
          className="flex-1 px-1 py-0.5 text-[9px] rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          onChange={handleInputChange}
          min="0"
        />
        <button
          onClick={() => setIsActive(true)}
          className={`p-1 rounded-md transition-all ${isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
          title="시작"
        >
          <Play size={12} />
        </button>
        <button
          onClick={() => setIsActive(false)}
          className={`p-1 rounded-md transition-all ${!isActive && seconds > 0 && seconds !== inputMinutes * 60 ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}
          title="일시정지"
        >
          <Pause size={12} />
        </button>
        <button
          onClick={resetTimer}
          className="p-1 rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
          title="초기화"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
};

// --- Drawing Board & Notepad Component ---
const DrawingBoard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'memo'>('memo');
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(1);
  const [memoText, setMemoText] = useState('');

  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 120;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [mode]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    // Adjust coordinates based on the ratio of internal canvas size to rendered size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearContent = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      setMemoText('');
    }
  };

  return (
    <div className="relative bg-white p-3 rounded-xl shadow-sm border border-black/5 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-2 text-zinc-500">
        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg">
          <button
            onClick={() => setMode('memo')}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${mode === 'memo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400'}`}
          >
            메모장
          </button>
          <button
            onClick={() => setMode('draw')}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${mode === 'draw' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400'}`}
          >
            그림판
          </button>
        </div>

        <div className="flex gap-1.5 items-center">
          {mode === 'draw' && (
            <>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-4 h-4 rounded cursor-pointer border-none bg-transparent"
              />
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-10 accent-emerald-500"
              />
            </>
          )}
          <button
            onClick={clearContent}
            className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
            title="Clear"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="relative bg-zinc-50 rounded-lg border border-black/5 min-h-[120px]">
        {mode === 'draw' ? (
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full block cursor-crosshair touch-none"
          />
        ) : (
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="메모를 입력하세요..."
            className="w-full h-[120px] p-2 bg-transparent text-[11px] resize-none focus:outline-none text-zinc-700 font-sans leading-relaxed"
          />
        )}
      </div>
    </div>
  );
};

// --- Calculator Component ---
const Calculator = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');

  const handleInput = (val: string) => {
    if (val === 'AC') {
      setExpression('');
      setResult('0');
    } else if (val === 'C') {
      setExpression((prev) => prev.slice(0, -1));
    } else if (val === '=') {
      try {
        if (!expression) return;
        // Replace 'x' with '*' and handle '%' as '/100'
        const sanitized = expression.replace(/x/g, '*').replace(/%/g, '/100');
        const evaluated = eval(sanitized);
        setResult(String(evaluated));
        setExpression(String(evaluated));
      } catch (e) {
        setResult('Error');
      }
    } else {
      setExpression((prev) => (prev === '0' ? val : prev + val));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (['+', '-', '*', '/', '(', ')', '%'].includes(e.key)) {
        handleInput(e.key === '*' ? 'x' : e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleInput('=');
      } else if (e.key === 'Escape') {
        handleInput('AC');
      } else if (e.key === 'Backspace') {
        handleInput('C');
      } else if (e.key === '.') {
        handleInput('.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression]);

  const buttons = [
    'AC', 'C', '(', ')',
    '%', '/', 'x', '-',
    '7', '8', '9', '+',
    '4', '5', '6', '.',
    '1', '2', '3', '=',
    '0'
  ];

  return (
    <div className="relative bg-white p-2 rounded-2xl shadow-sm border border-black/5 w-full">
      <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
        <CalcIcon size={12} />
        <span className="text-[9px] font-medium uppercase tracking-wider">Calculator</span>
      </div>
      <div className="bg-zinc-50 p-2 rounded-xl mb-1.5 text-right border border-black/5 overflow-hidden min-h-[50px] flex flex-col justify-center">
        <div className="text-xl font-mono font-medium text-zinc-900 break-all leading-tight">
          {expression || result}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleInput(btn)}
            className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              btn === '0' ? 'col-span-1' : ''
            } ${
              btn === '=' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : ['+', '-', 'x', '/', '(', ')', '%'].includes(btn)
                  ? 'bg-zinc-100 text-emerald-600'
                  : ['AC', 'C'].includes(btn)
                    ? 'bg-zinc-100 text-red-500'
                    : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 py-8 px-4">
      <main className="max-w-4xl mx-auto flex flex-col items-center space-y-16">
        <header className="text-center space-y-3 w-full">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            실제 인적성 화면 완벽 구현 | 인적성 사이트 모의고사 도구
          </h1>
          <p className="text-zinc-500 max-w-lg mx-auto text-xs">
            실제 인적성 검사 환경을 그대로 재현했습니다. 타이머, 메모장, 그림판, 계산기를 활용하여 
            인적성 모의고사를 더욱 효율적으로 대비하세요.
          </p>
        </header>

        <div className="flex flex-col items-center space-y-4 w-full">
          <article id="timer" className="w-full flex justify-center">
            <h2 className="sr-only">인적성 타이머 유틸리티</h2>
            <ResizableContainer initialWidth={200}>
              <Timer />
            </ResizableContainer>
          </article>

          <article id="drawing" className="w-full flex justify-center">
            <h2 className="sr-only">인적성 메모장 및 그림판 도구</h2>
            <ResizableContainer initialWidth={240}>
              <DrawingBoard />
            </ResizableContainer>
          </article>

          <article id="calculator" className="w-full flex justify-center">
            <h2 className="sr-only">인적성 계산기 유틸리티</h2>
            <ResizableContainer initialWidth={220}>
              <Calculator />
            </ResizableContainer>
          </article>
        </div>

        <footer className="pt-16 text-center text-zinc-400 text-sm w-full">
          <p>&copy; 2026 인적성 마스터 - 실제 인적성 화면 연습을 위한 최적의 솔루션</p>
        </footer>
      </main>
    </div>
  );
}
