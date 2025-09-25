document.addEventListener('DOMContentLoaded', function() {
    // Canvas and context setup
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize canvas to fit container
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set line properties
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Drawing variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'brush';
    let currentColor = '#000000';
    let brushSize = 5;
    let brushShape = 'round';
    let opacity = 1;
    let drawingHistory = [];
    let historyStep = -1;
    let startX, startY; // For shapes
    let isSpraying = false;
    let sprayInterval;
    
    // Initialize opacity display
    document.getElementById('opacity-value').textContent = '100%';
    document.getElementById('brush-size-value').textContent = '5px';
    document.getElementById('tool-size-value').textContent = '5px';
    document.getElementById('hardness-value').textContent = '5';
    
    // Panel management
    const panels = document.querySelectorAll('.panel');
    const overlay = document.getElementById('panel-overlay');
    let activePanel = null;
    
    // Toolbar button event listeners
    document.getElementById('brush-tool').addEventListener('click', function() {
        setActiveTool('brush');
        closeAllPanels();
    });
    
    document.getElementById('color-tool').addEventListener('click', function() {
        togglePanel('color-panel');
    });
    
    document.getElementById('brush-size-tool').addEventListener('click', function() {
        togglePanel('brush-size-panel');
    });
    
    document.getElementById('shapes-tool').addEventListener('click', function() {
        togglePanel('tools-panel');
    });
    
    document.getElementById('actions-tool').addEventListener('click', function() {
        togglePanel('actions-panel');
    });
    
    // Close panel buttons
    document.querySelectorAll('.close-panel').forEach(button => {
        button.addEventListener('click', closeAllPanels);
    });
    
    // Overlay click to close panels
    overlay.addEventListener('click', closeAllPanels);
    
    // Color palette
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            currentColor = this.getAttribute('data-color');
            document.getElementById('custom-color').value = currentColor;
            document.getElementById('custom-color-value').value = currentColor;
            
            // Mark active color
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Custom color picker
    document.getElementById('custom-color').addEventListener('input', function() {
        currentColor = this.value;
        document.getElementById('custom-color-value').value = currentColor;
        
        // Update active color in palette
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('active');
        });
    });
    
    document.getElementById('custom-color-value').addEventListener('input', function() {
        const colorValue = this.value;
        if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
            currentColor = colorValue;
            document.getElementById('custom-color').value = currentColor;
        }
    });
    
    // Opacity slider
    document.getElementById('opacity-slider').addEventListener('input', function() {
        opacity = this.value / 100;
        document.getElementById('opacity-value').textContent = this.value + '%';
    });
    
    // Brush size
    document.getElementById('brush-size').addEventListener('input', function() {
        brushSize = this.value;
        document.getElementById('brush-size-value').textContent = this.value + 'px';
    });
    
    // Tool size
    document.getElementById('tool-size').addEventListener('input', function() {
        brushSize = this.value;
        document.getElementById('tool-size-value').textContent = this.value + 'px';
    });
    
    // Brush hardness
    document.getElementById('brush-hardness').addEventListener('input', function() {
        document.getElementById('hardness-value').textContent = this.value;
    });
    
    // Brush shapes
    document.getElementById('brush-round').addEventListener('click', function() {
        setActiveBrushShape('round');
    });
    
    document.getElementById('brush-square').addEventListener('click', function() {
        setActiveBrushShape('square');
    });
    
    document.getElementById('brush-spray').addEventListener('click', function() {
        setActiveBrushShape('spray');
    });
    
    // Tool options
    document.querySelectorAll('.tool-option').forEach(option => {
        option.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            setActiveTool(tool);
            
            // Update active tool in UI
            document.querySelectorAll('.tool-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            
            closeAllPanels();
        });
    });
    
    // Action buttons
    document.getElementById('clear-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            saveHistory();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        closeAllPanels();
    });
    
    document.getElementById('undo-btn').addEventListener('click', function() {
        undo();
        closeAllPanels();
    });
    
    document.getElementById('redo-btn').addEventListener('click', function() {
        redo();
        closeAllPanels();
    });
    
    document.getElementById('save-btn').addEventListener('click', function() {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'my-drawing.png';
        link.href = dataURL;
        link.click();
        closeAllPanels();
    });
    
    // Drawing functions
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
        [startX, startY] = [lastX, lastY];
        
        if (currentTool === 'fill') {
            floodFill(lastX, lastY, currentColor);
            saveHistory();
        } else if (brushShape === 'spray') {
            startSpraying(lastX, lastY);
        }
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const [x, y] = getCoordinates(e);
        
        if (currentTool === 'brush' || currentTool === 'eraser') {
            if (brushShape === 'spray') {
                // Spray effect is handled separately
                return;
            }
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            
            if (currentTool === 'brush') {
                ctx.strokeStyle = applyOpacity(currentColor, opacity);
            } else if (currentTool === 'eraser') {
                ctx.strokeStyle = 'white';
            }
            
            ctx.lineWidth = brushSize;
            ctx.lineCap = brushShape === 'round' ? 'round' : 'square';
            ctx.stroke();
            
            [lastX, lastY] = [x, y];
        } else if (currentTool === 'line') {
            // Draw temporary line
            redrawCanvas();
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = applyOpacity(currentColor, opacity);
            ctx.lineWidth = brushSize;
            ctx.stroke();
        } else if (currentTool === 'rectangle') {
            // Draw temporary rectangle
            redrawCanvas();
            ctx.strokeStyle = applyOpacity(currentColor, opacity);
            ctx.lineWidth = brushSize;
            ctx.strokeRect(startX, startY, x - startX, y - startY);
        } else if (currentTool === 'circle') {
            // Draw temporary circle
            redrawCanvas();
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = applyOpacity(currentColor, opacity);
            ctx.lineWidth = brushSize;
            ctx.stroke();
        }
    }
    
    function stopDrawing() {
        if (!isDrawing) return;
        
        if (brushShape === 'spray') {
            stopSpraying();
        }
        
        if (currentTool !== 'fill') {
            saveHistory();
        }
        
        isDrawing = false;
    }
    
    // Spray effect functions
    function startSpraying(x, y) {
        isSpraying = true;
        sprayInterval = setInterval(() => {
            if (!isSpraying) return;
            
            for (let i = 0; i < 5; i++) {
                const sprayX = x + (Math.random() - 0.5) * brushSize * 2;
                const sprayY = y + (Math.random() - 0.5) * brushSize * 2;
                
                ctx.beginPath();
                ctx.arc(sprayX, sprayY, brushSize / 4, 0, Math.PI * 2);
                ctx.fillStyle = applyOpacity(currentColor, opacity * 0.7);
                ctx.fill();
            }
        }, 50);
    }
    
    function stopSpraying() {
        isSpraying = false;
        if (sprayInterval) {
            clearInterval(sprayInterval);
        }
    }
    
    // Touch events
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startDrawing(e.touches[0]);
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        draw(e.touches[0]);
    });
    
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Helper functions
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return [
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top) * scaleY
        ];
    }
    
    function setActiveTool(tool) {
        currentTool = tool;
        
        // Update floating toolbar
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (tool === 'brush') {
            document.getElementById('brush-tool').classList.add('active');
        }
    }
    
    function setActiveBrushShape(shape) {
        brushShape = shape;
        
        // Remove active class from all shape buttons
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected shape
        document.getElementById(`brush-${shape}`).classList.add('active');
    }
    
    function applyOpacity(color, opacity) {
        if (color === 'white') return color;
        
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // Panel management functions
    function togglePanel(panelId) {
        if (activePanel === panelId) {
            closeAllPanels();
            return;
        }
        
        closeAllPanels();
        
        const panel = document.getElementById(panelId);
        panel.classList.add('active');
        overlay.classList.add('active');
        activePanel = panelId;
    }
    
    function closeAllPanels() {
        panels.forEach(panel => {
            panel.classList.remove('active');
        });
        overlay.classList.remove('active');
        activePanel = null;
    }
    
    // Flood fill algorithm
    function floodFill(startX, startY, fillColor) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const startPos = (Math.floor(startY) * canvas.width + Math.floor(startX)) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];
        
        // If start color is same as fill color, do nothing
        const fillR = parseInt(fillColor.slice(1, 3), 16);
        const fillG = parseInt(fillColor.slice(3, 5), 16);
        const fillB = parseInt(fillColor.slice(5, 7), 16);
        
        if (startR === fillR && startG === fillG && startB === fillB) return;
        
        const targetColor = {r: startR, g: startG, b: startB, a: startA};
        const pixelsToCheck = [Math.floor(startX), Math.floor(startY)];
        
        while (pixelsToCheck.length > 0) {
            const y = pixelsToCheck.pop();
            const x = pixelsToCheck.pop();
            
            const currentPos = (y * canvas.width + x) * 4;
            
            // Skip if pixel doesn't match target color
            if (
                data[currentPos] !== targetColor.r ||
                data[currentPos + 1] !== targetColor.g ||
                data[currentPos + 2] !== targetColor.b ||
                data[currentPos + 3] !== targetColor.a
            ) {
                continue;
            }
            
            // Fill the pixel
            data[currentPos] = fillR;
            data[currentPos + 1] = fillG;
            data[currentPos + 2] = fillB;
            data[currentPos + 3] = 255 * opacity;
            
            // Check neighboring pixels
            if (x > 0) {
                pixelsToCheck.push(x - 1, y);
            }
            if (x < canvas.width - 1) {
                pixelsToCheck.push(x + 1, y);
            }
            if (y > 0) {
                pixelsToCheck.push(x, y - 1);
            }
            if (y < canvas.height - 1) {
                pixelsToCheck.push(x, y + 1);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Redraw canvas from history (for temporary shapes)
    function redrawCanvas() {
        if (historyStep >= 0) {
            const img = new Image();
            img.src = drawingHistory[historyStep];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    // History management
    function saveHistory() {
        // Clear history after current step
        if (historyStep < drawingHistory.length - 1) {
            drawingHistory = drawingHistory.slice(0, historyStep + 1);
        }
        
        // Save current state
        drawingHistory.push(canvas.toDataURL());
        historyStep++;
        
        // Limit history (50 steps)
        if (drawingHistory.length > 50) {
            drawingHistory.shift();
            historyStep--;
        }
    }
    
    function undo() {
        if (historyStep > 0) {
            historyStep--;
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = drawingHistory[historyStep];
        }
    }
    
    function redo() {
        if (historyStep < drawingHistory.length - 1) {
            historyStep++;
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = drawingHistory[historyStep];
        }
    }
    
    // Save initial state
    saveHistory();
});