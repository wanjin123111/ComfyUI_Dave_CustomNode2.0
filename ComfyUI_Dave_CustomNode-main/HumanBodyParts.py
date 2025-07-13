"""
Human Body Parts Conditioning Node v3.0.0 - 智能架构升级版
人体部件条件控制节点 - 智能提示词分配与自动化Conditioning

ComfyUI v0.3.43 Compatible Version
Created: 2025-01-27
Updated: 2025-01-27 (架构重构v3.0)
Author: Davemane42

🚀 PRD v3.0 架构升级特性:
- 🎯 智能提示词分配：单一全局提示词自动生成所有部件conditioning
- 🔄 自动化CLIP编码：内置CLIP处理，无需手动为每个部件输入conditioning
- 📤 多输出架构：直接输出所有15个身体部位的独立conditioning
- 🧠 简化工作流：从"手动节点"升级为"智能节点"
- ⚡ 零配置使用：输入提示词即可获得完整的人体部件conditioning数据
"""

import torch
import numpy as np
from typing import Dict, List, Tuple, Optional, Any, Union
import logging

# 导入中间件
from .middleware import load_body_parts_config

# 配置日志系统
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局配置函数已移至中间件模块

class HumanBodyPartsConditioning:
    """
    人体部件条件控制节点
    
    专门用于人体部件的条件分解，支持10个主要人体部件：
    头部、躯干、左右大臂、左右小臂、左右大腿、左右小腿
    """
    
    # 人体部件定义 - 基于COCO-17和解剖学标准
    BODY_PARTS = {
        # 头颈部
        "head": {
            "name": "头部", "category": "head_neck",
            "default_pos": [256, 50], "default_size": [180, 220], 
            "color": "#FF6B6B", "anatomical_region": "cranial",
            "medical_importance": "高", "flexibility": "中等"
        },
        "neck": {
            "name": "颈部", "category": "head_neck", 
            "default_pos": [310, 260], "default_size": [60, 80],
            "color": "#FF8A80", "anatomical_region": "cervical",
            "medical_importance": "高", "flexibility": "高"
        },
        # 躯干核心
        "torso": {
            "name": "躯干", "category": "core",
            "default_pos": [200, 280], "default_size": [240, 360], 
            "color": "#4ECDC4", "anatomical_region": "thoracic_lumbar",
            "medical_importance": "高", "flexibility": "低"
        },
        # 上肢系统
        "left_upper_arm": {
            "name": "左大臂", "category": "upper_limb",
            "default_pos": [120, 320], "default_size": [80, 160], 
            "color": "#45B7D1", "anatomical_region": "brachial",
            "medical_importance": "中", "flexibility": "高"
        },
        "left_forearm": {
            "name": "左小臂", "category": "upper_limb",
            "default_pos": [80, 480], "default_size": [70, 140], 
            "color": "#96CEB4", "anatomical_region": "antebrachial",
            "medical_importance": "中", "flexibility": "高"
        },
        "left_hand": {
            "name": "左手", "category": "upper_limb",
            "default_pos": [50, 620], "default_size": [50, 80],
            "color": "#A5D6A7", "anatomical_region": "manual",
            "medical_importance": "高", "flexibility": "极高"
        },
        "right_upper_arm": {
            "name": "右大臂", "category": "upper_limb",
            "default_pos": [480, 320], "default_size": [80, 160], 
            "color": "#FECA57", "anatomical_region": "brachial",
            "medical_importance": "中", "flexibility": "高"
        },
        "right_forearm": {
            "name": "右小臂", "category": "upper_limb",
            "default_pos": [520, 480], "default_size": [70, 140], 
            "color": "#FF9FF3", "anatomical_region": "antebrachial",
            "medical_importance": "中", "flexibility": "高"
        },
        "right_hand": {
            "name": "右手", "category": "upper_limb",
            "default_pos": [590, 620], "default_size": [50, 80],
            "color": "#F8BBD9", "anatomical_region": "manual",
            "medical_importance": "高", "flexibility": "极高"
        },
        # 下肢系统
        "left_thigh": {
            "name": "左大腿", "category": "lower_limb",
            "default_pos": [220, 640], "default_size": [90, 180], 
            "color": "#54A0FF", "anatomical_region": "femoral",
            "medical_importance": "中", "flexibility": "中等"
        },
        "left_calf": {
            "name": "左小腿", "category": "lower_limb",
            "default_pos": [200, 820], "default_size": [80, 160], 
            "color": "#5F27CD", "anatomical_region": "crural",
            "medical_importance": "中", "flexibility": "中等"
        },
        "left_foot": {
            "name": "左脚", "category": "lower_limb",
            "default_pos": [180, 980], "default_size": [80, 60],
            "color": "#7E57C2", "anatomical_region": "pedal",
            "medical_importance": "高", "flexibility": "中等"
        },
        "right_thigh": {
            "name": "右大腿", "category": "lower_limb",
            "default_pos": [340, 640], "default_size": [90, 180], 
            "color": "#00D2D3", "anatomical_region": "femoral",
            "medical_importance": "中", "flexibility": "中等"
        },
        "right_calf": {
            "name": "右小腿", "category": "lower_limb",
            "default_pos": [360, 820], "default_size": [80, 160], 
            "color": "#FF6348", "anatomical_region": "crural",
            "medical_importance": "中", "flexibility": "中等"
        },
        "right_foot": {
            "name": "右脚", "category": "lower_limb",
            "default_pos": [380, 980], "default_size": [80, 60],
            "color": "#FF7043", "anatomical_region": "pedal",
            "medical_importance": "高", "flexibility": "中等"
        }
    }
    
    # 解剖学连接关系 - 基于医学标准
    ANATOMICAL_CONNECTIONS = [
        ("head", "neck"),
        ("neck", "torso"), 
        ("torso", "left_upper_arm"), ("torso", "right_upper_arm"),
        ("left_upper_arm", "left_forearm"), ("right_upper_arm", "right_forearm"),
        ("left_forearm", "left_hand"), ("right_forearm", "right_hand"),
        ("torso", "left_thigh"), ("torso", "right_thigh"),
        ("left_thigh", "left_calf"), ("right_thigh", "right_calf"),
        ("left_calf", "left_foot"), ("right_calf", "right_foot")
    ]
    
    # 医疗康复预设
    MEDICAL_PRESETS = {
        "physical_therapy": {
            "description": "物理治疗专用配置",
            "focus_areas": ["neck", "torso", "left_upper_arm", "right_upper_arm"],
            "strength_multiplier": 1.2
        },
        "sports_analysis": {
            "description": "运动分析配置", 
            "focus_areas": ["torso", "left_thigh", "right_thigh", "left_calf", "right_calf"],
            "strength_multiplier": 1.5
        },
        "hand_therapy": {
            "description": "手部康复配置",
            "focus_areas": ["left_hand", "right_hand", "left_forearm", "right_forearm"],
            "strength_multiplier": 2.0
        }
    }
    
    def __init__(self):
        """初始化人体部件节点"""
        self.device = "cpu"
        logger.info("HumanBodyPartsConditioning node initialized")
    
    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        """
        🚀 彻底简化架构 - 回归ComfyUI标准模式
        
        只要核心输入，所有拖拽数据通过node properties传递
        
        Returns:
            精简的输入类型定义字典
        """
        inputs = {
            "required": {
                # 🚀 核心：单一conditioning输入
                "conditioning": ("CONDITIONING", {
                    "tooltip": "输入conditioning - 节点将智能分配到各身体部位区域"
                }),
                # 分辨率设置  
                "resolution_x": ("INT", {
                    "default": 640, "min": 64, "max": 4096, "step": 8, 
                    "tooltip": "图像宽度"
                }),
                "resolution_y": ("INT", {
                    "default": 1024, "min": 64, "max": 4096, "step": 8, 
                    "tooltip": "图像高度"
                }),
            },
            "optional": {}
        }
        
        logger.info("🚀 彻底简化架构：核心输入 + properties数据传递 → 智能分配 → conditioning输出")
        return inputs
    
    # 🎯 简化智能架构 - 一进一出
    RETURN_TYPES = ("CONDITIONING",)
    RETURN_NAMES = ("conditioning",)
    FUNCTION = "apply_intelligent_body_parts_conditioning"
    CATEGORY = "Dave/Human Body"
    DESCRIPTION = "🎯 智能人体部件条件控制 - 一个conditioning输入，智能分配到各身体部位，一个conditioning输出"
    
    def apply_intelligent_body_parts_conditioning(
        self,
        conditioning: List[Tuple[torch.Tensor, Dict[str, Any]]],
        resolution_x: int,
        resolution_y: int,
    ) -> Tuple[List[Tuple[torch.Tensor, Dict[str, Any]]]]:
        """
        🚀 彻底修复版：通过node properties读取实时拖拽数据
        
        不再依赖函数参数，直接从节点properties中读取前端更新的配置
        
        Args:
            conditioning: 输入的conditioning数据
            resolution_x: 图像宽度
            resolution_y: 图像高度
            
        Returns:
            经过智能分配的统一conditioning输出
        """
        try:
            logger.info(f"🚀 开始智能分配conditioning（中间件版）")
            logger.info(f"📏 分辨率: {resolution_x}x{resolution_y}")
            logger.info(f"📥 输入conditioning数量: {len(conditioning)}")
            
            # 🚀 测试日志：显示执行时间戳，方便调试
            import time
            logger.info(f"⏰ 执行时间戳: {time.time()}")
            
            # 🚀 关键修复：通过中间件读取前端同步的数据
            node_id = getattr(self, 'node_id', 'default_node')
            body_parts_config = load_body_parts_config(node_id)
            
            # 🚀 备用方案：尝试从多个位置读取配置
            if not body_parts_config:
                logger.info("⚠️ 中间件中未找到配置，尝试备用方案...")
                
                # 备用方案1: 尝试从当前实例读取
                if hasattr(self, '_last_config'):
                    body_parts_config = self._last_config
                    logger.info("📋 从实例缓存读取配置")
            
            if not body_parts_config:
                # 如果所有方案都失败，使用默认配置
                body_parts_config = self._get_default_config(resolution_x, resolution_y)
                logger.info("📝 使用默认身体部件配置")
            else:
                # 缓存成功读取的配置
                self._last_config = body_parts_config
                logger.info("🎯 成功读取前端拖拽更新的配置")
                logger.info(f"📊 配置内容: {body_parts_config}")
            
            # 🔄 步骤2: 智能分配 - 将输入conditioning分配到各个身体部位区域
            result_conditioning = []
            
            for part_id, part_config in body_parts_config.items():
                part_info = self.BODY_PARTS[part_id]
                
                # 获取部件区域参数
                x, y, width, height, strength, rotation = part_config
                
                # 确保参数在有效范围内
                x = max(0, min(resolution_x - width, int(x)))
                y = max(0, min(resolution_y - height, int(y)))
                width = max(32, min(resolution_x - x, int(width)))
                height = max(32, min(resolution_y - y, int(height)))
                strength = max(0.0, min(10.0, float(strength)))
                rotation = float(rotation) % 360
                
                                    # 🎯 为该部件应用区域conditioning - 使用正确的ComfyUI格式
                for cond_tensor, cond_dict in conditioning:
                    # 创建该部件的专用条件字典
                    new_cond_dict = cond_dict.copy()
                    
                    # 🔧 正确的8像素对齐计算
                    aligned_x = (x // 8) * 8
                    aligned_y = (y // 8) * 8
                    aligned_width = ((width + 7) // 8) * 8
                    aligned_height = ((height + 7) // 8) * 8
                    
                    # 🔧 ComfyUI正确的area格式：(height_units, width_units, y_units, x_units)
                    # 每个单位是8像素
                    area_definition = (
                        aligned_height // 8,  # height in 8-pixel units
                        aligned_width // 8,   # width in 8-pixel units  
                        aligned_y // 8,       # y position in 8-pixel units
                        aligned_x // 8        # x position in 8-pixel units
                    )
                    
                    # 🔧 设置正确的area属性
                    new_cond_dict['area'] = area_definition
                    
                    # 🔧 添加ComfyUI必需的sigma范围
                    new_cond_dict['strength'] = strength
                    new_cond_dict['min_sigma'] = 0.0
                    new_cond_dict['max_sigma'] = 99.0
                    
                    # 添加旋转信息（用于前端可视化）
                    if rotation != 0:
                        new_cond_dict['rotation'] = rotation
                        new_cond_dict['rotation_center'] = (
                            aligned_x + aligned_width // 2,
                            aligned_y + aligned_height // 2
                        )
                    
                    # 添加部件标识
                    new_cond_dict['body_part'] = part_id
                    new_cond_dict['body_part_name'] = part_info['name']
                    new_cond_dict['body_part_category'] = part_info['category']
                    
                    result_conditioning.append((cond_tensor, new_cond_dict))
                
                logger.info(f"✅ 分配 {part_info['name']} - 区域: ({aligned_x}, {aligned_y}, {aligned_width}, {aligned_height})")
            
            # 🎯 步骤3: 返回统一的conditioning输出
            logger.info(f"🎯 智能分配完成: 生成{len(result_conditioning)}个区域conditioning")
            logger.info(f"📤 输出: 统一的conditioning数据")
            
            return (result_conditioning,)
            
        except Exception as e:
            logger.error(f"🚨 智能分配错误: {e}")
            # 发生错误时返回原始conditioning
            return (conditioning,)
    
    def _get_default_config(self, resolution_x: int, resolution_y: int) -> Dict[str, List[float]]:
        """
        获取默认的人体部件配置
        
        Args:
            resolution_x: 图像宽度
            resolution_y: 图像高度
            
        Returns:
            默认配置字典
        """
        config = {}
        
        # 计算缩放比例
        scale_x = resolution_x / 640
        scale_y = resolution_y / 1024
        
        for part_id, part_info in self.BODY_PARTS.items():
            # 按比例缩放默认位置和大小
            default_x = int(part_info["default_pos"][0] * scale_x)
            default_y = int(part_info["default_pos"][1] * scale_y)
            default_width = int(part_info["default_size"][0] * scale_x)
            default_height = int(part_info["default_size"][1] * scale_y)
            default_strength = 1.0
            default_rotation = 0.0
            
            config[part_id] = [default_x, default_y, default_width, default_height, default_strength, default_rotation]
        
        return config


class HumanBodyPartsDebug:
    """
    人体部件调试节点
    
    用于显示和调试人体部件的配置信息
    """
    
    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        """定义调试节点输入类型"""
        return {
            "required": {
                "conditioning": ("CONDITIONING", {"tooltip": "要调试的条件输入"}),
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("debug_info",)
    FUNCTION = "debug_body_parts"
    CATEGORY = "Dave/Human Body"
    DESCRIPTION = "人体部件条件调试 - 显示部件配置信息"
    OUTPUT_NODE = True
    
    def debug_body_parts(self, conditioning: List[Tuple[torch.Tensor, Dict[str, Any]]]) -> Tuple[str]:
        """
        调试人体部件条件
        
        Args:
            conditioning: 条件输入
            
        Returns:
            调试信息字符串
        """
        try:
            debug_lines = ["=== 人体部件条件调试信息 ===\n"]
            
            for i, (cond_tensor, cond_dict) in enumerate(conditioning):
                debug_lines.append(f"条件 #{i + 1}:")
                debug_lines.append(f"  张量形状: {cond_tensor.shape}")
                
                if 'body_part' in cond_dict:
                    debug_lines.append(f"  人体部件: {cond_dict.get('body_part_name', 'Unknown')} ({cond_dict['body_part']})")
                
                if 'area' in cond_dict:
                    for j, area in enumerate(cond_dict['area']):
                        debug_lines.append(f"  区域 #{j + 1}: x={area[0]}, y={area[1]}, w={area[2]-area[0]}, h={area[3]-area[1]}")
                
                if 'strength' in cond_dict:
                    debug_lines.append(f"  强度: {cond_dict['strength']:.3f}")
                
                if 'rotation' in cond_dict:
                    debug_lines.append(f"  旋转: {cond_dict['rotation']:.1f}°")
                    if 'rotation_center' in cond_dict:
                        center = cond_dict['rotation_center']
                        debug_lines.append(f"  旋转中心: ({center[0]}, {center[1]})")
                
                debug_lines.append("")
            
            debug_info = "\n".join(debug_lines)
            logger.info("Human body parts debug completed")
            return (debug_info,)
            
        except Exception as e:
            error_msg = f"调试错误: {str(e)}"
            logger.error(error_msg)
            return (error_msg,)


# 节点注册映射
NODE_CLASS_MAPPINGS = {
    "HumanBodyPartsConditioning": HumanBodyPartsConditioning,
    "HumanBodyPartsDebug": HumanBodyPartsDebug,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "HumanBodyPartsConditioning": "🎯 Human Body Parts - Smart Distribution (Dave)",
    "HumanBodyPartsDebug": "Human Body Parts Debug (Dave)",
}

# 🚀 导出函数和类供JavaScript调用
__all__ = [
    "HumanBodyPartsConditioning", 
    "HumanBodyPartsDebug",
    "load_body_parts_config",
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS"
] 