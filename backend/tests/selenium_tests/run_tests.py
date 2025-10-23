"""
Main Test Runner for Selenium Test Suite
Executes all test cases and generates comprehensive report
"""
import pytest
import sys
import logging
from pathlib import Path
from datetime import datetime
from utils import generate_html_report
from config import REPORTS_DIR, LOGS_DIR

logger = logging.getLogger(__name__)


def run_all_tests():
    """Run all Selenium tests and generate report"""
    
    print("=" * 80)
    print("SELENIUM TEST SUITE - STRATEGY FORGE INSIGHT")
    print("=" * 80)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Test Directory: {Path(__file__).parent}")
    print("=" * 80)
    print()
    
    # Initialize test results list
    pytest.test_results = []
    
    # Define test files in execution order
    test_files = [
        "test_1_login.py",
        "test_2_backtesting.py",
        "test_3_strategy_builder.py",
        "test_4_strategy_library.py"
    ]
    
    # Run tests with pytest
    print("Running Test Cases...")
    print()
    
    pytest_args = [
        "-v",  # Verbose output
        "-s",  # Show print statements
        "--tb=short",  # Short traceback format
        "--html=" + str(REPORTS_DIR / f"pytest_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"),
        "--self-contained-html",  # Embed CSS in HTML
    ] + test_files
    
    # Run pytest
    exit_code = pytest.main(pytest_args)
    
    print()
    print("=" * 80)
    print("TEST EXECUTION COMPLETED")
    print("=" * 80)
    
    # Generate custom HTML report
    if hasattr(pytest, 'test_results') and len(pytest.test_results) > 0:
        print()
        print("Generating detailed test case report...")
        
        report_filename = f"test_case_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        report_path = REPORTS_DIR / report_filename
        
        try:
            generate_html_report(pytest.test_results, report_path)
            print(f"✓ Test report generated: {report_path}")
            print()
            
            # Print summary
            total_tests = len(pytest.test_results)
            passed_tests = sum(1 for result in pytest.test_results if result.status == "Pass")
            failed_tests = total_tests - passed_tests
            
            print("=" * 80)
            print("TEST SUMMARY")
            print("=" * 80)
            print(f"Total Test Cases: {total_tests}")
            print(f"Passed: {passed_tests}")
            print(f"Failed: {failed_tests}")
            print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
            print("=" * 80)
            print()
            
            # List test case results
            print("TEST CASE RESULTS:")
            print("-" * 80)
            for result in pytest.test_results:
                status_symbol = "✓" if result.status == "Pass" else "✗"
                print(f"{status_symbol} {result.test_case_id}: {result.test_title} - {result.status}")
                total_steps = len(result.steps)
                passed_steps = sum(1 for step in result.steps if step['status'] == 'Pass')
                print(f"   Steps: {passed_steps}/{total_steps} passed")
            print("-" * 80)
            print()
            
            print(f"Reports Location: {REPORTS_DIR}")
            print(f"Screenshots Location: {REPORTS_DIR.parent / 'screenshots'}")
            print(f"Logs Location: {LOGS_DIR}")
            print()
            
        except Exception as e:
            print(f"✗ Failed to generate report: {str(e)}")
            logger.error(f"Report generation failed: {str(e)}")
    
    else:
        print("⚠ No test results to generate report")
    
    print("=" * 80)
    print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    return exit_code


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
