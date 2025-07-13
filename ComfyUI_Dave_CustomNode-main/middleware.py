"""
Human Body Parts 中间件系统
用于JavaScript和Python之间的实时数据同步

Created: 2025-01-27
Author: Davemane42
"""

import json
import os
import tempfile
import logging
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class HumanBodyPartsMiddleware:
    """
    人体部件中间件 - 负责前后端数据同步
    """
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "comfyui_human_body_parts"
        self.temp_dir.mkdir(exist_ok=True)
        self.config_file = self.temp_dir / "config.json"
        logger.info(f"🔧 中间件初始化完成，配置文件路径: {self.config_file}")
    
    def save_config(self, node_id: str, config: Dict[str, Any]) -> bool:
        """
        保存配置到临时文件
        
        Args:
            node_id: 节点ID
            config: 配置数据
            
        Returns:
            是否保存成功
        """
        try:
            # 读取现有配置
            all_configs = {}
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    all_configs = json.load(f)
            
            # 更新配置
            all_configs[node_id] = config
            
            # 写入文件
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(all_configs, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ 配置保存成功: 节点ID={node_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 配置保存失败: {e}")
            return False
    
    def load_config(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        从临时文件加载配置
        
        Args:
            node_id: 节点ID
            
        Returns:
            配置数据或None
        """
        try:
            if not self.config_file.exists():
                logger.warning("⚠️ 配置文件不存在")
                return None
            
            with open(self.config_file, 'r', encoding='utf-8') as f:
                all_configs = json.load(f)
            
            config = all_configs.get(node_id)
            if config:
                logger.info(f"✅ 配置加载成功: 节点ID={node_id}")
                return config
            else:
                logger.warning(f"⚠️ 节点配置不存在: {node_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ 配置加载失败: {e}")
            return None
    
    def clear_config(self, node_id: Optional[str] = None) -> bool:
        """
        清除配置
        
        Args:
            node_id: 节点ID，如果为None则清除所有配置
            
        Returns:
            是否清除成功
        """
        try:
            if node_id is None:
                # 清除所有配置
                if self.config_file.exists():
                    self.config_file.unlink()
                logger.info("🗑️ 所有配置已清除")
            else:
                # 清除特定节点配置
                if self.config_file.exists():
                    with open(self.config_file, 'r', encoding='utf-8') as f:
                        all_configs = json.load(f)
                    
                    if node_id in all_configs:
                        del all_configs[node_id]
                        
                        with open(self.config_file, 'w', encoding='utf-8') as f:
                            json.dump(all_configs, f, ensure_ascii=False, indent=2)
                        
                        logger.info(f"🗑️ 节点配置已清除: {node_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ 配置清除失败: {e}")
            return False

# 全局中间件实例
_middleware = HumanBodyPartsMiddleware()

def save_body_parts_config(node_id: str, config: Dict[str, Any]) -> bool:
    """保存身体部件配置"""
    return _middleware.save_config(node_id, config)

def load_body_parts_config(node_id: str) -> Optional[Dict[str, Any]]:
    """加载身体部件配置"""
    return _middleware.load_config(node_id)

def clear_body_parts_config(node_id: Optional[str] = None) -> bool:
    """清除身体部件配置"""
    return _middleware.clear_config(node_id) 