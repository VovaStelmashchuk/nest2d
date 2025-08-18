"""
Python wrapper for jagua-rs Rust library
This module provides a Python interface to the jagua-rs nesting engine
"""

import json
import subprocess
import tempfile
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class JaguaWrapper:
    """Python wrapper for jagua-rs Rust library"""
    
    def __init__(self):
        """
        Initialize the jagua wrapper

        This will look for the jagua-rs executable in system PATH first, then in the submodule.
        """
        self.jagua_path = None

        # Priority 1: Check system PATH (for Docker builds)
        system_jagua = self._find_system_jagua()
        if system_jagua:
            self.jagua_path = system_jagua
            logger.info(f"Using system jagua-rs: {system_jagua}")
        else:
            # Priority 2: Look for the jagua-rs executable in the submodule
            current_dir = Path(__file__).parent
            release_path = current_dir / "jagua-rs" / "target" / "release" / "jagua-rs"
            debug_path = current_dir / "jagua-rs" / "target" / "debug" / "jagua-rs"

            if release_path.exists():
                self.jagua_path = release_path
                logger.info(f"Using jagua-rs executable: {release_path}")
            elif debug_path.exists():
                self.jagua_path = debug_path
                logger.info(f"Using jagua-rs executable: {debug_path}")
            else:
                logger.info("jagua-rs executable not found, using Python fallback implementation")

    def _find_system_jagua(self) -> Optional[Path]:
        """Find jagua-rs in system PATH"""
        try:
            # Check if jagua-rs is available in PATH
            result = subprocess.run(
                ["which", "jagua-rs"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                jagua_path = Path(result.stdout.strip())
                if jagua_path.exists():
                    # Verify it's executable
                    if os.access(jagua_path, os.X_OK):
                        return jagua_path
                    else:
                        logger.warning(f"Found jagua-rs at {jagua_path} but it's not executable")
                        return None
                else:
                    logger.warning(f"jagua-rs path {jagua_path} doesn't exist")
                    return None
            else:
                logger.debug("jagua-rs not found in system PATH")
                return None
                
        except subprocess.TimeoutExpired:
            logger.warning("Timeout checking system PATH for jagua-rs")
            return None
        except Exception as e:
            logger.debug(f"Error checking system PATH: {e}")
            return None
    
    def build_jagua(self) -> bool:
        """
        Build the jagua-rs Rust project
        
        Returns:
            True if build successful, False otherwise
        """
        if self.jagua_path:
            logger.info("jagua-rs already available, no need to build")
            return True
            
        try:
            jagua_dir = Path(__file__).parent / "jagua-rs"
            logger.info(f"Building jagua-rs in {jagua_dir}")
            
            # Build the project
            result = subprocess.run(
                ["cargo", "build", "--release"],
                cwd=jagua_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                logger.info("jagua-rs built successfully")
                # Update the path
                self.jagua_path = jagua_dir / "target" / "release" / "jagua-rs"
                return True
            else:
                logger.error(f"Failed to build jagua-rs: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("Build timed out")
            return False
        except Exception as e:
            logger.error(f"Error building jagua-rs: {e}")
            return False
    
    def solve_bin_packing(
        self,
        parts: List[Dict[str, Any]],
        bin_width: float,
        bin_height: float,
        tolerance: float = 0.001,
        space: float = 0.0
    ) -> Dict[str, Any]:
        """
        Solve bin packing problem using jagua-rs or Python fallback
        
        Args:
            parts: List of parts with geometry data
            bin_width: Width of the bin
            bin_height: Height of the bin
            tolerance: Tolerance for collision detection
            space: Minimum space between parts
            
        Returns:
            Solution with placed parts and metrics
        """
        if self.jagua_path:
            return self._solve_with_jagua("bin_packing", {
                "bin_width": bin_width,
                "bin_height": bin_height,
                "tolerance": tolerance,
                "space": space,
                "parts": parts
            })
        else:
            raise RuntimeError("jagua-rs executable not found")
    
    def _solve_with_jagua(self, problem_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Solve using jagua-rs executable"""
        # Create temporary input file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            input_data = {"problem_type": problem_type, **data}
            json.dump(input_data, f, indent=2)
            input_file = f.name
        
        try:
            # Call jagua-rs
            result = subprocess.run(
                [str(self.jagua_path), "solve", "--input", input_file],
                capture_output=True,
                text=True,
                timeout=60  # 1 minute timeout
            )
            
            if result.returncode == 0:
                # Parse the output
                solution = json.loads(result.stdout)
                logger.info(f"{problem_type} solved successfully with jagua-rs")
                return solution
            else:
                logger.error(f"jagua-rs failed: {result.stderr}")
                raise RuntimeError(f"jagua-rs failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            logger.error("jagua-rs timed out")
            raise RuntimeError("jagua-rs timed out")
        finally:
            # Clean up temporary file
            os.unlink(input_file)
    
    def get_version(self) -> str:
        """Get the version of jagua-rs"""
        if self.jagua_path and not self.use_python_fallback:
            try:
                result = subprocess.run(
                    [str(self.jagua_path), "--version"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0:
                    return result.stdout.strip()
                else:
                    return "Unknown"
                    
            except Exception as e:
                logger.error(f"Error getting version: {e}")
                return "Unknown"
        else:
            return "Python Fallback Implementation"
    