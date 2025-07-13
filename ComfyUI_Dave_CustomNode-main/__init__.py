# Made by Davemane42#0042 for ComfyUI - Fully Compatible with v0.3.43
import os
import subprocess
import importlib.util
import sys
import filecmp
import shutil
import logging
from pathlib import Path
import traceback

import __main__

# 获取Python可执行文件路径
python = sys.executable

# 设置日志记录器 - Winston兼容格式
logger = logging.getLogger('DavemaneCustomNodes')
logger.setLevel(logging.INFO)

# 创建控制台处理器
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

def get_comfyui_directory():
    """
    获取ComfyUI主目录 - 兼容v0.3.43的目录结构
    Get ComfyUI main directory compatible with v0.3.43 structure
    """
    try:
        # 尝试多种方式获取ComfyUI目录
        if hasattr(__main__, '__file__') and __main__.__file__:
            return os.path.dirname(os.path.realpath(__main__.__file__))
        
        # 备用方法：通过import路径获取
        import folder_paths
        if hasattr(folder_paths, 'base_path'):
            return folder_paths.base_path
        
        # 最后的备用方法
        return os.getcwd()
        
    except Exception as e:
        logger.warning(f"无法确定ComfyUI目录，使用当前工作目录: {e}")
        return os.getcwd()

def setup_javascript_extensions():
    """
    设置JavaScript扩展文件 - 适配ComfyUI v0.3.43前端
    Setup JavaScript extensions compatible with ComfyUI v0.3.43 frontend
    """
    try:
        # 获取ComfyUI主目录和扩展目录
        comfyui_main_dir = get_comfyui_directory()
        
        # v0.3.43支持多种前端扩展路径
        possible_extension_paths = [
            Path(comfyui_main_dir) / "web" / "extensions" / "dave_custom_nodes",
            Path(comfyui_main_dir) / "web" / "extensions" / "Davemane42",
            Path(comfyui_main_dir) / "web" / "js" / "extensions" / "dave_custom_nodes",
            Path(comfyui_main_dir) / "app" / "extensions" / "dave_custom_nodes"
        ]
        
        javascript_folder = Path(__file__).parent / "javascript"
        
        logger.info(f"设置JavaScript扩展: {javascript_folder}")
        
        if not javascript_folder.exists():
            logger.warning(f"JavaScript源目录不存在: {javascript_folder}")
            return
        
        # 尝试每个可能的扩展路径
        success = False
        for extensions_folder in possible_extension_paths:
            try:
                # 确保目标目录存在
                extensions_folder.mkdir(parents=True, exist_ok=True)
                
                # 比较目录差异
                result = filecmp.dircmp(str(javascript_folder), str(extensions_folder))
                
                if result.left_only or result.diff_files:
                    logger.info(f'检测到JavaScript文件更新，同步到: {extensions_folder}')
                    file_list = list(result.left_only)
                    file_list.extend(x for x in result.diff_files if x not in file_list)
                    
                    for file in file_list:
                        try:
                            src_file = javascript_folder / file
                            dst_file = extensions_folder / file
                            
                            # 如果目标文件存在，先删除
                            if dst_file.exists():
                                dst_file.unlink()
                            
                            # 复制文件
                            shutil.copy2(str(src_file), str(dst_file))
                            logger.info(f'已复制 {file} 到 {extensions_folder}')
                            
                        except Exception as e:
                            logger.error(f'复制文件 {file} 时出错: {str(e)}')
                else:
                    logger.info(f'JavaScript文件已是最新版本: {extensions_folder}')
                
                success = True
                break  # 成功后退出循环
                
            except Exception as e:
                logger.warning(f'尝试扩展路径 {extensions_folder} 失败: {str(e)}')
                continue
        
        if not success:
            logger.error('所有JavaScript扩展路径都失败了')
                
    except Exception as e:
        logger.error(f'设置JavaScript扩展时出错: {str(e)}')
        logger.error(traceback.format_exc())

def is_package_installed(package_name, package_overwrite=None):
    """
    检查并安装所需的Python包 - 改进的错误处理
    Enhanced package installation with better error handling for v0.3.43
    """
    try:
        spec = importlib.util.find_spec(package_name)
    except (ModuleNotFoundError, ImportError, ValueError):
        spec = None
    
    package_to_install = package_overwrite or package_name
    
    if spec is None:
        logger.info(f"正在安装包: {package_to_install}...")
        
        try:
            command = [python, '-m', 'pip', 'install', package_to_install]
            result = subprocess.run(
                command, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True,
                timeout=300,  # 5分钟超时
                check=False
            )
            
            if result.returncode == 0:
                logger.info(f"成功安装包: {package_to_install}")
                return True
            else:
                logger.error(f"安装包失败: {package_to_install}")
                logger.error(f"错误输出: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error(f"安装包超时: {package_to_install}")
            return False
        except Exception as e:
            logger.error(f"安装包时出现异常: {package_to_install}, 错误: {str(e)}")
            return False
    else:
        logger.debug(f"包已安装: {package_name}")
        return True

def check_comfyui_version():
    """
    检查ComfyUI版本兼容性
    Check ComfyUI version compatibility for v0.3.43
    """
    try:
        # 尝试导入ComfyUI版本信息
        try:
            from comfyui_version import VERSION
            current_version = VERSION
        except ImportError:
            try:
                import comfy
                current_version = getattr(comfy, '__version__', 'unknown')
            except ImportError:
                current_version = 'unknown'
        
        logger.info(f"检测到ComfyUI版本: {current_version}")
        
        # 检查版本兼容性
        if current_version != 'unknown':
            # 简单的版本比较（可以改进为更复杂的版本解析）
            if '0.3.' in str(current_version):
                logger.info("版本兼容性检查通过")
                return True
            else:
                logger.warning(f"当前版本 {current_version} 可能不完全兼容，建议使用v0.3.40+")
        
        return True
        
    except Exception as e:
        logger.warning(f"版本检查失败，继续加载: {str(e)}")
        return True

def initialize_nodes():
    """
    初始化自定义节点 - ComfyUI v0.3.43兼容版本
    Initialize custom nodes with enhanced error handling for v0.3.43
    """
    try:
        logger.info("正在初始化Davemane42自定义节点 (v0.3.43兼容)...")
        
        # 检查ComfyUI版本
        check_comfyui_version()
        
        # 设置JavaScript扩展
        setup_javascript_extensions()
        
        # 检查基础依赖
        try:
            import torch
            logger.info(f"PyTorch版本: {torch.__version__}")
        except ImportError:
            logger.error("PyTorch未安装，节点可能无法正常工作")
            return False
        
        # 尝试导入ComfyUI核心模块
        try:
            import comfy.model_management
            import comfy.utils
            import folder_paths
            logger.info("ComfyUI核心模块导入成功")
        except ImportError as e:
            logger.error(f"ComfyUI核心模块导入失败: {str(e)}")
            return False
        
        # 导入节点类
        try:
            from .MultiAreaConditioning import (
                MultiAreaConditioning, 
                ConditioningUpscale, 
                ConditioningStretch, 
                ConditioningDebug
            )
            from .MultiLatentComposite import MultiLatentComposite
            from .HumanBodyParts import (
                HumanBodyPartsConditioning,
                HumanBodyPartsDebug
            )
            # 导入新的Flux Kontext节点
            from .FluxKontextNode import (
                FluxKontextNode,
                FluxKontextImageStitch,
                FluxKontextPromptHelper,
                FluxKontextProcessor
            )
            # 导入新的多图区域编辑节点
            from .MultiImageAreaEditor import MultiImageAreaEditor
            
            logger.info("节点类导入成功（包括人体部件节点和Flux Kontext节点）")
            return True
            
        except ImportError as e:
            logger.error(f"导入节点类时出错: {str(e)}")
            logger.error(traceback.format_exc())
            return False
        
    except Exception as e:
        logger.error(f"初始化节点时出现未知错误: {str(e)}")
        logger.error(traceback.format_exc())
        return False

# 导出版本信息（兼容ComfyUI v0.3.43）
__version__ = "4.0.0-ultimate-2025"
__author__ = "Davemane42"
__description__ = "Enhanced Multi Area Conditioning, Professional Medical-Grade Human Body Parts, and Flux Kontext Integration nodes for ComfyUI v0.3.43 - Advanced human anatomy conditioning with medical presets and state-of-the-art image editing"
__comfyui_version__ = "0.3.43"
__comfyui_compatibility__ = ">=0.3.40"

# ComfyUI v0.3.43扩展元数据（新增）
EXTENSION_METADATA = {
    "name": "ComfyUI Dave Custom Node",
    "version": __version__,
    "description": __description__,
    "author": __author__,
    "keywords": ["conditioning", "latent", "composite", "rotation", "area", "v0.3.43"],
    "comfyui_version": __comfyui_version__,
    "compatibility": __comfyui_compatibility__,
    "python_dependencies": ["torch"],
    "frontend_dependencies": [],
    "license": "MIT",
    "homepage": "https://github.com/davemane42/ComfyUI_Dave_CustomNode",
    "last_updated": "2025-01-27",
    "api_version": "1.0",
    "frontend_api_version": "1.23.4"
}

# v0.3.43新增：WEB_DIRECTORY支持（如果需要）
try:
    WEB_DIRECTORY = "./javascript"
except:
    pass

# 主初始化逻辑
initialization_success = False
node_classes = {}
node_display_names = {}

try:
    if initialize_nodes():
        # 导入节点类
        from .MultiAreaConditioning import (
            MultiAreaConditioning, 
            ConditioningUpscale, 
            ConditioningStretch, 
            ConditioningDebug
        )
        from .MultiLatentComposite import MultiLatentComposite
        from .HumanBodyParts import (
            HumanBodyPartsConditioning,
            HumanBodyPartsDebug
        )
        # 导入新的Flux Kontext节点
        from .FluxKontextNode import (
            FluxKontextNode,
            FluxKontextImageStitch,
            FluxKontextPromptHelper
        )
        # 导入新的多图区域编辑节点
        from .MultiImageAreaEditor import MultiImageAreaEditor
        
        # 节点类映射 - ComfyUI v0.3.43兼容格式
        node_classes = {
            "MultiLatentComposite": MultiLatentComposite,
            "MultiAreaConditioning": MultiAreaConditioning, 
            "ConditioningUpscale": ConditioningUpscale,
            "ConditioningStretch": ConditioningStretch,
            "ConditioningDebug": ConditioningDebug,
            "HumanBodyPartsConditioning": HumanBodyPartsConditioning,
            "HumanBodyPartsDebug": HumanBodyPartsDebug,
            # 新增Flux Kontext节点
            "FluxKontextNode": FluxKontextNode,
            "FluxKontextImageStitch": FluxKontextImageStitch,
            "FluxKontextPromptHelper": FluxKontextPromptHelper,
            # 新增多图区域编辑节点
            "MultiImageAreaEditor": MultiImageAreaEditor,
        }
        
        # 节点显示名称映射（ComfyUI v0.3.43兼容）
        node_display_names = {
            "MultiLatentComposite": "Multi Latent Composite (Dave)",
            "MultiAreaConditioning": "Multi Area Conditioning (Dave)",
            "ConditioningUpscale": "Conditioning Upscale (Dave)", 
            "ConditioningStretch": "Conditioning Stretch (Dave)",
            "ConditioningDebug": "Conditioning Debug (Dave)",
            "HumanBodyPartsConditioning": "Human Body Parts Conditioning (Dave)",
            "HumanBodyPartsDebug": "Human Body Parts Debug (Dave)",
            # 新增Flux Kontext节点显示名称
            "FluxKontextNode": "🎨 Flux Kontext Editor (Dave)",
            "FluxKontextImageStitch": "🔗 Flux Kontext Image Stitch (Dave)",
            "FluxKontextPromptHelper": "💡 Flux Kontext Prompt Helper (Dave)",
        }
        
        initialization_success = True
        
        # 成功消息
        logger.info(f'\033[34mDavemane42 Custom Nodes v{__version__}: \033[92m✓ 已加载 (ComfyUI v{__comfyui_version__}兼容)\033[0m')
        print(f'\033[34mDavemane42 Custom Nodes v{__version__}: \033[92m✓ 已加载 (ComfyUI v{__comfyui_version__}兼容)\033[0m')
        
    else:
        logger.error("节点初始化失败")
        
except Exception as e:
    logger.error(f"模块加载时出现错误: {str(e)}")
    logger.error(traceback.format_exc())

# 导出的变量（ComfyUI v0.3.43要求）
NODE_CLASS_MAPPINGS = node_classes
NODE_DISPLAY_NAME_MAPPINGS = node_display_names

# 添加新的元数据导出（v0.3.43支持）
__all__ = [
    "NODE_CLASS_MAPPINGS", 
    "NODE_DISPLAY_NAME_MAPPINGS",
    "EXTENSION_METADATA",
    "__version__"
]