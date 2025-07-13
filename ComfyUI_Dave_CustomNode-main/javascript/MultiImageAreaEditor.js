// Made by Davemane42#0042 for ComfyUI - Multi Image Area Editor Frontend
// 多图区域编辑节点前端界面 - 仿照MultiAreaConditioning的可视化拖拽编辑

import { app } from "../../../scripts/app.js";

// 常量定义
const CONSTANTS = {
    CANVAS_HEIGHT: 300,
    TITLE_HEIGHT: 30,
    MIN_AREA_SIZE: 32,
    DEFAULT_RESOLUTION: {
        width: 1024,
        height: 1024
    }
};

// 颜色定义
const COLORS = {
    BACKGROUND: "#2a2a2a",
    BORDER: "#000000",
    AREAS: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24"],
    GRID: "#404040",
    SELECTED: "#ffffff"
};

// 工具函数
const Utils = {
    // 创建自定义整数输入
    createCustomInt: function(node, name, defaultValue, callback, config = {}) {
        const widget = node.addWidget("number", name, defaultValue, callback, {
            min: config.min || 0,
            max: config.max || 2048,
            step: config.step || 1,
            precision: config.precision || 0,
            ...config
        });
        return widget;
    },

    // 创建自定义浮点输入
    createCustomFloat: function(node, name, defaultValue, callback, config = {}) {
        const widget = node.addWidget("number", name, defaultValue, callback, {
            min: config.min || 0.0,
            max: config.max || 1.0,
            step: config.step || 0.1,
            precision: config.precision || 2,
            ...config
        });
        return widget;
    },

    // 创建自定义布尔输入
    createCustomBoolean: function(node, name, defaultValue, callback) {
        const widget = node.addWidget("toggle", name, defaultValue, callback);
        return widget;
    },

    // 创建自定义下拉选择
    createCustomCombo: function(node, name, defaultValue, options, callback) {
        const widget = node.addWidget("combo", name, defaultValue, callback, {
            values: options
        });
        return widget;
    },

    // 区域变换函数 - 增强版，支持实时更新和重绘
    transformFunc: function(widget, value, node, index) {
        try {
            if (!node.properties || !node.properties["area_configs"]) return;
            
            const selectedIndex = Math.round(node.widgets.find(w => w.name === "selected_image")?.value || 0);
            if (!node.properties["area_configs"][selectedIndex]) return;
            
            // 更新对应的配置值
            node.properties["area_configs"][selectedIndex][index] = value;
            
            console.log(`🔧 更新图像${selectedIndex + 1}的参数[${index}]: ${value}`);
            
            // 强制重绘画布
            if (node.setDirtyCanvas) {
                node.setDirtyCanvas(true);
            }
            
            // 触发ComfyUI画布更新
            if (app.canvas) {
                app.canvas.setDirty(true);
                app.canvas.draw(true, true);
            }
            
            // 如果是enabled参数，特别处理
            if (index === 6) {
                console.log(`🎛️ 图像${selectedIndex + 1} ${value ? '已启用' : '已禁用'}`);
            }
            
        } catch (error) {
            console.error("Transform func error:", error);
        }
    }
};

// 布局管理器
const LayoutManager = {
    computeCanvasSize: function(node, size) {
        const parameterCount = node.widgets ? node.widgets.length : 10;
        const dynamicHeight = CONSTANTS.CANVAS_HEIGHT + CONSTANTS.TITLE_HEIGHT + (parameterCount * 30) + 20;
        
        if (size[1] < dynamicHeight) {
            size[1] = dynamicHeight;
        }
        
        node.canvasHeight = CONSTANTS.CANVAS_HEIGHT;
        return size;
    }
};

// 绘制引擎
const DrawEngine = {
    drawGrid: function(ctx, x, y, width, height, outputWidth, outputHeight, scale) {
        const gridSize = 64;
        const scaledGridSize = gridSize * scale;
        
        ctx.strokeStyle = COLORS.GRID;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        // 绘制垂直线
        for (let i = 0; i < outputWidth; i += gridSize) {
            const lineX = x + (i * scale);
            if (lineX <= x + width) {
                ctx.beginPath();
                ctx.moveTo(lineX, y);
                ctx.lineTo(lineX, y + height);
                ctx.stroke();
            }
        }
        
        // 绘制水平线
        for (let i = 0; i < outputHeight; i += gridSize) {
            const lineY = y + (i * scale);
            if (lineY <= y + height) {
                ctx.beginPath();
                ctx.moveTo(x, lineY);
                ctx.lineTo(x + width, lineY);
                ctx.stroke();
            }
        }
        
        ctx.globalAlpha = 1.0;
    },

    drawAreaRect: function(ctx, x, y, width, height, color, selected = false) {
        // 绘制区域背景
        ctx.fillStyle = color || COLORS.AREAS[0];
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y, width, height);
        
        // 绘制区域边框
        ctx.strokeStyle = selected ? COLORS.SELECTED : (color || COLORS.AREAS[0]);
        ctx.lineWidth = selected ? 3 : 2;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(x, y, width, height);
        
        // 绘制选中状态的角标
        if (selected) {
            ctx.fillStyle = COLORS.SELECTED;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x - 3, y - 3, 6, 6);
            ctx.fillRect(x + width - 3, y - 3, 6, 6);
            ctx.fillRect(x - 3, y + height - 3, 6, 6);
            ctx.fillRect(x + width - 3, y + height - 3, 6, 6);
        }
        
        ctx.globalAlpha = 1.0;
    }
};

// 画布添加函数
function addMultiImageAreaCanvas(node, app) {
    const widget = {
        name: "multi_image_area_canvas",
        type: "custom",
        
        draw: function(ctx, node, widgetWidth, widgetY, widgetHeight) {
            try {
                // 检查可见性
                const visible = app.canvas && app.canvas.ds && app.canvas.ds.scale > 0.6;
                if (!visible) return;

                const margin = 10;
                
                // 获取区域配置
                const areaConfigs = node.properties["area_configs"] || [
                    [0, 0, 256, 256, 1.0, 0.0, true],      // 图像1
                    [256, 0, 256, 256, 1.0, 0.0, false],   // 图像2
                    [0, 256, 256, 256, 1.0, 0.0, false],   // 图像3
                    [256, 256, 256, 256, 1.0, 0.0, false], // 图像4
                ];
                
                const outputWidth = node.properties["output_width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                const outputHeight = node.properties["output_height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                
                if (!node.widgets || node.imageIndex === undefined || !node.widgets[node.imageIndex]) {
                    return;
                }
                
                const curIndex = Math.round(node.widgets[node.imageIndex].value || 0);
                const canvasHeight = this.h || node.canvasHeight || CONSTANTS.CANVAS_HEIGHT;
                
                // 计算缩放
                const scale = Math.min(
                    (widgetWidth - margin * 2) / outputWidth, 
                    (canvasHeight - margin * 2) / outputHeight
                );

                const backgroundWidth = outputWidth * scale;
                const backgroundHeight = outputHeight * scale;
                
                // 居中显示
                const backgroundX = margin + (widgetWidth - backgroundWidth - margin * 2) / 2;
                const backgroundY = margin;

                // 绘制黑色边框
                ctx.fillStyle = COLORS.BORDER;
                ctx.fillRect(backgroundX - 2, backgroundY - 2, backgroundWidth + 4, backgroundHeight + 4);
                
                // 绘制主背景
                ctx.fillStyle = COLORS.BACKGROUND;
                ctx.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);

                // 绘制网格
                DrawEngine.drawGrid(ctx, backgroundX, backgroundY, backgroundWidth, backgroundHeight, 
                                  outputWidth, outputHeight, scale);

                // 绘制所有图像区域（非选中状态）
                for (let i = 0; i < areaConfigs.length; i++) {
                    if (i === curIndex) continue;
                    
                    const config = areaConfigs[i];
                    if (!config || config.length < 7 || !config[6]) continue; // 未启用
                    
                    let x = Math.max(0, config[0] || 0);
                    let y = Math.max(0, config[1] || 0);
                    let w = Math.max(CONSTANTS.MIN_AREA_SIZE, config[2] || 256);
                    let h = Math.max(CONSTANTS.MIN_AREA_SIZE, config[3] || 256);
                    
                    if (x >= outputWidth || y >= outputHeight) continue;
                    if (x + w > outputWidth) w = outputWidth - x;
                    if (y + h > outputHeight) h = outputHeight - y;
                    if (w <= 0 || h <= 0) continue;

                    let areaX = backgroundX + (x * scale);
                    let areaY = backgroundY + (y * scale);
                    let areaW = w * scale;
                    let areaH = h * scale;

                    const color = COLORS.AREAS[i % COLORS.AREAS.length];
                    DrawEngine.drawAreaRect(ctx, areaX, areaY, areaW, areaH, color, false);
                    
                    // 绘制图像标签
                    if (areaW >= 50 && areaH >= 30) {
                        ctx.fillStyle = "#ffffff";
                        ctx.font = "12px Arial";
                        ctx.textAlign = "center";
                        ctx.fillText(`图${i + 1}`, areaX + areaW / 2, areaY + areaH / 2 + 4);
                    }
                }

                // 绘制当前选中区域（高亮显示）- 修复所有图像选择显示问题
                if (curIndex < areaConfigs.length) {
                    const config = areaConfigs[curIndex];
                    if (config && config.length >= 7) { // 移除启用检查，所有图像都应显示编辑框
                        let x = Math.max(0, config[0] || 0);
                        let y = Math.max(0, config[1] || 0);
                        let w = Math.max(CONSTANTS.MIN_AREA_SIZE, config[2] || 256);
                        let h = Math.max(CONSTANTS.MIN_AREA_SIZE, config[3] || 256);
                        
                        // 确保区域在画布范围内
                        if (x >= outputWidth) x = outputWidth - w;
                        if (y >= outputHeight) y = outputHeight - h;
                        if (x + w > outputWidth) w = outputWidth - x;
                        if (y + h > outputHeight) h = outputHeight - y;
                        
                        // 确保最小尺寸
                        w = Math.max(CONSTANTS.MIN_AREA_SIZE, w);
                        h = Math.max(CONSTANTS.MIN_AREA_SIZE, h);
                        
                        if (w > 0 && h > 0) {
                            let areaX = backgroundX + (x * scale);
                            let areaY = backgroundY + (y * scale);
                            let areaW = w * scale;
                            let areaH = h * scale;

                            // 绘制选中区域（高亮显示）
                            const color = COLORS.AREAS[curIndex % COLORS.AREAS.length];
                            DrawEngine.drawAreaRect(ctx, areaX, areaY, areaW, areaH, color, true);
                            
                            // 绘制图像标签
                            ctx.fillStyle = "#ffffff";
                            ctx.font = "14px Arial";
                            ctx.textAlign = "center";
                            ctx.fillText(`图${curIndex + 1}`, areaX + areaW / 2, areaY + areaH / 2 + 5);
                            
                            // 绘制选中状态指示
                            ctx.fillStyle = config[6] ? "#00ff00" : "#ff6666"; // 绿色=启用，红色=禁用
                            ctx.beginPath();
                            ctx.arc(areaX + areaW - 10, areaY + 10, 5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }

                // 绘制左侧连接指示器 - 显示自动启用逻辑
                for (let i = 0; i < 4; i++) {
                    const config = areaConfigs[i];
                    const enabled = config && config[6];
                    const isInUseRange = i <= curIndex; // 在使用范围内
                    const indicatorY = backgroundY + (i * 30) + 15;
                    
                    if (enabled) {
                        // 启用的图像显示对应颜色
                        ctx.fillStyle = COLORS.AREAS[i % COLORS.AREAS.length];
                        ctx.beginPath();
                        ctx.arc(backgroundX - 15, indicatorY, 6, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 当前选中的图像加白色边框
                        if (i === curIndex) {
                            ctx.strokeStyle = "#ffffff";
                            ctx.lineWidth = 3;
                            ctx.stroke();
                        }
                    } else {
                        // 禁用的图像显示灰色
                        ctx.strokeStyle = "#666666";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(backgroundX - 15, indicatorY, 6, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    
                    // 在使用范围内但未启用的图像显示橙色警告
                    if (isInUseRange && !enabled) {
                        ctx.fillStyle = "#ff9900";
                        ctx.beginPath();
                        ctx.arc(backgroundX - 15, indicatorY, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    // 在指示器旁边显示图像编号
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "8px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(`${i + 1}`, backgroundX - 15, indicatorY - 10);
                }

                // 绘制简化的状态信息
                const enabledCount = areaConfigs.filter(c => c && c[6]).length;
                const currentConfig = areaConfigs[curIndex];
                const totalImages = curIndex + 1; // 当前选定图像意味着使用的图像总数
                
                // 右上角显示简洁状态
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fillRect(backgroundX + backgroundWidth - 120, backgroundY + 5, 115, 65);
                
                ctx.fillStyle = "#ffffff";
                ctx.font = "10px Arial";
                ctx.textAlign = "left";
                
                ctx.fillText(`📍 当前: 图像${curIndex + 1}`, backgroundX + backgroundWidth - 115, backgroundY + 18);
                ctx.fillText(`🎯 使用: ${totalImages}张图像`, backgroundX + backgroundWidth - 115, backgroundY + 30);
                ctx.fillText(`✅ 启用: ${enabledCount}个`, backgroundX + backgroundWidth - 115, backgroundY + 42);
                ctx.fillText(`📝 文本控制区域编辑`, backgroundX + backgroundWidth - 115, backgroundY + 54);
                
                // 显示当前图像状态
                if (currentConfig && currentConfig[6]) {
                    ctx.fillStyle = "#00ff00";
                    ctx.fillText("● 当前已启用", backgroundX + backgroundWidth - 115, backgroundY + 66);
                } else {
                    ctx.fillStyle = "#ff6666";
                    ctx.fillText("○ 当前已禁用", backgroundX + backgroundWidth - 115, backgroundY + 66);
                }

            } catch (error) {
                console.error("Canvas draw error:", error);
            }
        }
    };

    node.addCustomWidget(widget);
    return { minWidth: 420, minHeight: CONSTANTS.CANVAS_HEIGHT + CONSTANTS.TITLE_HEIGHT + 200 };
}

// ========== 主扩展注册 ==========
app.registerExtension({
    name: "Comfy.Davemane42.MultiImageAreaEditor.TextControl",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "MultiImageAreaEditor") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;

            nodeType.prototype.onNodeCreated = function () {
                const node = this;
                onNodeCreated?.apply(this, arguments);

                try {
                    console.log("🎨 创建多图区域编辑节点 - 文本控制版");
                    
                    // 初始化属性
                    if (!node.properties || !node.properties["area_configs"]) {
                        node.properties = {
                            "area_configs": [
                                [0, 0, 256, 256, 1.0, 0.0, true],      // 图像1: [x, y, w, h, strength, rotation, enabled]
                                [256, 0, 256, 256, 1.0, 0.0, false],   // 图像2
                                [0, 256, 256, 256, 1.0, 0.0, false],   // 图像3
                                [256, 256, 256, 256, 1.0, 0.0, false], // 图像4
                            ],
                            "output_width": CONSTANTS.DEFAULT_RESOLUTION.width,
                            "output_height": CONSTANTS.DEFAULT_RESOLUTION.height
                        };
                    }

                    // 添加画布控件
                    addMultiImageAreaCanvas(node, app);

                    // 添加图像选择器
                    node.imageIndex = node.widgets.length;
                    node.addWidget("slider", "selected_image", 0, function (v) { 
                        try {
                            const selectedIndex = Math.round(v);
                            const enabledCount = selectedIndex + 1; // 选定图像N就启用N个图像
                            console.log(`🖼️ 切换到图像 ${selectedIndex + 1}，自动启用前${enabledCount}个图像`);
                            
                            if (node.properties["area_configs"] && selectedIndex < node.properties["area_configs"].length) {
                                // 自动启用/禁用图像：选定图像N就启用前N个图像
                                for (let i = 0; i < node.properties["area_configs"].length; i++) {
                                    if (i < enabledCount) {
                                        // 启用前N个图像
                                        node.properties["area_configs"][i][6] = true;
                                        console.log(`✅ 自动启用图像${i + 1}`);
                                    } else {
                                        // 禁用后面的图像
                                        node.properties["area_configs"][i][6] = false;
                                        console.log(`❌ 自动禁用图像${i + 1}`);
                                    }
                                }
                                
                                const config = node.properties["area_configs"][selectedIndex];
                                
                                // 更新最后7个控件：x, y, width, height, strength, rotation, enabled
                                const bottomInputs = node.widgets.slice(-7);
                                for (let i = 0; i < Math.min(7, bottomInputs.length); i++) {
                                    if (bottomInputs[i]) {
                                        bottomInputs[i].value = config[i] || (i === 4 ? 1.0 : (i === 6 ? true : 0.0));
                                    }
                                }
                                
                                // 特别更新enabled控件为当前图像的状态
                                const enabledWidget = node.widgets.find(w => w.name === "enabled");
                                if (enabledWidget) {
                                    enabledWidget.value = config[6];
                                }
                                
                                // 强制重绘画布以显示正确的选中区域
                                if (node.setDirtyCanvas) {
                                    node.setDirtyCanvas(true);
                                }
                                
                                // 触发画布更新
                                if (app.canvas) {
                                    app.canvas.setDirty(true);
                                }
                                
                                console.log(`📊 当前状态：图像${selectedIndex + 1}已选中，前${enabledCount}个图像已启用`);
                            }
                        } catch (error) {
                            console.error("Image selection error:", error);
                        }
                    }, { min: 0, max: 3, step: 1, precision: 0 });

                    // 添加区域控制参数（x, y, width, height, strength, rotation, enabled）
                    const names = ["x", "y", "width", "height", "strength", "rotation"];
                    const defaultValues = [0, 0, 256, 256, 1.0, 0.0];
                    
                    for (let i = 0; i < 6; i++) {
                        let config = {};
                        if (i === 4) { // strength
                            config = { min: 0.0, max: 2.0, step: 0.1, precision: 2 };
                        } else if (i === 5) { // rotation
                            config = { min: -180.0, max: 180.0, step: 1.0, precision: 1 };
                        } else if (i >= 2) { // width, height
                            config = { min: 32, max: 1024, step: 1 };
                        }
                        
                        Utils.createCustomInt(node, names[i], defaultValues[i], function (v) {
                            Utils.transformFunc(this, v, node, i);
                        }, config);
                    }
                    
                    // 添加启用/禁用控件
                    node.addWidget("toggle", "enabled", true, function (v) {
                        Utils.transformFunc(this, v, node, 6);
                    });

                    // 设置节点尺寸 - 动态计算高度
                    setTimeout(() => {
                        LayoutManager.computeCanvasSize(node, node.size);
                        // 强制设置节点最小宽度
                        if (node.size[0] < 450) {
                            node.size[0] = 450;
                        }
                        // 初始化完成
                    }, 150);

                    // 鼠标交互 - 拖拽功能
                    let isDragging = false;
                    let dragStart = null;
                    let originalArea = null;
                    
                    const onMouseDown = node.onMouseDown;
                    node.onMouseDown = function (event, pos, canvas) {
                        try {
                            if (!node.widgets || node.imageIndex === undefined || !node.widgets[node.imageIndex]) {
                                return onMouseDown?.apply(this, arguments);
                            }
                            
                            const index = Math.round(node.widgets[node.imageIndex].value);
                            const configs = node.properties["area_configs"];

                            if (!configs || index >= configs.length) {
                                return onMouseDown?.apply(this, arguments);
                            }

                            const outputWidth = node.properties["output_width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                            const outputHeight = node.properties["output_height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                            const canvasHeight = node.canvasHeight || CONSTANTS.CANVAS_HEIGHT;
                            const margin = 10;
                            const widgetWidth = node.size[0];

                            const scale = Math.min(
                                (widgetWidth - margin*2)/outputWidth, 
                                (canvasHeight - margin*2)/outputHeight
                            );

                            const backgroundWidth = outputWidth * scale;
                            const backgroundHeight = outputHeight * scale;
                            const backgroundX = margin + (widgetWidth - backgroundWidth - margin * 2) / 2;
                            const backgroundY = margin;

                            const relativeX = pos[0] - backgroundX;
                            const canvasOffsetY = CONSTANTS.TITLE_HEIGHT;
                            const relativeY = pos[1] - backgroundY - canvasOffsetY;

                            if (relativeX >= 0 && relativeX <= backgroundWidth && 
                                relativeY >= 0 && relativeY <= backgroundHeight) {

                                // 获取当前区域信息
                                const config = configs[index];
                                let areaX = Math.max(0, config[0] || 0);
                                let areaY = Math.max(0, config[1] || 0);
                                let areaW = Math.max(32, config[2] || 256);
                                let areaH = Math.max(32, config[3] || 256);
                                
                                const screenAreaX = backgroundX + (areaX * scale);
                                const screenAreaY = backgroundY + (areaY * scale);
                                const screenAreaW = areaW * scale;
                                const screenAreaH = areaH * scale;
                                
                                const mouseX = pos[0];
                                const mouseY = pos[1] - canvasOffsetY;
                                
                                // 如果已经在拖拽状态，点击任何位置都停止拖拽
                                if (isDragging) {
                                    isDragging = false;
                                    dragStart = null;
                                    originalArea = null;
                                    canvas.style.cursor = 'default';
                                    return true;
                                }
                                
                                // 检查是否点击在区域内（开始拖拽）或点击空白处（设置新位置）
                                if (mouseX >= screenAreaX && mouseX <= screenAreaX + screenAreaW &&
                                    mouseY >= screenAreaY && mouseY <= screenAreaY + screenAreaH) {
                                    // 点击在区域内，开始拖拽模式
                                    isDragging = true;
                                    dragStart = { x: mouseX, y: mouseY };
                                    originalArea = { x: areaX, y: areaY };
                                    canvas.style.cursor = 'move';
                                } else {
                                    // 点击空白处，直接设置新位置
                                    const x = Math.round((relativeX / backgroundWidth) * outputWidth);
                                    const y = Math.round((relativeY / backgroundHeight) * outputHeight);
                                    
                                    // 确保区域不超出边界
                                    const clampedX = Math.max(0, Math.min(outputWidth - areaW, x));
                                    const clampedY = Math.max(0, Math.min(outputHeight - areaH, y));

                                    configs[index][0] = clampedX;
                                    configs[index][1] = clampedY;

                                    // 更新位置控件
                                    const xWidget = node.widgets.find(w => w.name === "x");
                                    const yWidget = node.widgets.find(w => w.name === "y");
                                    if (xWidget) xWidget.value = clampedX;
                                    if (yWidget) yWidget.value = clampedY;
                                }

                                return true;
                            }

                            return onMouseDown?.apply(this, arguments);
                        } catch (error) {
                            console.error("Mouse down error:", error);
                            return onMouseDown?.apply(this, arguments);
                        }
                    };
                    
                    // 鼠标移动 - 拖拽时实时跟随
                    const onMouseMove = node.onMouseMove;
                    node.onMouseMove = function (event, pos, canvas) {
                        try {
                            if (isDragging) {
                                const index = Math.round(node.widgets[node.imageIndex].value);
                                const configs = node.properties["area_configs"];
                                const outputWidth = node.properties["output_width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                                const outputHeight = node.properties["output_height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                                const canvasHeight = node.canvasHeight || CONSTANTS.CANVAS_HEIGHT;
                                const margin = 10;
                                const widgetWidth = node.size[0];

                                const scale = Math.min(
                                    (widgetWidth - margin*2)/outputWidth, 
                                    (canvasHeight - margin*2)/outputHeight
                                );

                                const backgroundWidth = outputWidth * scale;
                                const backgroundHeight = outputHeight * scale;
                                const backgroundX = margin + (widgetWidth - backgroundWidth - margin * 2) / 2;
                                const backgroundY = margin;

                                // 计算鼠标在画布上的相对位置
                                const relativeX = pos[0] - backgroundX;
                                const canvasOffsetY = CONSTANTS.TITLE_HEIGHT;
                                const relativeY = pos[1] - backgroundY - canvasOffsetY;

                                // 转换为实际坐标
                                const mouseRealX = (relativeX / backgroundWidth) * outputWidth;
                                const mouseRealY = (relativeY / backgroundHeight) * outputHeight;
                                
                                // 获取当前区域的宽度和高度（保持不变）
                                const currentW = configs[index][2] || 256;
                                const currentH = configs[index][3] || 256;
                                
                                // 计算新位置（区域中心跟随鼠标）
                                let newX = mouseRealX - currentW / 2;
                                let newY = mouseRealY - currentH / 2;
                                
                                // 确保不超出边界
                                newX = Math.max(0, Math.min(outputWidth - currentW, newX));
                                newY = Math.max(0, Math.min(outputHeight - currentH, newY));
                                
                                // 只更新位置，不改变大小
                                configs[index][0] = Math.round(newX);
                                configs[index][1] = Math.round(newY);
                                
                                // 只更新位置控件
                                const xWidget = node.widgets.find(w => w.name === "x");
                                const yWidget = node.widgets.find(w => w.name === "y");
                                
                                if (xWidget) xWidget.value = Math.round(newX);
                                if (yWidget) yWidget.value = Math.round(newY);
                                
                                return true;
                            }
                            
                            return onMouseMove?.apply(this, arguments);
                        } catch (error) {
                            console.error("Mouse move error:", error);
                            return onMouseMove?.apply(this, arguments);
                        }
                    };
                    
                    // 鼠标释放
                    const onMouseUp = node.onMouseUp;
                    node.onMouseUp = function (event, pos, canvas) {
                        try {
                            // 在点击开关式拖拽中，鼠标释放不结束拖拽状态
                            // 拖拽状态只有在再次点击时才会结束
                            
                            return onMouseUp?.apply(this, arguments);
                        } catch (error) {
                            console.error("Mouse up error:", error);
                            return onMouseUp?.apply(this, arguments);
                        }
                    };

                    // 右键菜单
                    const onContextMenu = node.onContextMenu;
                    node.onContextMenu = function (menu, event) {
                        try {
                            menu.addItem({
                                content: "📖 使用说明",
                                callback: () => {
                                    alert(`🎨 多图区域编辑器使用说明

🔧 自动启用功能：
• 选定图像滑块拉到2 → 自动启用图像1和2
• 选定图像滑块拉到3 → 自动启用图像1、2和3  
• 选定图像滑块拉到4 → 自动启用全部4张图像

📝 文本控制功能：
• 每个图像都有对应的文本输入框
• 使用image_1_prompt到image_4_prompt控制各区域编辑
• 文本中包含"强烈"/"明显"会增强效果
• 文本中包含"轻微"/"淡化"会减弱效果

🎯 视觉指示：
• 🟢 绿色圆点 = 图像已启用
• 🔴 红色圆点 = 图像已禁用  
• ⚪ 白色边框 = 当前选中图像
• 🟠 橙色警告 = 应启用但未启用

🖱️ 交互操作：
• 点击区域内开始拖拽
• 点击空白处直接定位
• 再次点击停止拖拽`);
                                }
                            });

                            menu.addItem({
                                content: "🎨 Kontext快速设置",
                                callback: () => {
                                    // 显示Kontext设置对话框
                                    console.log("Kontext设置对话框");
                                }
                            });

                            menu.addItem({
                                content: "🔄 重置当前区域",
                                callback: () => {
                                    if (node.properties && node.properties["area_configs"]) {
                                        const index = Math.round(node.widgets[node.imageIndex].value);
                                        node.properties["area_configs"][index] = [0, 0, 256, 256, 1.0, 0.0, true];
                                        
                                        // 更新控件值
                                        const controlNames = ["x", "y", "width", "height", "strength", "rotation"];
                                        const defaultValues = [0, 0, 256, 256, 1.0, 0.0];
                                        controlNames.forEach((name, i) => {
                                            const widget = node.widgets.find(w => w.name === name);
                                            if (widget) widget.value = defaultValues[i];
                                        });
                                        
                                        const enabledWidget = node.widgets.find(w => w.name === "enabled");
                                        if (enabledWidget) enabledWidget.value = true;
                                    }
                                }
                            });

                            menu.addItem({
                                content: "✅ 启用当前图像",
                                callback: () => {
                                    if (node.properties && node.properties["area_configs"]) {
                                        const index = Math.round(node.widgets[node.imageIndex].value);
                                        node.properties["area_configs"][index][6] = true;
                                        
                                        const enabledWidget = node.widgets.find(w => w.name === "enabled");
                                        if (enabledWidget) enabledWidget.value = true;
                                    }
                                }
                            });

                            menu.addItem({
                                content: "❌ 禁用当前图像",
                                callback: () => {
                                    if (node.properties && node.properties["area_configs"]) {
                                        const index = Math.round(node.widgets[node.imageIndex].value);
                                        node.properties["area_configs"][index][6] = false;
                                        
                                        const enabledWidget = node.widgets.find(w => w.name === "enabled");
                                        if (enabledWidget) enabledWidget.value = false;
                                    }
                                }
                            });

                            onContextMenu?.apply(this, arguments);
                        } catch (error) {
                            console.error("Context menu error:", error);
                            onContextMenu?.apply(this, arguments);
                        }
                    };

                    console.log("✅ 多图区域编辑节点创建完成 - 已启用文本控制功能");

                } catch (error) {
                    console.error("❌ 多图区域编辑节点创建失败:", error);
                }
            };
        }
    }
}); 