# Made by Davemane42#0042 for ComfyUI
# Fully Compatible with ComfyUI v0.3.43 - 2025/01/27

import torch
import logging
import traceback
from typing import List, Tuple, Dict, Any, Optional

# 导入ComfyUI核心模块
try:
    from nodes import MAX_RESOLUTION
    import comfy.model_management
    import comfy.utils
except ImportError as e:
    print(f"Warning: Failed to import ComfyUI core modules: {e}")
    MAX_RESOLUTION = 16384  # 默认值

# 设置日志记录器
logger = logging.getLogger(__name__)

class MultiAreaConditioning:
    """
    多区域条件控制节点 - ComfyUI v0.3.43兼容版本
    Multi Area Conditioning Node compatible with ComfyUI v0.3.43
    
    支持最多4个条件输入，支持旋转角度控制
    Supports up to 4 conditioning inputs with rotation angle control
    """
    
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(cls):
        """
        定义输入类型 - v0.3.43兼容格式
        Define input types compatible with v0.3.43
        """
        return {
            "required": {
                "conditioning0": ("CONDITIONING", ),
            },
            "optional": {
                "conditioning1": ("CONDITIONING", ),
                "conditioning2": ("CONDITIONING", ),
                "conditioning3": ("CONDITIONING", )
            },
            "hidden": {
                "extra_pnginfo": "EXTRA_PNGINFO", 
                "unique_id": "UNIQUE_ID"
            },
        }
    

    RETURN_TYPES = ("CONDITIONING", "INT", "INT")
    RETURN_NAMES = ("conditioning", "resolutionX", "resolutionY")
    FUNCTION = "doStuff"
    CATEGORY = "Davemane42"
    
    # v0.3.43新增属性
    DESCRIPTION = "Multi Area Conditioning with rotation support - fully compatible with ComfyUI v0.3.43"

    def _validate_area_params(self, area_params: List) -> Tuple[int, int, int, int, float, float]:
        """
        验证和标准化区域参数
        Validate and normalize area parameters
        """
        try:
            if len(area_params) < 6:
                # 补充缺失的参数：strength默认1.0，rotation默认0.0
                area_params = area_params + [1.0, 0.0] * (6 - len(area_params))
            
            x, y, w, h, strength, rotation = area_params[:6]
            
            # 确保参数为数值类型并在有效范围内
            x = max(0, int(x) if x is not None else 0)
            y = max(0, int(y) if y is not None else 0)
            w = max(8, int(w) if w is not None else 512)  # 最小宽度8像素（8像素对齐）
            h = max(8, int(h) if h is not None else 512)  # 最小高度8像素
            strength = max(0.0, min(10.0, float(strength) if strength is not None else 1.0))
            rotation = max(-180.0, min(180.0, float(rotation) if rotation is not None else 0.0))
            
            return x, y, w, h, strength, rotation
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Invalid area parameters, using defaults: {e}")
            return 0, 0, 512, 512, 1.0, 0.0

    def _extract_workflow_info(self, extra_pnginfo: Optional[Dict], unique_id: str) -> Tuple[List, int, int]:
        """
        提取工作流信息 - v0.3.43兼容
        Extract workflow information compatible with v0.3.43
        """
        default_values = [
            [0, 0, 512, 512, 1.0, 0.0], 
            [0, 0, 512, 512, 1.0, 0.0], 
            [0, 0, 512, 512, 1.0, 0.0], 
            [0, 0, 512, 512, 1.0, 0.0]
        ]
        default_resolution = (512, 512)
        
        try:
            if not extra_pnginfo or "workflow" not in extra_pnginfo:
                return default_values, *default_resolution
                
            workflow = extra_pnginfo["workflow"]
            if "nodes" not in workflow:
                return default_values, *default_resolution
                
            for node in workflow["nodes"]:
                if node.get("id") == int(unique_id):
                    properties = node.get("properties", {})
                    values = properties.get("values", default_values)
                    resolutionX = properties.get("width", 512)
                    resolutionY = properties.get("height", 512)
                    
                    # 验证和清理数据
                    if not isinstance(values, list):
                        values = default_values
                    
                    # 确保有4个区域配置
                    while len(values) < 4:
                        values.append([0, 0, 512, 512, 1.0, 0.0])
                    
                    return values, resolutionX, resolutionY
                    
        except (ValueError, TypeError, KeyError) as e:
            logger.warning(f"Failed to extract workflow info: {e}")
            
        return default_values, *default_resolution

    def _is_fullscreen_area(self, x: int, y: int, w: int, h: int, resX: int, resY: int) -> bool:
        """
        检查是否为全屏区域
        Check if area is fullscreen
        """
        return (x == 0 and y == 0 and w == resX and h == resY)

    def _apply_area_boundaries(self, x: int, y: int, w: int, h: int, resX: int, resY: int) -> Tuple[int, int, int, int]:
        """
        应用区域边界修正 - 确保8像素对齐
        Apply area boundary correction with 8-pixel alignment
        """
        # 边界修正
        if x + w > resX:
            w = max(8, resX - x)
        
        if y + h > resY:
            h = max(8, resY - y)
        
        # 8像素对齐
        w = ((w + 7) >> 3) << 3
        h = ((h + 7) >> 3) << 3
        
        return x, y, w, h

    def _process_conditioning_item(self, conditioning_item: Tuple, area_params: Tuple) -> Optional[List]:
        """
        处理单个conditioning项目
        Process single conditioning item
        """
        try:
            x, y, w, h, strength, rotation = area_params
            
            n = [conditioning_item[0], conditioning_item[1].copy()]
            
            # 应用区域参数（ComfyUI使用8像素单位）
            n[1]['area'] = (h // 8, w // 8, y // 8, x // 8)
            n[1]['strength'] = strength
            n[1]['min_sigma'] = 0.0
            n[1]['max_sigma'] = 99.0
            
            # 添加旋转角度信息（自定义属性，用于前端可视化）
            n[1]['rotation'] = rotation
            
            return n
            
        except (IndexError, TypeError, AttributeError) as e:
            logger.warning(f"Failed to process conditioning item: {e}")
            return None

    def doStuff(self, extra_pnginfo: Optional[Dict], unique_id: str, **kwargs) -> Tuple[List, int, int]:
        """
        主处理函数 - ComfyUI v0.3.43兼容
        Main processing function compatible with ComfyUI v0.3.43
        """
        try:
            # 提取工作流信息
            values, resolutionX, resolutionY = self._extract_workflow_info(extra_pnginfo, unique_id)
            
            conditioning_results = []
            
            # 处理所有conditioning输入
            for k, (arg_name, conditioning) in enumerate(kwargs.items()):
                # 边界检查
                if k >= len(values):
                    break
                
                # 如果conditioning为None（可选输入未连接），跳过
                if conditioning is None:
                    continue
                
                # 验证conditioning数据
                if not self._validate_conditioning_data(conditioning):
                    continue
                
                # 获取并验证区域参数
                area_params = self._validate_area_params(values[k])
                x, y, w, h, strength, rotation = area_params
                
                # 检查是否为全屏区域
                if self._is_fullscreen_area(x, y, w, h, resolutionX, resolutionY):
                    # 全屏区域直接添加
                    for item in conditioning:
                        conditioning_results.append(item)
                    continue
                
                # 应用边界修正
                x, y, w, h = self._apply_area_boundaries(x, y, w, h, resolutionX, resolutionY)
                
                # 检查修正后的区域是否有效
                if w <= 0 or h <= 0:
                    continue
                
                # 处理每个conditioning项目
                for item in conditioning:
                    processed_item = self._process_conditioning_item(item, (x, y, w, h, strength, rotation))
                    if processed_item:
                        conditioning_results.append(processed_item)
            
            return (conditioning_results, resolutionX, resolutionY)
            
        except Exception as e:
            logger.error(f"Error in doStuff: {e}")
            logger.error(traceback.format_exc())
            # 返回空结果以避免崩溃
            return ([], 512, 512)

    def _validate_conditioning_data(self, conditioning: Any) -> bool:
        """
        验证conditioning数据
        Validate conditioning data
        """
        try:
            if not conditioning or not isinstance(conditioning, (list, tuple)):
                return False
                
            # 检查第一个元素是否包含张量
            if not torch.is_tensor(conditioning[0][0]):
                return False
                
            return True
            
        except (IndexError, TypeError, AttributeError):
            return False


class ConditioningUpscale():
    """
    条件放大节点 - ComfyUI v0.3.43兼容版本
    Conditioning Upscale Node compatible with ComfyUI v0.3.43
    """
    
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "conditioning": ("CONDITIONING", ),
                "scalar": ("FLOAT", {"default": 2.0, "min": 0.1, "max": 100.0, "step": 0.1}),
            },
        }
    
    RETURN_TYPES = ("CONDITIONING",)
    RETURN_NAMES = ("conditioning",)
    CATEGORY = "Davemane42"
    FUNCTION = 'upscale'
    
    # v0.3.43新增属性
    DESCRIPTION = "Upscale conditioning areas with precise 8-pixel alignment"

    def upscale(self, conditioning: List, scalar: float) -> Tuple[List]:
        """
        放大conditioning区域 - 精确8像素对齐
        Upscale conditioning areas with precise 8-pixel alignment
        """
        try:
            results = []
            
            for item in conditioning:
                try:
                    processed_item = [item[0], item[1].copy()]
                    
                    if 'area' in processed_item[1]:
                        # 精确的8像素对齐计算
                        area = processed_item[1]['area']
                        upscaled_area = tuple(
                            ((x * scalar + 7) >> 3) << 3 for x in area
                        )
                        processed_item[1]['area'] = upscaled_area
                    
                    results.append(processed_item)
                    
                except (IndexError, TypeError, AttributeError) as e:
                    logger.warning(f"Failed to upscale conditioning item: {e}")
                    continue

            return (results, )
            
        except Exception as e:
            logger.error(f"Error in upscale: {e}")
            return ([], )
    

class ConditioningStretch():
    """
    条件拉伸节点 - ComfyUI v0.3.43兼容版本
    Conditioning Stretch Node compatible with ComfyUI v0.3.43
    """
    
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "conditioning": ("CONDITIONING", ),
                "resolutionX": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION, "step": 64}),
                "resolutionY": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION, "step": 64}),
                "newWidth": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION, "step": 64}),
                "newHeight": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION, "step": 64}),
            },
        }
    
    RETURN_TYPES = ("CONDITIONING",)
    RETURN_NAMES = ("conditioning",)
    CATEGORY = "Davemane42"
    FUNCTION = 'stretch'
    
    # v0.3.43新增属性
    DESCRIPTION = "Stretch conditioning areas to new resolution with proper alignment"

    def stretch(self, conditioning: List, resolutionX: int, resolutionY: int, 
               newWidth: int, newHeight: int) -> Tuple[List]:
        """
        拉伸conditioning区域到新分辨率
        Stretch conditioning areas to new resolution
        """
        try:
            if resolutionX <= 0 or resolutionY <= 0 or newWidth <= 0 or newHeight <= 0:
                logger.warning("Invalid resolution parameters")
                return (conditioning, )
                
            results = []
            
            for item in conditioning:
                try:
                    processed_item = [item[0], item[1].copy()]
                    
                    if 'area' in processed_item[1]:
                        area = processed_item[1]['area']
                        
                        # 计算新的坐标和尺寸
                        x = ((area[3] * 8) * newWidth / resolutionX) // 8
                        y = ((area[2] * 8) * newHeight / resolutionY) // 8
                        w = ((area[1] * 8) * newWidth / resolutionX) // 8
                        h = ((area[0] * 8) * newHeight / resolutionY) // 8

                        # 8像素对齐
                        new_area = tuple(
                            (((int(val) + 7) >> 3) << 3) for val in [h, w, y, x]
                        )
                        processed_item[1]['area'] = new_area
                    
                    results.append(processed_item)
                    
                except (IndexError, TypeError, AttributeError, ZeroDivisionError) as e:
                    logger.warning(f"Failed to stretch conditioning item: {e}")
                    continue

            return (results, )
            
        except Exception as e:
            logger.error(f"Error in stretch: {e}")
            return (conditioning, )


class ConditioningDebug():
    """
    条件调试节点 - ComfyUI v0.3.43兼容版本
    Conditioning Debug Node compatible with ComfyUI v0.3.43
    """
    
    def __init__(self) -> None:
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "conditioning": ("CONDITIONING", ),
            }
        }
    
    RETURN_TYPES = ()
    FUNCTION = "debug"
    OUTPUT_NODE = True
    CATEGORY = "Davemane42"
    
    # v0.3.43新增属性
    DESCRIPTION = "Debug conditioning data with detailed area information and rotation display"

    def debug(self, conditioning: List) -> Tuple:
        """
        调试conditioning数据 - 显示详细的区域信息
        Debug conditioning data with detailed area information
        """
        try:
            print("\n" + "="*50)
            print("Conditioning Debug Output (v0.3.43 Compatible)")
            print("="*50)
            
            if not conditioning:
                print("No conditioning data found")
                return (None, )
            
            for i, item in enumerate(conditioning):
                try:
                    print(f"\nConditioning Item {i}:")
                    print(f"  Type: {type(item)}")
                    
                    if len(item) >= 2 and isinstance(item[1], dict):
                        cond_dict = item[1]
                        
                        if "area" in cond_dict:
                            area = cond_dict["area"]
                            strength = cond_dict.get("strength", "N/A")
                            rotation = cond_dict.get("rotation", "N/A")
                            min_sigma = cond_dict.get("min_sigma", "N/A")
                            max_sigma = cond_dict.get("max_sigma", "N/A")
                            
                            print(f"  Area (8px units): {area}")
                            print(f"  Pixel coordinates:")
                            print(f"    x: {area[3]*8}, y: {area[2]*8}")
                            print(f"    width: {area[1]*8}, height: {area[0]*8}")
                            print(f"  Strength: {strength}")
                            print(f"  Rotation: {rotation}°")
                            print(f"  Sigma range: {min_sigma} - {max_sigma}")
                        else:
                            print(f"  Mode: Fullscreen")
                            
                        # 显示其他属性
                        other_keys = [k for k in cond_dict.keys() 
                                    if k not in ['area', 'strength', 'rotation', 'min_sigma', 'max_sigma']]
                        if other_keys:
                            print(f"  Other attributes: {other_keys}")
                    else:
                        print(f"  Invalid conditioning structure")
                        
                except Exception as e:
                    print(f"  Error processing item {i}: {e}")

            print("="*50)
            return (None, )
            
        except Exception as e:
            logger.error(f"Error in debug: {e}")
            print(f"Debug error: {e}")
            return (None, )