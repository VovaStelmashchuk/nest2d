#!/usr/bin/env python3
"""
Test script for the lbf binary
"""
import json
import string
import subprocess
import sys

def test_lbf():
    sample_input = {
        "config": {
            "cde_config": {
                "quadtree_depth": 5,
                "cd_threshold": 16,
                "item_surrogate_config": {
                    "n_pole_limits": [[100, 0.0], [20, 0.75], [10, 0.90]],
                    "n_ff_poles": 2,
                    "n_ff_piers": 0
                }
            },
            "poly_simpl_tolerance": 0.001,
            "min_item_separation": 0.0,
            "prng_seed": 0,
            "n_samples": 5000,
            "ls_frac": 0.2
        },
        "problem_type": "bpp",
        "instance": {
            "name": "Test",
            "items": [
                {
                  "id": 0,
                  "demand": 1,
                  "allowed_orientations": [
                    0.0,
                    180.0
                  ],
                  "shape": {
                    "type": "simple_polygon",
                    "data": [
                      [
                        0.0,
                        0.0
                      ],
                      [
                        2.0,
                        0.0
                      ],
                      [
                        2.0,
                        2.0
                      ],
                      [
                        0.0,
                        2.0
                      ],
                      [
                        0.0,
                        0.0
                      ]
                    ]
                  }
                }
            ],
            "bins": [
              {
                "id": 0,
                "cost": 1,
                "stock": 1,
                "shape": {
                  "type": "polygon",
                  "data": {
                  "outer": [
                      [0.0, 0.0],
                      [100.0, 0.0],
                      [100.0, 100.0],
                      [0.0, 100.0]
                    ]
                  }
                }
              }
            ]
        }
    }
    
    try:
        input_json_as_string : str = json.dumps(sample_input)
        
        result = subprocess.run(
            ['lbf'],
            input=input_json_as_string,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("✅ lbf executed successfully!")
            print("Output:")
            print(result.stdout)
        else:
            print("❌ lbf failed with return code:", result.returncode)
            print("Error output:")
            print(result.stderr)
            
    except subprocess.TimeoutExpired:
        print("❌ lbf execution timed out")
    except FileNotFoundError:
        print("❌ lbf binary not found. Make sure it's built and available in PATH")
    except Exception as e:
        print(f"❌ Error running lbf: {e}")

if __name__ == "__main__":
    test_lbf()
