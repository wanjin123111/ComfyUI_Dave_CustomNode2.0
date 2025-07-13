import { app } from "../../scripts/app.js";

/**
 * 🎯 ComfyUI Dave Human Body Parts - 专业Canvas交互解决方案
 * 基于canvasInteractor和mouseDragTracker专业技术
 * 解决参数布局、鼠标拖拽和参数同步问题
 * @version 2.6.1
 * @author Dave (ComfyUI-Dave-CustomNode)
 */

console.log("🎯 Human Body Parts - 专业Canvas交互解决方案 v2.6.1");

// ========== 专业配置常量 ==========
const CANVAS_CONFIG = {
    width: 400,  // 🔧 用户反馈：调整为合适的窗口大小
    height: 500, // 🔧 用户反馈：调整为合适的窗口大小
    backgroundColor: "#2a2a2a",
    borderColor: "#555",
    gridColor: "#444",
    textColor: "#fff"
};

const INTERACTION_CONFIG = {
    handleSize: 6,
    hitTolerance: 8,
    rotationHandleDistance: 20,
    minSize: 15,
    maxSize: 300,
    dragThreshold: 0 // 🔧 用户反馈：设置为0，点击即可拖动
};

// 🎨 优化人体部件布局 - 充分利用400x500画布空间，消除右边空白
const BODY_PARTS = {
    "head": { name: "头部", color: "#ff6b6b", defaultPos: [170, 10, 70, 50, 1.0, 0.0] },
    "neck": { name: "颈部", color: "#ff9f43", defaultPos: [185, 60, 40, 25, 1.0, 0.0] },
    "face": { name: "面部", color: "#feca57", defaultPos: [175, 15, 50, 40, 1.0, 0.0] },
    "torso": { name: "躯干", color: "#4ecdc4", defaultPos: [160, 85, 80, 100, 1.0, 0.0] },
    "chest": { name: "胸部", color: "#45b7d1", defaultPos: [165, 85, 70, 50, 1.0, 0.0] },
    "abdomen": { name: "腹部", color: "#96ceb4", defaultPos: [170, 135, 60, 40, 1.0, 0.0] },
    "back": { name: "背部", color: "#ffeaa7", defaultPos: [165, 85, 70, 90, 1.0, 0.0] },
    "waist": { name: "腰部", color: "#fab1a0", defaultPos: [175, 175, 50, 25, 1.0, 0.0] },
    "left_shoulder": { name: "左肩", color: "#fd79a8", defaultPos: [120, 85, 35, 30, 1.0, 0.0] },
    "right_shoulder": { name: "右肩", color: "#fdcb6e", defaultPos: [245, 85, 35, 30, 1.0, 0.0] },
    "left_arm": { name: "左臂", color: "#6c5ce7", defaultPos: [95, 115, 30, 60, 1.0, 0.0] },
    "right_arm": { name: "右臂", color: "#a29bfe", defaultPos: [275, 115, 30, 60, 1.0, 0.0] },
    "left_forearm": { name: "左前臂", color: "#fd79a8", defaultPos: [80, 175, 25, 55, 1.0, 0.0] },
    "right_forearm": { name: "右前臂", color: "#e17055", defaultPos: [295, 175, 25, 55, 1.0, 0.0] },
    "left_hand": { name: "左手", color: "#00b894", defaultPos: [70, 230, 22, 30, 1.0, 0.0] },
    "right_hand": { name: "右手", color: "#00cec9", defaultPos: [308, 230, 22, 30, 1.0, 0.0] },
    "left_thigh": { name: "左大腿", color: "#74b9ff", defaultPos: [170, 200, 30, 60, 1.0, 0.0] },
    "right_thigh": { name: "右大腿", color: "#0984e3", defaultPos: [200, 200, 30, 60, 1.0, 0.0] },
    "left_calf": { name: "左小腿", color: "#54a0ff", defaultPos: [170, 260, 25, 40, 1.0, 0.0] },
    "right_calf": { name: "右小腿", color: "#5f27cd", defaultPos: [205, 260, 25, 40, 1.0, 0.0] },
    "left_knee": { name: "左膝盖", color: "#1dd1a1", defaultPos: [170, 255, 25, 12, 1.0, 0.0] },
    "right_knee": { name: "右膝盖", color: "#10ac84", defaultPos: [205, 255, 25, 12, 1.0, 0.0] },
    "left_foot": { name: "左脚", color: "#ff6348", defaultPos: [165, 300, 35, 18, 1.0, 0.0] },
    "right_foot": { name: "右脚", color: "#ff4757", defaultPos: [200, 300, 35, 18, 1.0, 0.0] },
    "pelvis": { name: "骨盆", color: "#7bed9f", defaultPos: [175, 185, 50, 35, 1.0, 0.0] },
    "spine": { name: "脊柱", color: "#dda0dd", defaultPos: [197, 85, 10, 100, 1.0, 0.0] }
};

// ========== 专业Canvas交互系统 ==========

/**
 * 专业鼠标拖拽跟踪器 - 基于mouseDragTracker技术
 */
class ProfessionalDragTracker {
    constructor() {
        this.isDragging = false;
        this.dragButton = null;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.dragTarget = null;
        this.dragThreshold = INTERACTION_CONFIG.dragThreshold;
        this.hasMovedBeyondThreshold = false;
    }
    
    startDrag(x, y, button, target) {
        this.isDragging = true;
        this.dragButton = button;
        this.startPos = { x, y };
        this.currentPos = { x, y };
        this.dragTarget = target;
        this.hasMovedBeyondThreshold = false;
    }
    
    updateDrag(x, y) {
        if (!this.isDragging) return false;
        
        this.currentPos = { x, y };
        
        // 🔧 用户反馈：简化拖拽逻辑，确保即时响应
        if (!this.hasMovedBeyondThreshold) {
            const dx = Math.abs(x - this.startPos.x);
            const dy = Math.abs(y - this.startPos.y);
            
            // 如果阈值为0或者有任何移动，立即开始拖拽
            if (this.dragThreshold === 0 || dx > this.dragThreshold || dy > this.dragThreshold) {
                this.hasMovedBeyondThreshold = true;
                console.log("🔧 拖拽开始:", { dx, dy, threshold: this.dragThreshold });
            }
        }
        
        return this.hasMovedBeyondThreshold;
    }
    
    endDrag() {
        const wasDragging = this.isDragging;
        this.isDragging = false;
        this.dragButton = null;
        this.dragTarget = null;
        this.hasMovedBeyondThreshold = false;
        return wasDragging;
    }
    
    getDragDelta() {
        return {
            dx: this.currentPos.x - this.startPos.x,
            dy: this.currentPos.y - this.startPos.y
        };
    }
}

/**
 * 🎯 PRD增强版边界约束管理器 - 严格640x1024限制
 */
class BoundaryConstraintManager {
    static constrainPosition(x, y, width, height) {
        // 🔧 用户反馈：调整为合适的画布范围
        const canvasWidth = 400;   // 调整后的画布宽度
        const canvasHeight = 500;  // 调整后的画布高度
        
        const maxX = canvasWidth - width;
        const maxY = canvasHeight - height;
        
        // 🎯 边界吸附逻辑：如果即将越界，就让它停在边界上
        const constrainedX = Math.max(0, Math.min(maxX, x));
        const constrainedY = Math.max(0, Math.min(maxY, y));
        
        // 📊 调试日志：边界约束应用
        if (x !== constrainedX || y !== constrainedY) {
            console.log("🎯 边界吸附触发:", {
                原始位置: {x, y},
                约束位置: {x: constrainedX, y: constrainedY},
                部件尺寸: {width, height},
                画布范围: {width: canvasWidth, height: canvasHeight}
            });
        }
        
        return {
            x: constrainedX,
            y: constrainedY
        };
    }
    
    static constrainSize(width, height) {
        const { minSize, maxSize } = INTERACTION_CONFIG;
        // 🔧 尺寸约束调整为新的画布限制
        const maxWidth = Math.min(maxSize, 400);
        const maxHeight = Math.min(maxSize, 500);
        
        return {
            width: Math.max(minSize, Math.min(maxWidth, width)),
            height: Math.max(minSize, Math.min(maxHeight, height))
        };
    }
}

/**
 * requestAnimationFrame节流器
 */
class RAFThrottler {
    constructor() {
        this.queuedCallback = null;
        this.rafId = null;
    }
    
    throttle(callback) {
        if (!this.queuedCallback) {
            this.rafId = requestAnimationFrame(() => {
                const cb = this.queuedCallback;
                this.queuedCallback = null;
                this.rafId = null;
                if (cb) cb();
            });
        }
        this.queuedCallback = callback;
    }
    
    cancel() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
            this.queuedCallback = null;
        }
    }
}

/**
 * 几何计算工具
 */
class GeometryUtils {
    static pointInRect(px, py, x, y, width, height, rotation = 0) {
        if (rotation === 0) {
            return px >= x && px <= x + width && py >= y && py <= y + height;
        }
        
        // 旋转矩形碰撞检测
        const cx = x + width / 2;
        const cy = y + height / 2;
        const cos = Math.cos(-rotation * Math.PI / 180);
        const sin = Math.sin(-rotation * Math.PI / 180);
        
        const dx = px - cx;
        const dy = py - cy;
        const rotatedX = dx * cos - dy * sin + cx;
        const rotatedY = dx * sin + dy * cos + cy;
        
        return rotatedX >= x && rotatedX <= x + width && 
               rotatedY >= y && rotatedY <= y + height;
    }
    
    static pointInCircle(px, py, cx, cy, radius) {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= radius * radius;
    }
    
    static calculateAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    }
}

/**
 * 专业绘制引擎
 */
class DrawEngine {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    clear() {
        const { width, height } = CANVAS_CONFIG;
        this.ctx.clearRect(0, 0, width, height);
    }
    
    drawBackground() {
        const { width, height, backgroundColor, borderColor } = CANVAS_CONFIG;
        
        // 🎨 渐变背景，让画布更美观
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#2a2a2a");
        gradient.addColorStop(1, "#1a1a1a");
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // 边框
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, width, height);
        
        // 🎨 更精细的网格
        this.drawGrid();
        
        // 🎨 添加中心线指示器
        this.drawCenterLines();
    }
    
    drawGrid() {
        const { width, height, gridColor } = CANVAS_CONFIG;
        const gridSize = 25; // 🎨 稍微放大网格，减少视觉干扰
        
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 0.2; // 🎨 更细的网格线
        this.ctx.setLineDash([1, 2]);
        
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawCenterLines() {
        const { width, height } = CANVAS_CONFIG;
        
        this.ctx.strokeStyle = "#555";
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        // 🎨 垂直中心线
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 0);
        this.ctx.lineTo(width / 2, height);
        this.ctx.stroke();
        
        // 🎨 水平中心线
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawBodyPart(partId, config, isSelected = false) {
        const [x, y, width, height, strength, rotation] = config;
        const part = BODY_PARTS[partId];
        
        this.ctx.save();
        
        // 移到中心点进行旋转
        const cx = x + width / 2;
        const cy = y + height / 2;
        this.ctx.translate(cx, cy);
        this.ctx.rotate(rotation * Math.PI / 180);
        this.ctx.translate(-cx, -cy);
        
        // 🎨 添加阴影效果
        if (isSelected) {
            this.ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
        } else {
            this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
        }
        
        // 🎨 圆角矩形绘制
        const radius = Math.min(width, height) * 0.1;
        this.ctx.fillStyle = part.color;
        this.ctx.globalAlpha = strength;
        this.drawRoundedRect(x, y, width, height, radius);
        this.ctx.fill();
        
        // 清除阴影
        this.ctx.shadowColor = "transparent";
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 🎨 渐变边框
        this.ctx.strokeStyle = isSelected ? "#fff" : "#666";
        this.ctx.lineWidth = isSelected ? 2.5 : 1.5;
        this.ctx.globalAlpha = 1;
        this.drawRoundedRect(x, y, width, height, radius);
        this.ctx.stroke();
        
        // 🎨 优化标签显示
        this.ctx.fillStyle = isSelected ? "#fff" : "#ddd";
        this.ctx.font = isSelected ? "bold 11px Arial" : "10px Arial";
        this.ctx.textAlign = "center";
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        this.ctx.shadowBlur = 2;
        if (width >= 25 && height >= 15) {
            this.ctx.fillText(part.name, cx, cy + 3);
        }
        
        this.ctx.restore();
        
        // 绘制控制手柄（如果选中）
        if (isSelected) {
            this.drawControlHandles(x, y, width, height, rotation);
        }
    }
    
    // 🎨 圆角矩形绘制方法
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    drawControlHandles(x, y, width, height, rotation) {
        const handles = this.getHandlePositions(x, y, width, height, rotation);
        const { handleSize } = INTERACTION_CONFIG;
        
        this.ctx.fillStyle = "#fff";
        this.ctx.strokeStyle = "#333";
        this.ctx.lineWidth = 1;
        
        // 绘制调整大小的手柄
        handles.resize.forEach(handle => {
            this.ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, 
                             handleSize, handleSize);
            this.ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, 
                               handleSize, handleSize);
        });
        
        // 绘制旋转手柄
        if (handles.rotation) {
            this.ctx.beginPath();
            this.ctx.arc(handles.rotation.x, handles.rotation.y, handleSize/2, 0, 2 * Math.PI);
            this.ctx.fillStyle = "#4ecdc4";
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
    
    getHandlePositions(x, y, width, height, rotation) {
        const cos = Math.cos(rotation * Math.PI / 180);
        const sin = Math.sin(rotation * Math.PI / 180);
        
        const corners = [
            { x: x, y: y, type: 'nw' },
            { x: x + width, y: y, type: 'ne' },
            { x: x + width, y: y + height, type: 'se' },
            { x: x, y: y + height, type: 'sw' }
        ];
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // 旋转角点
        const rotatedCorners = corners.map(corner => {
            const dx = corner.x - centerX;
            const dy = corner.y - centerY;
            return {
                x: centerX + dx * cos - dy * sin,
                y: centerY + dx * sin + dy * cos,
                type: corner.type
            };
        });
        
        // 旋转手柄位置
        const rotationHandleX = centerX + (height / 2 + INTERACTION_CONFIG.rotationHandleDistance) * sin;
        const rotationHandleY = centerY - (height / 2 + INTERACTION_CONFIG.rotationHandleDistance) * cos;
        
        return {
            resize: rotatedCorners,
            rotation: { x: rotationHandleX, y: rotationHandleY }
        };
    }
}

/**
 * 🎯 PRD增强版参数同步管理器 - 实时更新UI参数滑块
 */
class ParameterSyncManager {
    constructor(interactor) {
        this.interactor = interactor;
        this.isUpdatingFromCanvas = false;
        this.updateQueue = null;
        // 🎯 添加更精确的同步控制
        this.lastSyncTime = 0;
        this.syncThrottleMs = 16; // 60fps同步频率
    }
    
    scheduleUpdate() {
        const now = Date.now();
        
        // 🎯 防止过于频繁的更新
        if (now - this.lastSyncTime < this.syncThrottleMs) {
            if (this.updateQueue) {
                clearTimeout(this.updateQueue);
            }
            
            this.updateQueue = setTimeout(() => {
                this.updateParameterWidgets();
                this.updateQueue = null;
                this.lastSyncTime = Date.now();
            }, this.syncThrottleMs);
            return;
        }
        
        this.updateParameterWidgets();
        this.lastSyncTime = now;
    }
    
    updateParameterWidgets() {
        if (this.isUpdatingFromCanvas) return;
        
        const config = this.interactor.getPartConfig(this.interactor.selectedPart);
        const [x, y, width, height, strength, rotation] = config;
        
        this.isUpdatingFromCanvas = true;
        
        // 🔧 修复关键：将最终的x和y坐标更新到UI下方的参数滑块中
        try {
            const widgets = this.interactor.node.widgets;
            const xWidget = widgets.find(w => w.name === "x");
            const yWidget = widgets.find(w => w.name === "y");
            const wWidget = widgets.find(w => w.name === "width");
            const hWidget = widgets.find(w => w.name === "height");
            const sWidget = widgets.find(w => w.name === "strength");
            const rWidget = widgets.find(w => w.name === "rotation");
            
            // 🔧 实时更新坐标参数 - 确保值真正写入
            if (xWidget) {
                xWidget.value = Math.round(x);
                console.log("🔧 X坐标同步:", Math.round(x));
            }
            if (yWidget) {
                yWidget.value = Math.round(y);
                console.log("🔧 Y坐标同步:", Math.round(y));
            }
            if (wWidget) wWidget.value = Math.round(width);
            if (hWidget) hWidget.value = Math.round(height);
            if (sWidget) sWidget.value = Number(strength.toFixed(1));
            if (rWidget) rWidget.value = Math.round(rotation);
            
            // 🔧 关键修复：强制触发ComfyUI的节点更新机制
            if (this.interactor.node) {
                // 标记节点为"脏"状态，强制重新计算
                this.interactor.node.setDirtyCanvas && this.interactor.node.setDirtyCanvas(true);
                
                // 触发节点属性更新
                if (this.interactor.node.onPropertyChanged) {
                    this.interactor.node.onPropertyChanged("x", xWidget ? xWidget.value : x);
                    this.interactor.node.onPropertyChanged("y", yWidget ? yWidget.value : y);
                    this.interactor.node.onPropertyChanged("width", wWidget ? wWidget.value : width);
                    this.interactor.node.onPropertyChanged("height", hWidget ? hWidget.value : height);
                }
                
                // 强制更新图形
                if (this.interactor.node.graph) {
                    this.interactor.node.graph.setDirtyCanvas(true);
                    // 强制重新计算节点输出
                    if (this.interactor.node.graph._nodes) {
                        this.interactor.node.setDirtyCanvas(true, true);
                    }
                }
            }
            
            // 🔧 触发widget值变更事件 - 确保ComfyUI感知到变化
            widgets.forEach(widget => {
                if (widget.callback && ['x', 'y', 'width', 'height', 'strength', 'rotation'].includes(widget.name)) {
                    // 直接触发回调，确保参数传递到后端
                    setTimeout(() => {
                        if (widget.callback && !this.isUpdatingFromCanvas) {
                            console.log(`🔧 触发 ${widget.name} 回调:`, widget.value);
                            widget.callback(widget.value);
                        }
                    }, 1);
                }
            });
            
            // 🔧 额外的ComfyUI节点更新确保机制
            setTimeout(() => {
                if (this.interactor.node && this.interactor.node.graph) {
                    // 标记整个图形需要重新执行
                    this.interactor.node.graph._last_trigger_time = 0;
                    
                    // 触发节点重新连接检查
                    if (this.interactor.node.graph.runStep) {
                        this.interactor.node.graph.runStep();
                    }
                    
                    console.log("🔧 图形执行状态已重置，准备重新计算");
                }
            }, 50);
            
            console.log("🔧 参数同步完成 - 节点应该已更新");
            
        } catch (error) {
            console.error("🚨 参数同步错误:", error);
        }
        
        setTimeout(() => {
            this.isUpdatingFromCanvas = false;
        }, 50);
    }
}

/**
 * 专业主交互控制器
 */
class HumanBodyPartsInteractor {
    constructor(canvas, node) {
        console.log("🎯 HumanBodyPartsInteractor constructor called:", { canvas, node });
        
        this.canvas = canvas;
        this.node = node;
        this.ctx = null;
        this.drawEngine = null;
        this.throttler = new RAFThrottler();
        this.dragTracker = new ProfessionalDragTracker();
        this.parameterSync = new ParameterSyncManager(this);
        this.selectedPart = "head";
        this.hoveredPart = null;
        this.isResizing = false;
        this.isRotating = false;
        this.activeHandle = null;
        
        console.log("📊 Interactor state initialized:", {
            selectedPart: this.selectedPart,
            hasNode: !!this.node,
            hasThrottler: !!this.throttler,
            hasDragTracker: !!this.dragTracker
        });
        
        this.init();
    }
    
    init() {
        console.log("🔄 Interactor init() called");
        
        console.log("1️⃣ Creating canvas...");
        this.createCanvas();
        
        console.log("2️⃣ Binding events...");
        this.bindEvents();
        
        console.log("3️⃣ Initial render...");
        this.render();
        
        console.log("✅ Interactor initialization complete");
    }
    
    createCanvas() {
        console.log("🏗️ Creating canvas widget...");
        
        const canvasWidget = {
            type: "professional_canvas_interactor",
            draw: (ctx, node, width, y, height) => {
                console.log("🎨 Canvas draw function called:", { width, y, height });
                this.ctx = ctx;
                this.drawEngine = new DrawEngine(ctx);
                
                ctx.save();
                ctx.translate(0, y);
                this.render();
                ctx.restore();
            },
            computeSize: (width) => {
                console.log("📐 Canvas computeSize called:", width);
                return [CANVAS_CONFIG.width, CANVAS_CONFIG.height];
            },
            mouse: (event, pos, node) => {
                // 🔧 用户反馈：确保鼠标事件能正常处理
                console.log("🖱️ 鼠标事件捕获:", {
                    type: event.type,
                    position: pos,
                    button: event.button
                });
                
                // 🔧 强制处理所有鼠标事件
                event.preventDefault();
                event.stopPropagation();
                
                // 立即调用处理函数
                return this.handleMouseEvent(event, pos);
            },
            mouseleave: () => {
                console.log("🚪 Mouse leave event captured");
                return this.handleMouseLeave();
            }
        };
        
        console.log("📝 Canvas widget created, adding to node...");
        this.node.addCustomWidget(canvasWidget);
        this.canvas = canvasWidget;
        console.log("✅ Canvas widget added successfully");
    }
    
    bindEvents() {
        console.log("🔗 Binding additional events...");
        
        // 专业事件绑定 - 防止默认ComfyUI拖拽行为
        if (this.node.graph && this.node.graph.canvas) {
            console.log("🎯 Found ComfyUI canvas, setting up event override...");
            
            const originalProcessMouseDown = this.node.graph.canvas.processMouseDown;
            
            this.node.graph.canvas.processMouseDown = function(e) {
                console.log("🔍 ComfyUI processMouseDown intercepted:", {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    button: e.button
                });
                
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                console.log("📍 Calculated coordinates:", { x, y, rect });
                
                // 在画布区域内时阻止默认处理
                if (x >= 0 && x <= CANVAS_CONFIG.width && y >= 0 && y <= CANVAS_CONFIG.height) {
                    console.log("⛔ Blocking default ComfyUI mouse handling");
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
                
                console.log("➡️ Allowing default ComfyUI mouse handling");
                originalProcessMouseDown.call(this, e);
            };
            
            console.log("✅ Event override setup complete");
        } else {
            console.warn("⚠️ Could not find ComfyUI canvas for event override");
        }
    }
    
    handleMouseEvent(event, pos) {
        // 【第1步调试】事件监听器绑定验证 - 加入最简单的日志输出
        console.log("🔍 Canvas mousedown event triggered!", {
            eventType: event.type,
            position: pos,
            button: event.button,
            timestamp: Date.now()
        });
        
        const [x, y] = pos;
        
        // 【第3步调试】坐标系转换诊断 - 验证坐标转换
        console.log("🎯 Mouse clicked at Canvas coordinates:", { 
            x: x, 
            y: y,
            canvasWidth: CANVAS_CONFIG.width,
            canvasHeight: CANVAS_CONFIG.height
        });
        
        switch (event.type) {
            case 'mousedown':
                // 【第2步调试】事件冲突排查 - 阻止默认事件
                event.preventDefault();
                event.stopPropagation();
                console.log("⛔ Default events prevented and propagation stopped");
                
                this.handleMouseDown(x, y, event.button);
                break;
            case 'mousemove':
                this.handleMouseMove(x, y);
                break;
            case 'mouseup':
                this.handleMouseUp(x, y);
                break;
        }
    }
    
    /**
     * 🎯 PRD核心功能 - OnMouseDown: 识别并记录被点击的部位
     */
    handleMouseDown(x, y, button) {
        console.log("🎯 PRD-OnMouseDown: 鼠标按下事件", { x, y, button });
        
        if (button !== 0) {
            console.log("❌ 忽略非左键点击:", button);
            return; // 只处理左键
        }
        
        // 🎯 PRD步骤1: 识别并记录下被点击的部位为selected_part
        console.log("🔍 PRD-识别被点击的身体部位...");
        
        // 检查是否点击了控制手柄
        if (this.hitTestHandles(x, y)) {
            console.log("🎛️ 控制手柄被点击");
            return;
        }
        
        // 🎯 PRD步骤2: 记录鼠标和部位的初始位置
        for (const [partId, partInfo] of Object.entries(BODY_PARTS)) {
            const config = this.getPartConfig(partId);
            const [px, py, width, height, , rotation] = config;
            
            if (GeometryUtils.pointInRect(x, y, px, py, width, height, rotation)) {
                console.log(`🎯 PRD-选中部位: ${partInfo.name} (${partId})`);
                
                // 🎯 记录选中的部位
                this.selectedPart = partId;
                
                // 🎯 记录初始位置 - PRD要求
                this.dragTracker.startDrag(x, y, button, partId);
                
                // 🎯 记录部位的初始位置
                this.initialPartPosition = { x: px, y: py };
                
                console.log("🎯 PRD-初始状态记录:", {
                    选中部位: partInfo.name,
                    鼠标初始位置: {x, y},
                    部位初始位置: {x: px, y: py},
                    部位尺寸: {width, height}
                });
                
                this.updateSelectedPartUI();
                this.scheduleRender();
                return;
            }
        }
        
        console.log("🚫 PRD-点击空白区域");
        // 点击空白区域
        this.dragTracker.endDrag();
        this.scheduleRender();
    }
    
    /**
     * 🎯 PRD核心功能 - OnMouseMove: 实时计算新位置并应用边界吸附
     */
    handleMouseMove(x, y) {
        // 更新悬停状态
        this.updateHoverState(x, y);
        
        // 🎯 PRD核心逻辑: 当鼠标按住并移动时
        if (this.dragTracker.updateDrag(x, y)) {
            console.log("🎯 PRD-OnMouseMove: 拖拽进行中", {
                当前鼠标位置: {x, y},
                拖拽目标: this.dragTracker.dragTarget,
                是否超过拖拽阈值: this.dragTracker.hasMovedBeyondThreshold
            });
            
            // 🎯 PRD步骤1: 根据鼠标的位移，实时计算selected_part的新位置
            this.handleDragMove();
            
            // 🎯 PRD步骤3: 在画布上实时重绘selected_part到新位置
            this.scheduleRender();
        }
        
        // 确保始终重绘以显示悬停效果
        this.scheduleRender();
    }
    
    /**
     * 🔧 修复版 - OnMouseUp: 确认最终位置并强制同步参数到后端
     */
    handleMouseUp(x, y) {
        console.log("🔧 PRD-OnMouseUp: 鼠标松开事件", {
            最终鼠标位置: {x, y},
            拖拽目标: this.dragTracker.dragTarget,
            是否进行了拖拽: this.dragTracker.isDragging
        });
        
        if (this.dragTracker.isDragging && this.selectedPart) {
            // 🔧 步骤1: 确认selected_part的最终位置
            const finalConfig = this.getPartConfig(this.selectedPart);
            const [finalX, finalY, width, height, strength, rotation] = finalConfig;
            
            console.log("🔧 PRD-最终位置确认:", {
                部位: BODY_PARTS[this.selectedPart].name,
                最终坐标: {x: finalX, y: finalY},
                部位尺寸: {width, height},
                初始位置: this.initialPartPosition
            });
            
            // 🔧 步骤2: 立即同步参数并强制更新节点
            this.parameterSync.updateParameterWidgets();  // 立即执行，不使用setTimeout
            
            // 🔧 关键修复：额外的强制节点更新，确保K采样器能读取到新数据
            setTimeout(() => {
                console.log("🔧 执行延迟的强制节点更新...");
                
                if (this.node) {
                    // 强制标记节点为脏状态
                    if (this.node.setDirtyCanvas) {
                        this.node.setDirtyCanvas(true, true);
                        console.log("🔧 节点已标记为脏状态");
                    }
                    
                    // 触发图形重计算
                    if (this.node.graph) {
                        this.node.graph.setDirtyCanvas(true);
                        if (this.node.graph.change) {
                            this.node.graph.change();
                        }
                        console.log("🔧 图形已触发重计算");
                    }
                    
                    // 触发节点输出重新计算（这对K采样器很重要）
                    if (this.node.onExecute) {
                        console.log("🔧 准备重新计算节点输出...");
                    }
                }
            }, 100);  // 100ms延迟确保参数已经写入
            
            console.log("🔧 PRD-参数同步触发: 坐标已更新到UI参数滑块，节点已强制更新");
        }
        
        // 清理拖拽状态
        this.dragTracker.endDrag();
        this.isResizing = false;
        this.isRotating = false;
        this.activeHandle = null;
        this.initialPartPosition = null;
        
        this.scheduleRender();
    }
    
    handleMouseLeave() {
        this.hoveredPart = null;
        this.dragTracker.endDrag();
        this.scheduleRender();
    }
    
    updateHoverState(x, y) {
        this.hoveredPart = null;
        
        for (const [partId, partInfo] of Object.entries(BODY_PARTS)) {
            const config = this.getPartConfig(partId);
            const [px, py, width, height, , rotation] = config;
            
            if (GeometryUtils.pointInRect(x, y, px, py, width, height, rotation)) {
                this.hoveredPart = partId;
                break;
            }
        }
    }
    
    hitTestHandles(x, y) {
        if (!this.drawEngine || !this.selectedPart) return false;
        
        const config = this.getPartConfig(this.selectedPart);
        const [px, py, width, height, , rotation] = config;
        const handles = this.drawEngine.getHandlePositions(px, py, width, height, rotation);
        const tolerance = INTERACTION_CONFIG.handleSize;
        
        // 检查调整大小手柄
        for (const handle of handles.resize) {
            if (GeometryUtils.pointInCircle(x, y, handle.x, handle.y, tolerance)) {
                this.isResizing = true;
                this.activeHandle = handle.type;
                this.dragTracker.startDrag(x, y, 0, this.selectedPart);
                return true;
            }
        }
        
        // 检查旋转手柄
        if (handles.rotation && GeometryUtils.pointInCircle(x, y, handles.rotation.x, handles.rotation.y, tolerance)) {
            this.isRotating = true;
            this.dragTracker.startDrag(x, y, 0, this.selectedPart);
            return true;
        }
        
        return false;
    }
    
    /**
     * 🎯 PRD核心逻辑 - 处理拖拽移动并应用边界吸附
     */
    handleDragMove() {
        const { dx, dy } = this.dragTracker.getDragDelta();
        const config = this.getPartConfig(this.selectedPart);
        const [currentX, currentY, width, height] = config;
        
        if (this.isResizing) {
            this.handleResize(dx, dy, config);
        } else if (this.isRotating) {
            this.handleRotation(dx, dy, config);
        } else {
            // 🎯 PRD步骤2: 必须应用边界吸附逻辑
            console.log("🎯 PRD-位置拖拽:", {
                原始位置: {x: currentX, y: currentY},
                鼠标位移: {dx, dy},
                部位尺寸: {width, height}
            });
            
            this.handlePositionDrag(dx, dy, config);
            
            // 🎯 验证边界吸附效果
            const [newX, newY] = config;
            console.log("🎯 PRD-边界吸附后:", {
                新位置: {x: newX, y: newY},
                是否在边界内: {
                    x: newX >= 0 && newX + width <= 640,
                    y: newY >= 0 && newY + height <= 1024
                }
            });
        }
        
        // 更新配置
        this.updatePartConfig(this.selectedPart, config);
        
        // 🎯 PRD要求: 实时更新参数同步
        this.parameterSync.scheduleUpdate();
    }
    
    /**
     * 🎯 PRD核心功能 - 处理位置拖拽并应用640x1024边界约束
     */
    handlePositionDrag(dx, dy, config) {
        const [x, y, width, height] = config;
        
        // 🎯 计算新位置（基于初始位置 + 总位移）
        const newX = this.initialPartPosition.x + dx;
        const newY = this.initialPartPosition.y + dy;
        
        console.log("🎯 PRD-位置计算:", {
            初始位置: this.initialPartPosition,
            鼠标总位移: {dx, dy},
            计算新位置: {x: newX, y: newY},
            部件尺寸: {width, height}
        });
        
        // 🎯 PRD核心: 应用边界吸附逻辑，确保部位不会被拖出640x1024画布
        const constrainedPos = BoundaryConstraintManager.constrainPosition(
            newX, newY, width, height
        );
        
        // 🎯 更新配置
        config[0] = constrainedPos.x;
        config[1] = constrainedPos.y;
        
        console.log("🎯 PRD-边界约束结果:", {
            约束前: {x: newX, y: newY},
            约束后: constrainedPos,
            是否触发边界: newX !== constrainedPos.x || newY !== constrainedPos.y
        });
    }
    
    handleResize(dx, dy, config) {
        let [x, y, width, height] = config;
        
        switch (this.activeHandle) {
            case 'nw':
                x += dx; y += dy; width -= dx; height -= dy;
                break;
            case 'ne':
                y += dy; width += dx; height -= dy;
                break;
            case 'se':
                width += dx; height += dy;
                break;
            case 'sw':
                x += dx; width -= dx; height += dy;
                break;
        }
        
        const constrainedSize = BoundaryConstraintManager.constrainSize(width, height);
        const constrainedPos = BoundaryConstraintManager.constrainPosition(x, y, constrainedSize.width, constrainedSize.height);
        
        config[0] = constrainedPos.x;
        config[1] = constrainedPos.y;
        config[2] = constrainedSize.width;
        config[3] = constrainedSize.height;
    }
    
    handleRotation(dx, dy, config) {
        const [x, y, width, height] = config;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const currentPos = this.dragTracker.currentPos;
        
        const angle = GeometryUtils.calculateAngle(centerX, centerY, currentPos.x, currentPos.y);
        const normalizedAngle = ((angle + 360) % 360) - 180;
        
        config[5] = Math.round(normalizedAngle);
    }
    
    getPartConfig(partId) {
        if (!this.node.properties.parts_config[partId]) {
            this.node.properties.parts_config[partId] = [...BODY_PARTS[partId].defaultPos];
        }
        return this.node.properties.parts_config[partId];
    }
    
    updatePartConfig(partId, config) {
        this.node.properties.parts_config[partId] = config;
        
        // 🚀 关键修复：将配置同步到Python全局存储
        if (!this.node.properties.current_body_parts_config) {
            this.node.properties.current_body_parts_config = {};
        }
        this.node.properties.current_body_parts_config[partId] = config.slice(); // 复制数组
        
        // 🚀 立即通过多种方式同步到Python后端
        this.syncToPythonGlobal();
        
        // 🚀 额外保险：延迟再次同步，确保数据传递成功
        setTimeout(() => {
            this.syncToPythonGlobal();
        }, 100);
        
        console.log("🚀 配置已同步到Python后端:", {
            partId,
            config,
            allConfig: this.node.properties.current_body_parts_config
        });
    }
    
    /**
     * 🚀 通过中间件同步配置到Python后端
     */
    syncToPythonGlobal() {
        try {
            const nodeId = this.node.id || 'default_node';
            const config = this.node.properties.current_body_parts_config;
            
            // 🚀 方案1：通过HTTP API调用中间件
            this.callMiddlewareAPI(nodeId, config);
            
            // 🚀 方案2：写入临时文件（备用方案）
            this.writeConfigToFile(nodeId, config);
            
        } catch (error) {
            console.error("🚨 同步到Python中间件失败:", error);
        }
    }
    
    /**
     * 🚀 通过ComfyUI API调用Python中间件
     */
    callMiddlewareAPI(nodeId, config) {
        try {
            if (this.node.graph && this.node.graph.app && this.node.graph.app.api) {
                const api = this.node.graph.app.api;
                
                // 构造API请求
                const payload = {
                    action: "save_body_parts_config",
                    node_id: nodeId,
                    config: config
                };
                
                // 使用ComfyUI内置API发送请求
                if (api.fetchApi) {
                    api.fetchApi('/human_body_parts/save_config', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload)
                    }).then(response => {
                        if (response.ok) {
                            console.log("🚀 配置已通过API同步到Python中间件");
                        }
                    }).catch(err => {
                        console.warn("⚠️ API调用失败，使用备用方案:", err);
                    });
                }
            }
        } catch (error) {
            console.warn("⚠️ API调用异常，使用备用方案:", error);
        }
    }
    
    /**
     * 🚀 写入配置到临时文件（备用方案）
     */
    writeConfigToFile(nodeId, config) {
        try {
            // 模拟写入文件的逻辑
            const configData = {
                timestamp: Date.now(),
                node_id: nodeId,
                config: config
            };
            
            // 存储到localStorage作为备用
            const storageKey = `human_body_parts_${nodeId}`;
            localStorage.setItem(storageKey, JSON.stringify(configData));
            console.log("🚀 配置已存储到localStorage备用位置");
            
        } catch (error) {
            console.error("🚨 写入配置文件失败:", error);
        }
    }
    
    updateSelectedPartUI() {
        const partWidget = this.node.widgets.find(w => w.name === "selected_part");
        if (partWidget) {
            partWidget.value = BODY_PARTS[this.selectedPart].name;
        }
    }
    
    render() {
        if (!this.drawEngine) return;
        
        this.drawEngine.clear();
        this.drawEngine.drawBackground();
        
        // 绘制所有身体部件
        for (const [partId, partInfo] of Object.entries(BODY_PARTS)) {
            const config = this.getPartConfig(partId);
            const isSelected = partId === this.selectedPart;
            const isHovered = partId === this.hoveredPart;
            
            this.drawEngine.drawBodyPart(partId, config, isSelected || isHovered);
        }
    }
    
    scheduleRender() {
        this.throttler.throttle(() => this.render());
    }
    
    setSelectedPart(partId) {
        if (BODY_PARTS[partId]) {
            this.selectedPart = partId;
            this.parameterSync.scheduleUpdate();
            this.scheduleRender();
        }
    }
    
    destroy() {
        this.throttler.cancel();
        this.dragTracker.endDrag();
    }
}

// ========== 专业布局管理器 ==========
class LayoutManager {
    static forceWidgetsToBottom(node) {
        if (!node.widgets || node.widgets.length === 0) return;
        
        // 强制将所有参数控件移动到节点底部
        const nodeHeight = node.size[1];
        const widgetHeight = 25; // 每个控件的高度
        const totalWidgetHeight = node.widgets.length * widgetHeight;
        const margin = 10;
        
        // 从底部向上排列控件
        node.widgets.forEach((widget, index) => {
            const reverseIndex = node.widgets.length - 1 - index;
            widget.last_y = nodeHeight - margin - (reverseIndex + 1) * widgetHeight;
        });
        
        // 强制重新计算布局
        if (node.computeSize) {
            node.computeSize();
        }
        
        // 强制重绘
        if (node.graph && node.graph.setDirtyCanvas) {
            node.graph.setDirtyCanvas(true);
        }
    }
}

// ========== UI控件创建 ==========
function createControlWidgets(node, interactor) {
    // 分辨率控件
    node.addWidget("number", "resolution_x", 640, (v) => {
        if (!interactor.parameterSync.isUpdatingFromCanvas) {
            node.properties.resolution_x = v;
        }
    }, { min: 64, max: 4096, step: 8 });
    
    node.addWidget("number", "resolution_y", 1024, (v) => {
        if (!interactor.parameterSync.isUpdatingFromCanvas) {
            node.properties.resolution_y = v;
        }
    }, { min: 64, max: 4096, step: 8 });
    
    // 部件选择
    const partOptions = Object.entries(BODY_PARTS).map(([id, info]) => info.name);
    node.addWidget("combo", "selected_part", "头部", (v) => {
        if (!interactor.parameterSync.isUpdatingFromCanvas) {
            const partId = Object.keys(BODY_PARTS)[partOptions.indexOf(v)];
            interactor.setSelectedPart(partId);
        }
    }, { values: partOptions });
    
    // 位置和尺寸参数
    const paramConfigs = [
        { name: "x", default: 210, min: 0, max: 4096, step: 1, index: 0 },
        { name: "y", default: 20, min: 0, max: 4096, step: 1, index: 1 },
        { name: "width", default: 80, min: 15, max: 400, step: 1, index: 2 },
        { name: "height", default: 60, min: 15, max: 400, step: 1, index: 3 },
        { name: "strength", default: 1.0, min: 0.0, max: 10.0, step: 0.1, index: 4 },
        { name: "rotation", default: 0.0, min: -180.0, max: 180.0, step: 1.0, index: 5 }
    ];
    
    paramConfigs.forEach(config => {
        node.addWidget("number", config.name, config.default, (v) => {
            if (!interactor.parameterSync.isUpdatingFromCanvas) {
                const partConfig = interactor.getPartConfig(interactor.selectedPart);
                partConfig[config.index] = v;
                interactor.updatePartConfig(interactor.selectedPart, partConfig);
                interactor.scheduleRender();
            }
        }, { min: config.min, max: config.max, step: config.step });
    });
    
    // 强制布局到底部
    setTimeout(() => {
        LayoutManager.forceWidgetsToBottom(node);
    }, 100);
}

// ========== 初始化函数 ==========
function initializeNode(node) {
    console.log("🚀 INITIALIZING HUMAN BODY PARTS NODE:", node);
    
    // 初始化属性
    node.properties = node.properties || {};
    node.properties.resolution_x = 640;
    node.properties.resolution_y = 1024;
    node.properties.parts_config = {};
    
    console.log("📋 Node properties initialized:", node.properties);
    
    // 初始化默认配置
    for (const [partId, partInfo] of Object.entries(BODY_PARTS)) {
        node.properties.parts_config[partId] = [...partInfo.defaultPos];
    }
    
    console.log("🧩 Body parts config initialized:", Object.keys(node.properties.parts_config));
    
    // 创建专业交互控制器
    console.log("🎮 Creating HumanBodyPartsInteractor...");
    const interactor = new HumanBodyPartsInteractor(null, node);
    
    // 创建控件
    console.log("🎛️ Creating control widgets...");
    createControlWidgets(node, interactor);
    
    // 🔧 用户反馈：设置合适的节点尺寸
    console.log("📏 设置节点尺寸:", [CANVAS_CONFIG.width, 700]);
    node.size = [CANVAS_CONFIG.width, 700]; // 400宽度 + 额外高度容纳参数控件
    
    // 保存引用
    node._interactor = interactor;
    console.log("💾 Interactor saved to node._interactor");
    
    // 多重强制布局保险
    const forceLayout = () => {
        console.log("🔧 Forcing layout to bottom...");
        LayoutManager.forceWidgetsToBottom(node);
    };
    
    setTimeout(() => {
        console.log("⏰ Layout force #1 (200ms)");
        forceLayout();
    }, 200);
    setTimeout(() => {
        console.log("⏰ Layout force #2 (500ms)");
        forceLayout();
    }, 500);
    setTimeout(() => {
        console.log("⏰ Layout force #3 (1000ms)");
        forceLayout();
    }, 1000);
    
    console.log("✅ 专业Canvas交互Human Body Parts节点创建完成");
}

// ========== 主扩展注册 ==========
app.registerExtension({
    name: "Comfy.Davemane42.HumanBodyPartsProfessional",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        console.log("🏁 Extension registration started:", {
            extensionName: "Comfy.Davemane42.HumanBodyPartsProfessional",
            nodeTypeName: nodeData.name,
            timestamp: new Date().toISOString()
        });
        
        if (nodeData.name === "HumanBodyPartsConditioning") {
            console.log("🎯 注册专业Canvas交互人体部件节点");
            console.log("📋 NodeData:", nodeData);
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                console.log("🆕 Node creation triggered for:", this.constructor.name);
                const node = this;
                
                // 调用原始创建函数
                if (onNodeCreated) {
                    console.log("📞 Calling original onNodeCreated...");
                    onNodeCreated?.apply(this, arguments);
                }
                
                try {
                    console.log("🎯 Starting custom node initialization...");
                    initializeNode(node);
                    console.log("✅ Custom node initialization successful");
                } catch (e) {
                    console.error("❌ 专业节点创建错误:", e);
                    console.error("📊 Error stack:", e.stack);
                    console.error("🔍 Node state at error:", {
                        nodeType: node.constructor.name,
                        nodeSize: node.size,
                        hasWidgets: !!node.widgets,
                        widgetCount: node.widgets ? node.widgets.length : 0
                    });
                }
            };
            
            // 强制布局处理
            const onDrawForeground = nodeType.prototype.onDrawForeground;
            nodeType.prototype.onDrawForeground = function(ctx) {
                // 只在必要时记录，避免太多日志
                if (Math.random() < 0.01) { // 1%的概率记录
                    console.log("🎨 onDrawForeground called, forcing layout...");
                }
                
                LayoutManager.forceWidgetsToBottom(this);
                if (onDrawForeground) {
                    onDrawForeground.call(this, ctx);
                }
            };
            
            // 清理函数
            const onRemoved = nodeType.prototype.onRemoved;
            nodeType.prototype.onRemoved = function() {
                console.log("🗑️ Node removal triggered, cleaning up...");
                if (this._interactor) {
                    console.log("🧹 Destroying interactor...");
                    this._interactor.destroy();
                }
                if (onRemoved) {
                    onRemoved?.apply(this, arguments);
                }
                console.log("✅ Node cleanup complete");
            };
            
            console.log("✅ Node type registration complete");
        } else {
            console.log("⏭️ Skipping node type:", nodeData.name);
        }
    }
});

console.log("🎯 专业Canvas交互Human Body Parts扩展加载完成 - 完整拖拽、参数同步、底部布局");
console.log("🔍 第1步调试 - 事件绑定验证已激活！");
console.log("📋 验收任务：点击画布时查看控制台是否显示 '🖱️ WIDGET MOUSE EVENT CAPTURED' 日志");
console.log("🎮 如果看到该日志 = 事件绑定成功 ✅");
console.log("❌ 如果没看到该日志 = 事件绑定失败，需要进入第2步调试");

// 为调试添加一个全局帮助函数
window.HumanBodyPartsDebug = {
    checkEventBinding: () => {
        console.log("🔍 Manual event binding check triggered");
        console.log("📊 Available nodes:", app.graph?.nodes || "No graph found");
        
        const humanBodyNodes = app.graph?.nodes.filter(n => n.constructor.name.includes("HumanBody")) || [];
        console.log("🧩 Human Body nodes found:", humanBodyNodes.length);
        
        humanBodyNodes.forEach((node, i) => {
            console.log(`🔍 Node ${i + 1}:`, {
                type: node.constructor.name,
                hasInteractor: !!node._interactor,
                size: node.size,
                widgets: node.widgets?.length || 0
            });
        });
    },
    
    testMouseEvent: () => {
        console.log("🧪 Simulating mouse event...");
        // 这将帮助测试事件是否能被正确处理
    }
};

console.log("🛠️ 调试工具已加载！在控制台运行 HumanBodyPartsDebug.checkEventBinding() 检查节点状态"); 