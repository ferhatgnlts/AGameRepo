    // DOM elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const messageElement = document.getElementById('message');
    
    // Game state
    let isDrawing = false;
    let points = [];
    let startTime = 0;
    let currentScore = 0;
    let lastPoint = null;
    
    // Game constants
    const MAX_TIME = 10000;
    const MIN_POINTS = 30; // Reduced minimum points for faster drawing
    const MIN_RADIUS = 50;
    const MAX_GAP = 15; // Maximum allowed gap between points for interpolation
    
    // Resize canvas to fit container
    function resizeCanvas() {
      const size = Math.min(window.innerWidth, window.innerHeight);
      canvas.width = size;
      canvas.height = size;
      drawCenterDot();
    }
    
    // Draw the single center reference dot
    function drawCenterDot() {
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, 3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
    }
    
    // Start drawing
    function startDrawing(event) {
      event.preventDefault();
      isDrawing = true;
      points = [];
      lastPoint = null;
      startTime = Date.now();
      currentScore = 0;
      
      const point = getPoint(event);
      points.push(point);
      lastPoint = point;
      
      // Clear and prepare canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCenterDot();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      
      // Set line styles for smoother drawing
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = getScoreColor(currentScore);
      ctx.lineWidth = 3;
      
      // Update UI
      scoreElement.textContent = '0%';
      messageElement.textContent = 'Drawing...';
    }
    
    // Continue drawing with interpolation
    function draw(event) {
      if (!isDrawing) return;
      event.preventDefault();
      
      // Check time limit
      if (Date.now() - startTime > MAX_TIME) {
        endDrawing("Too slow! Max 10 seconds");
        return;
      }
      
      const point = getPoint(event);
      
      // Add interpolated points if gap is too big
      if (lastPoint) {
        const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
        
        if (distance > MAX_GAP) {
          const steps = Math.ceil(distance / MAX_GAP);
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const interpX = lastPoint.x + t * (point.x - lastPoint.x);
            const interpY = lastPoint.y + t * (point.y - lastPoint.y);
            points.push({ x: interpX, y: interpY });
            ctx.lineTo(interpX, interpY);
          }
        }
      }
      
      points.push(point);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPoint = point;
    }
    
    // End drawing and calculate score
    function endDrawing(message = null) {
      isDrawing = false;
      
      // Check if we have enough points
      if (points.length < MIN_POINTS) {
        messageElement.textContent = "Draw larger! More points needed";
        scoreElement.textContent = "0%";
        return;
      }
      
      // Calculate circle score
      const { score, valid } = calculateCircleScore(points);
      currentScore = Math.round(score);
      
      if (!valid) {
        messageElement.textContent = "Draw a complete circle around the center";
        scoreElement.textContent = "0%";
        return;
      }
      
      // Update UI
      scoreElement.textContent = `${currentScore}%`;
      messageElement.textContent = getScoreMessage(currentScore);
      
      // Redraw with final color
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCenterDot();
      ctx.beginPath();
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = getScoreColor(currentScore);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // Get coordinates from event
    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      
      const x = ((clientX - rect.left) / rect.width) * canvas.width;
      const y = ((clientY - rect.top) / rect.height) * canvas.height;
      
      return { x, y };
    }
    
    // Calculate circle score accurately with angle check
    function calculateCircleScore(points) {
      const center = { x: canvas.width/2, y: canvas.height/2 };
      
      // Calculate distances from center
      const distances = points.map(p => Math.hypot(p.x - center.x, p.y - center.y));
      const avgRadius = distances.reduce((a,b) => a + b, 0) / distances.length;
      
      // Check if circle is big enough
      if (avgRadius < MIN_RADIUS) {
        return { score: 0, valid: false };
      }
      
      // Calculate angles to check if it's a complete loop
      const angles = points.map(p => Math.atan2(p.y - center.y, p.x - center.x));
      
      // Normalize angles and calculate total rotation
      let totalRotation = 0;
      let prevAngle = angles[0];
      
      for (let i = 1; i < angles.length; i++) {
        let angleDiff = angles[i] - prevAngle;
        
        // Handle angle wrapping (crossing -π/π boundary)
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        totalRotation += angleDiff;
        prevAngle = angles[i];
      }
      
      // Check if it's a complete circle (at least 300 degrees rotation)
      if (Math.abs(totalRotation) < 5.0) { // ~300 degrees (5.0 radians)
        return { score: 0, valid: false };
      }
      
      // Calculate standard deviation
      const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgRadius, 2), 0) / distances.length;
      const stdDev = Math.sqrt(variance);
      
      // Normalized score (0-100)
      const normalizedDeviation = (stdDev / avgRadius) * 100;
      const score = Math.max(0, 100 - normalizedDeviation * 2);
      
      return { 
        score: Math.min(100, score), 
        valid: true 
      };
    }
    
    // Get color based on score
    function getScoreColor(score) {
      return `hsl(${score * 1.2}, 100%, 50%)`;
    }
    
    // Get feedback message
    function getScoreMessage(score) {
      if (score >= 95) return "Perfect! Are you a robot?";
      if (score >= 85) return "Excellent! Almost perfect";
      if (score >= 70) return "Good job!";
      if (score >= 50) return "Not bad, but could be rounder";
      if (score >= 30) return "Keep practicing";
      return "Try again, focus on smoothness";
    }
    
    // Initialize game
    function init() {
      resizeCanvas();
      drawCenterDot();
      
      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', endDrawing);
      canvas.addEventListener('mouseleave', endDrawing);
      
      // Touch events
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', endDrawing, { passive: false });
      
      // Prevent context menu
      canvas.addEventListener('contextmenu', e => e.preventDefault());
      
      window.addEventListener('resize', resizeCanvas);
    }
    
    init();
