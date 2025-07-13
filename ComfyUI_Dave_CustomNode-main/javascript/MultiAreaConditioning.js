/**
 * MultiAreaConditioning.js
 * Fully Compatible with ComfyUI v0.3.43 Frontend API
 * 
 * @description 多区域条件控制的前端可视化界面，支持点击开关式拖拽交互
 * @author Davemane42
 * @version 2.5.4
 * @updated 2025-01-27
 * @comfyui_version 0.3.43
 * @frontend_api_version 1.23.4
 */

import { app } from "/scripts/app.js";

// 常量定义
const CONSTANTS = {
    CANVAS_HEIGHT: 250,
    WIDGET_HEIGHT: 30,
    TITLE_HEIGHT: 70,
    MARGIN: 15,
    GRID_SIZE: 64,
    MIN_AREA_SIZE: 32,
    DEFAULT_RESOLUTION: { width: 512, height: 384 },
    COLORS: {
        BACKGROUND: "#404040",
        BORDER: "#000000",
        GRID: "#606060",
        SELECTED: "#8B5CF6",
        SELECTED_BORDER: "#FFFFFF",
        AREAS: ["#8B7355", "#7B8B55", "#5B8B75", "#6B5B8B"]
    }
};

// 实用工具函数
const Utils = {
    /**
     * 创建自定义数字输入控件
     * Create custom number input widget compatible with v0.3.43
     */
    createCustomInt: function(node, inputName, val, func, config = {}) {
        const defaultConfig = { 
            min: 0, 
            max: 4096, 
            step: 640, 
            precision: 0 
        };
        
        return node.addWidget(
            "number",
            inputName,
            val,
            func, 
            Object.assign({}, defaultConfig, config)
        );
    },

    /**
     * 递归查找上游连接
     * Recursive link upstream search compatible with v0.3.43
     */
    recursiveLinkUpstream: function(node, type, depth, index = null) {
        depth += 1;
        let connections = [];
        const inputList = (index !== null) ? [index] : [...Array(node.inputs.length).keys()];
        
        if (inputList.length === 0) { 
            return connections; 
        }
        
        for (let i of inputList) {
            const link = node.inputs[i].link;
            if (link) {
                const nodeID = node.graph.links[link].origin_id;
                const slotID = node.graph.links[link].origin_slot;
                const connectedNode = node.graph._nodes_by_id[nodeID];

                if (connectedNode && connectedNode.outputs[slotID] && 
                    connectedNode.outputs[slotID].type === type) {
                    connections.push([connectedNode.id, depth]);

                    if (connectedNode.inputs) {
                        const index = (connectedNode.type === "LatentComposite") ? 0 : null;
                        connections = connections.concat(
                            this.recursiveLinkUpstream(connectedNode, type, depth, index)
                        );
                    }
                }
            }
        }
        return connections;
    },

    /**
     * 参数变换函数
     * Parameter transformation function for v0.3.43 compatibility
     */
    transformFunc: function(widget, value, node, index) {
        try {
            const s = widget.options.step / 10;
            widget.value = Math.round(value / s) * s;
            
            if (node.properties && node.properties["values"] && 
                node.widgets && node.index !== undefined &&
                node.widgets[node.index] && node.widgets[node.index].value !== undefined) {
                
                const selectedIndex = Math.round(node.widgets[node.index].value);
                if (selectedIndex >= 0 && selectedIndex < node.properties["values"].length) {
                    node.properties["values"][selectedIndex][index] = widget.value;
                }
            }
        } catch (error) {
            console.error("Parameter transformation error:", error);
        }
    },

    /**
     * 交换输入连接
     * Swap input connections with v0.3.43 compatibility
     */
    swapInputs: function(node, indexA, indexB) {
        try {
            const linkA = node.inputs[indexA].link;
            let origin_slotA = null;
            let node_IDA = null;
            let connectedNodeA = null;
            let labelA = node.inputs[indexA].label || null;

            const linkB = node.inputs[indexB].link;
            let origin_slotB = null;
            let node_IDB = null;
            let connectedNodeB = null;
            let labelB = node.inputs[indexB].label || null;

            if (linkA) {
                node_IDA = node.graph.links[linkA].origin_id;
                origin_slotA = node.graph.links[linkA].origin_slot;
                connectedNodeA = node.graph._nodes_by_id[node_IDA];
                node.disconnectInput(indexA);
            }

            if (linkB) {
                node_IDB = node.graph.links[linkB].origin_id;
                origin_slotB = node.graph.links[linkB].origin_slot;
                connectedNodeB = node.graph._nodes_by_id[node_IDB];
                node.disconnectInput(indexB);
            }

            if (linkA) {
                connectedNodeA.connect(origin_slotA, node, indexB);
            }

            if (linkB) {
                connectedNodeB.connect(origin_slotB, node, indexA);
            }

            node.inputs[indexA].label = labelB;
            node.inputs[indexB].label = labelA;
        } catch (error) {
            console.error("Swap inputs error:", error);
        }
    }
};

// 布局管理器
const LayoutManager = {
    /**
     * 计算画布尺寸 - 参数强制紧贴节点底部
     * Compute canvas size - force parameters to stick to bottom
     */
    computeCanvasSize: function(node, size) {
        if (!node.widgets || node.widgets.length === 0) return;

        let canvasWidget = null;
        let otherWidgets = [];
        
        // 分离画布控件和其他控件
        for (let i = 0; i < node.widgets.length; i++) {
            const w = node.widgets[i];
            if (w.type === "customCanvas") {
                canvasWidget = w;
            } else {
                otherWidgets.push(w);
            }
        }

        // 固定节点高度
        const nodeHeight = 580;
        node.size[1] = nodeHeight;
        
        // 1. 画布固定在顶部
        if (canvasWidget) {
            canvasWidget.y = CONSTANTS.TITLE_HEIGHT;
            canvasWidget.h = CONSTANTS.CANVAS_HEIGHT;
        }

        // 2. 参数控件从底部开始排列（倒序）
        const parameterCount = otherWidgets.length;
        
        for (let i = 0; i < parameterCount; i++) {
            // 从节点底部开始向上排列参数
            const fromBottom = parameterCount - i;
            otherWidgets[i].y = nodeHeight - (fromBottom * CONSTANTS.WIDGET_HEIGHT) - 5;
        }

        node.canvasHeight = CONSTANTS.CANVAS_HEIGHT;
    }
};

// 绘制引擎
const DrawEngine = {
    /**
     * 绘制颜色生成器
     * Color generator for drawing
     */
    getDrawColor: function(percent, alpha) {
        let h = 360 * percent;
        let s = 50;
        let l = 50;
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}${alpha}`;
    },

    /**
     * 绘制旋转矩形
     * Draw rotated rectangle with rotation indicator
     */
    drawRotatedRect: function(ctx, x, y, w, h, rotation, color, showIndicator = false) {
        try {
            if (rotation !== 0) {
                ctx.save();
                const centerX = x + w / 2;
                const centerY = y + h / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate(rotation * Math.PI / 180);
                
                ctx.fillStyle = color;
                ctx.fillRect(-w / 2, -h / 2, w, h);
                
                // 绘制旋转指示器
                if (showIndicator) {
                    ctx.strokeStyle = CONSTANTS.COLORS.SELECTED_BORDER;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, -h / 2);
                    ctx.lineTo(8, -h / 2 - 8);
                    ctx.moveTo(0, -h / 2);
                    ctx.lineTo(-8, -h / 2 - 8);
                    ctx.stroke();
                }
                
                ctx.restore();
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, w, h);
            }
        } catch (error) {
            console.error("Draw rotated rect error:", error);
        }
    },

    /**
     * 绘制网格
     * Draw grid background
     */
    drawGrid: function(ctx, backgroundX, backgroundY, backgroundWidth, backgroundHeight, resolutionX, resolutionY, scale) {
        try {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = CONSTANTS.COLORS.GRID;
            
            for (let x = CONSTANTS.GRID_SIZE; x < resolutionX; x += CONSTANTS.GRID_SIZE) {
                const lineX = backgroundX + (x * scale);
                ctx.moveTo(lineX, backgroundY);
                ctx.lineTo(lineX, backgroundY + backgroundHeight);
            }
            
            for (let y = CONSTANTS.GRID_SIZE; y < resolutionY; y += CONSTANTS.GRID_SIZE) {
                const lineY = backgroundY + (y * scale);
                ctx.moveTo(backgroundX, lineY);
                ctx.lineTo(backgroundX + backgroundWidth, lineY);
            }
            ctx.stroke();
            ctx.closePath();
        } catch (error) {
            console.error("Draw grid error:", error);
        }
    }
};

/**
 * 添加多区域条件画布 - v0.3.43兼容版本
 * Add multi area conditioning canvas compatible with v0.3.43
 */
function addMultiAreaConditioningCanvas(node, app) {
    const widget = {
        type: "customCanvas", 
        name: "MultiAreaConditioning-Canvas",
        
        draw: function (ctx, node, widgetWidth, widgetY, height) {
            try {
                // 强制重新布局参数控件到底部
                if (node.widgets) {
                    const nonCanvasWidgets = node.widgets.filter(w => w.type !== "customCanvas");
                    nonCanvasWidgets.forEach((widget, index) => {
                        widget.y = node.size[1] - ((nonCanvasWidgets.length - index) * 30) - 5;
                    });
                }
                
                // 检查可见性 - v0.3.43兼容
                const visible = app.canvas && app.canvas.ds && app.canvas.ds.scale > 0.6;
                if (!visible) return;

                const margin = 10;
                const values = node.properties["values"] || [
                    [0, 0, 256, 192, 1.0, 0.0],
                    [256, 0, 256, 192, 1.0, 0.0],   
                    [0, 192, 256, 192, 1.0, 0.0],   
                    [64, 128, 128, 256, 1.0, 0.0]   
                ];
                const resolutionX = node.properties["width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                const resolutionY = node.properties["height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                
                if (!node.widgets || node.index === undefined || !node.widgets[node.index]) {
                    return;
                }
                
                const curIndex = Math.round(node.widgets[node.index].value || 0);
                const canvasHeight = this.h || node.canvasHeight || CONSTANTS.CANVAS_HEIGHT;
                
                // 计算缩放，确保画布能完整显示
                const scale = Math.min(
                    (widgetWidth - margin * 2) / resolutionX, 
                    (canvasHeight - margin * 2) / resolutionY
                );

                const backgroundWidth = resolutionX * scale;
                const backgroundHeight = resolutionY * scale;
                
                // 居中显示
                const backgroundX = margin + (widgetWidth - backgroundWidth - margin * 2) / 2;
                const backgroundY = margin;

                // 绘制黑色边框
                ctx.fillStyle = CONSTANTS.COLORS.BORDER;
                ctx.fillRect(backgroundX - 2, backgroundY - 2, backgroundWidth + 4, backgroundHeight + 4);
                
                // 绘制主背景
                ctx.fillStyle = CONSTANTS.COLORS.BACKGROUND;
                ctx.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);

                // 绘制网格
                DrawEngine.drawGrid(ctx, backgroundX, backgroundY, backgroundWidth, backgroundHeight, 
                                  resolutionX, resolutionY, scale);

                // 绘制所有区域背景（非选中状态）
                for (let i = 0; i < values.length; i++) {
                    if (i === curIndex) continue;
                    
                    const value = values[i];
                    if (!value || value.length < 4) continue;
                    
                    let x = Math.max(0, value[0] || 0);
                    let y = Math.max(0, value[1] || 0);
                    let w = Math.max(0, value[2] || 512);
                    let h = Math.max(0, value[3] || 512);
                    let rotation = value[5] || 0.0;
                    
                    if (x >= resolutionX || y >= resolutionY) continue;
                    if (x + w > resolutionX) w = resolutionX - x;
                    if (y + h > resolutionY) h = resolutionY - y;
                    if (w <= 0 || h <= 0) continue;

                    let areaX = backgroundX + (x * scale);
                    let areaY = backgroundY + (y * scale);
                    let areaW = w * scale;
                    let areaH = h * scale;

                    const color = CONSTANTS.COLORS.AREAS[i % CONSTANTS.COLORS.AREAS.length];
                    DrawEngine.drawRotatedRect(ctx, areaX, areaY, areaW, areaH, rotation, color, false);
                }

                // 绘制当前选中区域（高亮显示）
                if (curIndex < values.length) {
                    const value = values[curIndex];
                    if (value && value.length >= 4) {
                        let x = Math.max(0, value[0] || 0);
                        let y = Math.max(0, value[1] || 0);
                        let w = Math.max(CONSTANTS.MIN_AREA_SIZE, value[2] || 512);
                        let h = Math.max(CONSTANTS.MIN_AREA_SIZE, value[3] || 512);
                        let rotation = value[5] || 0.0;
                        
                        if (x + w > resolutionX) w = resolutionX - x;
                        if (y + h > resolutionY) h = resolutionY - y;
                        
                        if (w > 0 && h > 0) {
                            let areaX = backgroundX + (x * scale);
                            let areaY = backgroundY + (y * scale);
                            let areaW = w * scale;
                            let areaH = h * scale;

                            // 绘制白色边框和选中区域
                            if (rotation !== 0) {
                                ctx.save();
                                const centerX = areaX + areaW / 2;
                                const centerY = areaY + areaH / 2;
                                ctx.translate(centerX, centerY);
                                ctx.rotate(rotation * Math.PI / 180);
                                
                                // 绘制白色边框
                                ctx.fillStyle = CONSTANTS.COLORS.SELECTED_BORDER;
                                ctx.fillRect(-areaW / 2 - 2, -areaH / 2 - 2, areaW + 4, areaH + 4);
                                
                                // 绘制选中区域
                                ctx.fillStyle = CONSTANTS.COLORS.SELECTED;
                                ctx.fillRect(-areaW / 2, -areaH / 2, areaW, areaH);
                                
                                // 绘制旋转指示器
                                ctx.strokeStyle = CONSTANTS.COLORS.SELECTED_BORDER;
                                ctx.lineWidth = 2;
                                ctx.beginPath();
                                ctx.moveTo(0, -areaH / 2);
                                ctx.lineTo(8, -areaH / 2 - 8);
                                ctx.moveTo(0, -areaH / 2);
                                ctx.lineTo(-8, -areaH / 2 - 8);
                                ctx.stroke();
                                
                                ctx.restore();
                            } else {
                                // 绘制白色边框
                                ctx.fillStyle = CONSTANTS.COLORS.SELECTED_BORDER;
                                ctx.fillRect(areaX - 2, areaY - 2, areaW + 4, areaH + 4);

                                // 绘制选中区域
                                ctx.fillStyle = CONSTANTS.COLORS.SELECTED;
                                ctx.fillRect(areaX, areaY, areaW, areaH);
                            }
                        }
                    }
                }

                // 绘制左侧输入插槽高亮
                ctx.beginPath();
                ctx.fillStyle = CONSTANTS.COLORS.SELECTED;
                const slotHeight = 24;
                const slotY = curIndex * slotHeight + slotHeight * 0.5 + 6;
                ctx.arc(8, slotY, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.lineWidth = 2;
                ctx.strokeStyle = CONSTANTS.COLORS.SELECTED_BORDER;
                ctx.stroke();
                ctx.closePath();

            } catch (error) {
                console.error("Canvas draw error:", error);
            }
        }
    };

    node.addCustomWidget(widget);
    return { minWidth: 400, minHeight: 500 };
}

// 主扩展注册 - ComfyUI v0.3.43兼容
app.registerExtension({
    name: "Comfy.Davemane42.MultiAreaConditioning",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "MultiAreaConditioning") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;

            nodeType.prototype.onNodeCreated = function () {
                const node = this;
                onNodeCreated?.apply(this, arguments);

                try {
                    // 初始化属性
                    if (!node.properties || !node.properties["values"]) {
                        node.properties = {
                            "values": [
                                [0, 0, 256, 192, 1.0, 0.0],
                                [256, 0, 256, 192, 1.0, 0.0],   
                                [0, 192, 256, 192, 1.0, 0.0],   
                                [64, 128, 128, 256, 1.0, 0.0]   
                            ],
                            "width": CONSTANTS.DEFAULT_RESOLUTION.width,
                            "height": CONSTANTS.DEFAULT_RESOLUTION.height
                        };
                    }

                    // 添加控件 - 画布在顶部，参数在底部
                    addMultiAreaConditioningCanvas(node, app);

                    // 添加分辨率控件
                    Utils.createCustomInt(node, "resolutionX", CONSTANTS.DEFAULT_RESOLUTION.width, function (v) { 
                        node.properties["width"] = v; 
                    });
                    
                    Utils.createCustomInt(node, "resolutionY", CONSTANTS.DEFAULT_RESOLUTION.height, function (v) { 
                        node.properties["height"] = v; 
                    });

                    // 添加索引选择器
                    node.index = node.widgets.length;
                    node.addWidget("slider", "index", 3, function (v) { 
                        try {
                            const selectedIndex = Math.round(v);
                            if (node.properties["values"] && selectedIndex < node.properties["values"].length) {
                                const values = node.properties["values"][selectedIndex];
                                // 更新最后6个控件：strength, rotation, x, y, width, height
                                const bottomInputs = node.widgets.slice(-6);
                                const updateIndexMap = [4, 5, 0, 1, 2, 3];
                                for (let i = 0; i < Math.min(6, bottomInputs.length); i++) {
                                    if (bottomInputs[i]) {
                                        const dataIndex = updateIndexMap[i];
                                        bottomInputs[i].value = values[dataIndex] || (dataIndex === 4 ? 1.0 : 0.0);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error("Index selection error:", error);
                        }
                    }, { min: 0, max: 3, step: 1, precision: 0 });

                    // 添加底部的6个控件：strength, rotation, x, y, width, height
                    const names = ["strength", "rotation", "x", "y", "width", "height"];
                    const defaultValues = [1.0, 0.0, 64, 128, 128, 256];
                    const paramIndexMap = [4, 5, 0, 1, 2, 3];
                    
                    for (let i = 0; i < 6; i++) {
                        let config = {};
                        if (i === 0) { // strength
                            config = { min: 0.0, max: 10.0, step: 0.1, precision: 2 };
                        } else if (i === 1) { // rotation
                            config = { min: -180.0, max: 180.0, step: 1.0, precision: 1 };
                        }
                        
                        Utils.createCustomInt(node, names[i], defaultValues[i], function (v) {
                            Utils.transformFunc(this, v, node, paramIndexMap[i]);
                        }, config);
                    }

                    // 设置节点尺寸 - 参数强制紧贴底部
                    setTimeout(() => {
                        node.size = [400, 580]; // 固定高度，参数紧贴底部
                        LayoutManager.computeCanvasSize(node, node.size);
                        
                        // 双重保险：手动设置每个参数控件位置
                        if (node.widgets) {
                            const nonCanvasWidgets = node.widgets.filter(w => w.type !== "customCanvas");
                            nonCanvasWidgets.forEach((widget, index) => {
                                // 从底部开始排列：最后一个参数在最底部
                                widget.y = 580 - ((nonCanvasWidgets.length - index) * 30) - 5;
                            });
                        }
                    }, 150); // 延长时间确保布局生效

                    // 点击开关式拖拽 - 第一次点击开始拖拽，再次点击结束拖拽
                    let isDragging = false;
                    let dragStart = null;
                    let originalArea = null;
                    
                    const onMouseDown = node.onMouseDown;
                    node.onMouseDown = function (event, pos, canvas) {
                        try {
                            if (!node.widgets || node.index === undefined || !node.widgets[node.index]) {
                                return onMouseDown?.apply(this, arguments);
                            }
                            
                            const index = Math.round(node.widgets[node.index].value);
                            const values = node.properties["values"];

                            if (!values || index >= values.length) {
                                return onMouseDown?.apply(this, arguments);
                            }

                            const resolutionX = node.properties["width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                            const resolutionY = node.properties["height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                            const canvasHeight = node.canvasHeight || CONSTANTS.CANVAS_HEIGHT;
                            const margin = 10;
                            const widgetWidth = node.size[0];

                            const scale = Math.min(
                                (widgetWidth - margin*2)/resolutionX, 
                                (canvasHeight - margin*2)/resolutionY
                            );

                            const backgroundWidth = resolutionX * scale;
                            const backgroundHeight = resolutionY * scale;
                            const backgroundX = margin + (widgetWidth - backgroundWidth - margin * 2) / 2;
                            const backgroundY = margin;

                            const relativeX = pos[0] - backgroundX;
                            const canvasOffsetY = CONSTANTS.TITLE_HEIGHT;
                            const relativeY = pos[1] - backgroundY - canvasOffsetY;

                            if (relativeX >= 0 && relativeX <= backgroundWidth && 
                                relativeY >= 0 && relativeY <= backgroundHeight) {

                                // 获取当前区域信息
                                let areaX = Math.max(0, values[index][0] || 0);
                                let areaY = Math.max(0, values[index][1] || 0);
                                let areaW = Math.max(32, values[index][2] || 512);
                                let areaH = Math.max(32, values[index][3] || 512);
                                
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
                                    const x = Math.round((relativeX / backgroundWidth) * resolutionX);
                                    const y = Math.round((relativeY / backgroundHeight) * resolutionY);
                                    
                                    // 确保区域不超出边界
                                    const clampedX = Math.max(0, Math.min(resolutionX - areaW, x));
                                    const clampedY = Math.max(0, Math.min(resolutionY - areaH, y));

                                    values[index][0] = clampedX;
                                    values[index][1] = clampedY;

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
                    
                    // 点击开关式拖拽 - 鼠标移动时实时跟随
                    const onMouseMove = node.onMouseMove;
                    node.onMouseMove = function (event, pos, canvas) {
                        try {
                            if (isDragging) {
                                const index = Math.round(node.widgets[node.index].value);
                                const values = node.properties["values"];
                                const resolutionX = node.properties["width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                                const resolutionY = node.properties["height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                                const canvasHeight = node.canvasHeight || CONSTANTS.CANVAS_HEIGHT;
                                const margin = 10;
                                const widgetWidth = node.size[0];

                                const scale = Math.min(
                                    (widgetWidth - margin*2)/resolutionX, 
                                    (canvasHeight - margin*2)/resolutionY
                                );

                                const backgroundWidth = resolutionX * scale;
                                const backgroundHeight = resolutionY * scale;
                                const backgroundX = margin + (widgetWidth - backgroundWidth - margin * 2) / 2;
                                const backgroundY = margin;

                                // 计算鼠标在画布上的相对位置
                                const relativeX = pos[0] - backgroundX;
                                const canvasOffsetY = CONSTANTS.TITLE_HEIGHT;
                                const relativeY = pos[1] - backgroundY - canvasOffsetY;

                                // 转换为实际坐标
                                const mouseRealX = (relativeX / backgroundWidth) * resolutionX;
                                const mouseRealY = (relativeY / backgroundHeight) * resolutionY;
                                
                                // 获取当前区域的宽度和高度（保持不变）
                                const currentW = values[index][2] || 512;
                                const currentH = values[index][3] || 512;
                                
                                // 计算新位置（区域中心跟随鼠标）
                                let newX = mouseRealX - currentW / 2;
                                let newY = mouseRealY - currentH / 2;
                                
                                // 确保不超出边界
                                newX = Math.max(0, Math.min(resolutionX - currentW, newX));
                                newY = Math.max(0, Math.min(resolutionY - currentH, newY));
                                
                                // 只更新位置，不改变大小
                                values[index][0] = Math.round(newX);
                                values[index][1] = Math.round(newY);
                                
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
                    
                    // 点击开关式拖拽 - 鼠标释放不结束拖拽状态
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

                    // 右键菜单 - v0.3.43兼容
                    const onContextMenu = node.onContextMenu;
                    node.onContextMenu = function (menu, event) {
                        try {
                            menu.addItem({
                                content: "🔄 重置区域",
                                callback: () => {
                                    if (node.properties && node.properties["values"]) {
                                        const index = Math.round(node.widgets[node.index].value);
                                        node.properties["values"][index] = [0, 0, 256, 256, 1.0, 0.0];
                                        
                                        // 更新控件值
                                        const controlNames = ["x", "y", "width", "height", "strength", "rotation"];
                                        const defaultValues = [0, 0, 256, 256, 1.0, 0.0];
                                        controlNames.forEach((name, i) => {
                                            const widget = node.widgets.find(w => w.name === name);
                                            if (widget) widget.value = defaultValues[i];
                                        });
                                    }
                                }
                            });

                            menu.addItem({
                                content: "📐 居中区域",
                                callback: () => {
                                    if (node.properties && node.properties["values"]) {
                                        const resX = node.properties["width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                                        const resY = node.properties["height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                                        const index = Math.round(node.widgets[node.index].value);
                                        const w = node.properties["values"][index][2] || 256;
                                        const h = node.properties["values"][index][3] || 256;
                                        
                                        const centerX = Math.max(0, (resX - w) / 2);
                                        const centerY = Math.max(0, (resY - h) / 2);
                                        
                                        node.properties["values"][index][0] = centerX;
                                        node.properties["values"][index][1] = centerY;
                                        
                                        const xWidget = node.widgets.find(w => w.name === "x");
                                        const yWidget = node.widgets.find(w => w.name === "y");
                                        if (xWidget) xWidget.value = centerX;
                                        if (yWidget) yWidget.value = centerY;
                                    }
                                }
                            });

                            menu.addItem({
                                content: "🎯 全屏区域",
                                callback: () => {
                                    if (node.properties && node.properties["values"]) {
                                        const resX = node.properties["width"] || CONSTANTS.DEFAULT_RESOLUTION.width;
                                        const resY = node.properties["height"] || CONSTANTS.DEFAULT_RESOLUTION.height;
                                        const index = Math.round(node.widgets[node.index].value);
                                        
                                        node.properties["values"][index] = [0, 0, resX, resY, 1.0, 0.0];
                                        
                                        // 更新所有控件值
                                        const updates = {
                                            "x": 0, "y": 0, "width": resX, "height": resY, 
                                            "strength": 1.0, "rotation": 0.0
                                        };
                                        Object.entries(updates).forEach(([name, value]) => {
                                            const widget = node.widgets.find(w => w.name === name);
                                            if (widget) widget.value = value;
                                        });
                                    }
                                }
                            });

                            onContextMenu?.apply(this, arguments);
                        } catch (error) {
                            console.error("Context menu error:", error);
                            onContextMenu?.apply(this, arguments);
                        }
                    };

                    // 添加前景绘制事件，持续强制布局
                    const onDrawForeground = node.onDrawForeground;
                    node.onDrawForeground = function(ctx) {
                        try {
                            // 每次绘制前都强制重新布局参数到底部
                            if (this.widgets) {
                                const nonCanvasWidgets = this.widgets.filter(w => w.type !== "customCanvas");
                                nonCanvasWidgets.forEach((widget, index) => {
                                    widget.y = this.size[1] - ((nonCanvasWidgets.length - index) * 30) - 5;
                                });
                            }
                            
                            onDrawForeground?.apply(this, arguments);
                        } catch (error) {
                            console.error("Draw foreground error:", error);
                            onDrawForeground?.apply(this, arguments);
                        }
                    };

                } catch (error) {
                    console.error("Node creation error:", error);
                }
            };

                         // v0.3.43兼容：加载已保存的节点数据
             const onLoadedGraphNode = nodeType.prototype.loadedGraphNode;
             nodeType.prototype.loadedGraphNode = function(nodeData, app) {
                 try {
                     onLoadedGraphNode?.apply(this, arguments);
                     
                     // 确保属性完整性
                     if (!this.properties) {
                         this.properties = {};
                     }
                     
                     if (!this.properties["values"]) {
                         this.properties["values"] = [
                             [0, 0, 256, 192, 1.0, 0.0],
                             [256, 0, 256, 192, 1.0, 0.0],   
                             [0, 192, 256, 192, 1.0, 0.0],   
                             [64, 128, 128, 256, 1.0, 0.0]   
                         ];
                     }
                     
                     if (!this.properties["width"]) {
                         this.properties["width"] = CONSTANTS.DEFAULT_RESOLUTION.width;
                     }
                     
                     if (!this.properties["height"]) {
                         this.properties["height"] = CONSTANTS.DEFAULT_RESOLUTION.height;
                     }
                     
                     // 强制设置节点尺寸并重新计算布局
                     this.size = [400, 580];
                     setTimeout(() => {
                         LayoutManager.computeCanvasSize(this, this.size);
                         // 强制刷新布局
                         if (this.widgets) {
                             this.widgets.forEach((widget, index) => {
                                 if (widget.type !== "customCanvas") {
                                     const paramIndex = this.widgets.filter(w => w.type !== "customCanvas").indexOf(widget);
                                     const totalParams = this.widgets.filter(w => w.type !== "customCanvas").length;
                                     widget.y = 580 - ((totalParams - paramIndex) * 30) - 5;
                                 }
                             });
                         }
                     }, 100);
                     
                 } catch (error) {
                     console.error("Load graph node error:", error);
                 }
             };
        }
    }
});