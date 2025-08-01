#!/usr/bin/env python3
"""
Test runner for polygonizer tests
"""

import sys
import pytest
from pathlib import Path

def main():
    """Run tests in the polygonizer tests directory"""
    # Get the directory containing this script
    test_dir = Path(__file__).parent
    
    # Default to running all tests
    if len(sys.argv) == 1:
        args = [
            str(test_dir),
            "-v",  # Verbose output
            "--tb=short",  # Short traceback format
        ]
    else:
        # Run specific test file or test function
        args = sys.argv[1:]
        if not args[0].startswith('-'):
            # If first arg is not a pytest option, assume it's a test file
            test_file = test_dir / args[0]
            if test_file.exists():
                args[0] = str(test_file)
    
    exit_code = pytest.main(args)
    return exit_code

if __name__ == "__main__":
    sys.exit(main()) 