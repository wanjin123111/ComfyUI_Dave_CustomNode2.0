# Made by Davemane42#0042 for ComfyUI - Updated for 2025
import torch
import logging

# 获取日志记录器
logger = logging.getLogger('DavemaneCustomNodes.MultiLatentComposite')

class MultiLatentComposite:
    """
    多潜在空间合成节点 - Enhanced for ComfyUI 2025
    
    该节点允许将多个潜在图像合成为一个单一的潜在图像，
    支持位置控制、羽化边缘等高级功能。
    
    Multi-Latent Composite Node - Allows compositing multiple latent images
    into a single latent image with position control and feathering capabilities.
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        """
        定义节点的输入类型
        
        @returns {dict} 输入类型定义
        """
        return {
            "required": {
                "samples_to": ("LATENT", {
                    "tooltip": "目标潜在图像，作为合成的基础层"
                }),
                "samples_from0": ("LATENT", {
                    "tooltip": "源潜在图像，将被合成到目标图像上"
                }),
            },
            "hidden": {
                "extra_pnginfo": "EXTRA_PNGINFO", 
                "unique_id": "UNIQUE_ID"
            },
        }
    
    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("composite_latent",)
    FUNCTION = "composite"
    CATEGORY = "Davemane42"
    
    # ComfyUI 2025 新增属性
    DESCRIPTION = """
    <strong>多潜在合成节点</strong> - 将多个潜在图像合成为单个潜在图像。
    
    特性:
    • 位置精确控制 (8像素对齐)
    • 边缘羽化平滑过渡
    • 多层合成支持
    • 实时可视化界面
    
    用法: 连接目标潜在图像和源潜在图像，通过可视化界面调整位置和羽化参数。
    """
    
    def composite(self, samples_to, extra_pnginfo, unique_id, **kwargs):
        """
        执行多潜在图像合成操作
        
        @param {dict} samples_to - 目标潜在图像数据
        @param {dict} extra_pnginfo - 包含工作流信息的PNG元数据
        @param {str} unique_id - 节点的唯一标识符
        @param {dict} kwargs - 动态源潜在图像参数
        @returns {tuple} 合成后的潜在图像
        """
        try:
            logger.info(f"开始多潜在合成操作, 节点ID: {unique_id}")
            
            # 解析工作流中的位置和羽化参数
            values = self._extract_node_values(extra_pnginfo, unique_id)
            
            if not values:
                logger.warning(f"节点 {unique_id} 未找到配置参数，使用默认值")
                values = []
            
            # 复制目标潜在图像
            samples_out = samples_to.copy()
            s = samples_to["samples"].clone()
            samples_to_tensor = samples_to["samples"]
            
            logger.info(f"目标潜在图像形状: {samples_to_tensor.shape}")
            
            # 处理每个源潜在图像
            processed_count = 0
            for k, arg in enumerate(kwargs):
                if k >= len(values):
                    logger.warning(f"源图像 {k} 超出配置参数范围，跳过处理")
                    break
                
                try:
                    # 获取位置和羽化参数 (确保8像素对齐)
                    x = values[k][0] // 8
                    y = values[k][1] // 8  
                    feather = values[k][2] // 8
                    
                    # 获取源潜在图像
                    samples_from = kwargs[arg]["samples"]
                    
                    logger.info(f"处理源图像 {k}: 位置({x*8}, {y*8}), 羽化: {feather*8}")
                    
                    # 执行合成操作
                    s = self._composite_single_layer(
                        s, samples_from, samples_to_tensor, 
                        x, y, feather, layer_index=k
                    )
                    
                    processed_count += 1
                    
                except Exception as e:
                    logger.error(f"处理源图像 {k} 时出错: {str(e)}")
                    continue
            
            # 更新输出
            samples_out["samples"] = s
            
            logger.info(f"多潜在合成完成，成功处理 {processed_count} 个源图像")
            return (samples_out,)
            
        except Exception as e:
            logger.error(f"多潜在合成操作失败: {str(e)}")
            # 返回原始图像作为回退
            return (samples_to,)
    
    def _extract_node_values(self, extra_pnginfo, unique_id):
        """
        从工作流信息中提取节点参数
        
        @param {dict} extra_pnginfo - PNG元数据
        @param {str} unique_id - 节点唯一ID
        @returns {list} 节点参数列表
        """
        try:
            if not extra_pnginfo or "workflow" not in extra_pnginfo:
                logger.warning("工作流信息缺失")
                return []
            
            workflow_nodes = extra_pnginfo["workflow"].get("nodes", [])
            
            for node in workflow_nodes:
                if str(node.get("id")) == str(unique_id):
                    properties = node.get("properties", {})
                    values = properties.get("values", [])
                    logger.info(f"找到节点配置: {len(values)} 个参数组")
                    return values
            
            logger.warning(f"未找到节点ID {unique_id} 的配置")
            return []
            
        except Exception as e:
            logger.error(f"提取节点参数时出错: {str(e)}")
            return []
    
    def _composite_single_layer(self, target, source, target_original, x, y, feather, layer_index=0):
        """
        合成单个图层到目标图像
        
        @param {torch.Tensor} target - 目标张量
        @param {torch.Tensor} source - 源张量  
        @param {torch.Tensor} target_original - 原始目标张量
        @param {int} x - X位置
        @param {int} y - Y位置  
        @param {int} feather - 羽化值
        @param {int} layer_index - 图层索引
        @returns {torch.Tensor} 合成后的张量
        """
        try:
            # 计算有效的合成区域
            max_y = min(y + source.shape[2], target_original.shape[2])
            max_x = min(x + source.shape[3], target_original.shape[3])
            
            # 裁剪源图像以适应目标区域
            crop_height = max_y - y
            crop_width = max_x - x
            
            if crop_height <= 0 or crop_width <= 0:
                logger.warning(f"图层 {layer_index} 位置超出边界，跳过合成")
                return target
            
            cropped_source = source[:, :, :crop_height, :crop_width]
            
            if feather == 0:
                # 直接复制，无羽化
                target[:, :, y:max_y, x:max_x] = cropped_source
                logger.debug(f"图层 {layer_index} 直接合成完成")
            else:
                # 带羽化的合成
                target = self._composite_with_feather(
                    target, cropped_source, x, y, max_x, max_y, feather, layer_index
                )
                
            return target
            
        except Exception as e:
            logger.error(f"合成图层 {layer_index} 时出错: {str(e)}")
            return target
    
    def _composite_with_feather(self, target, source, x, y, max_x, max_y, feather, layer_index):
        """
        执行带羽化效果的图像合成
        
        @param {torch.Tensor} target - 目标张量
        @param {torch.Tensor} source - 源张量
        @param {int} x, y - 起始位置
        @param {int} max_x, max_y - 结束位置
        @param {int} feather - 羽化像素数
        @param {int} layer_index - 图层索引
        @returns {torch.Tensor} 合成后的张量
        """
        try:
            # 创建羽化遮罩
            mask = torch.ones_like(source, device=source.device, dtype=source.dtype)
            
            # 计算羽化区域
            for t in range(feather):
                fade_factor = (t + 1) / feather
                
                # 上边缘羽化
                if y > 0 and t < source.shape[2]:
                    mask[:, :, t:t+1, :] *= fade_factor
                
                # 下边缘羽化
                bottom_edge = max_y - y
                if max_y < target.shape[2] and (source.shape[2] - 1 - t) >= 0:
                    mask[:, :, source.shape[2] - 1 - t:source.shape[2] - t, :] *= fade_factor
                
                # 左边缘羽化  
                if x > 0 and t < source.shape[3]:
                    mask[:, :, :, t:t+1] *= fade_factor
                
                # 右边缘羽化
                right_edge = max_x - x
                if max_x < target.shape[3] and (source.shape[3] - 1 - t) >= 0:
                    mask[:, :, :, source.shape[3] - 1 - t:source.shape[3] - t] *= fade_factor
            
            # 计算反向遮罩
            inv_mask = 1.0 - mask
            
            # 执行混合
            target_region = target[:, :, y:max_y, x:max_x]
            blended = source * mask + target_region * inv_mask
            target[:, :, y:max_y, x:max_x] = blended
            
            logger.debug(f"图层 {layer_index} 羽化合成完成，羽化值: {feather*8}")
            return target
            
        except Exception as e:
            logger.error(f"羽化合成图层 {layer_index} 时出错: {str(e)}")
            return target