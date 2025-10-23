"""
Utility functions for Selenium tests
Helper methods for common operations
"""
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from config import SCREENSHOTS_DIR, DEFAULT_TIMEOUT, ELEMENT_LOAD_TIMEOUT

# Setup logging
logger = logging.getLogger(__name__)


class TestCaseResult:
    """Store test case execution results"""
    def __init__(self, test_case_id: str, test_title: str):
        self.test_case_id = test_case_id
        self.test_title = test_title
        self.steps: List[Dict[str, Any]] = []
        self.status = "Not Started"
        self.execution_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.screenshots: List[str] = []
        
    def add_step(self, step_number: int, description: str, 
                 test_data: str = "", expected_result: str = "", 
                 actual_result: str = "", status: str = "Pass"):
        """Add a test step result"""
        self.steps.append({
            "step": step_number,
            "description": description,
            "test_data": test_data,
            "expected_result": expected_result,
            "actual_result": actual_result,
            "status": status
        })
        
    def set_status(self, status: str):
        """Set overall test case status"""
        self.status = status
        
    def add_screenshot(self, screenshot_path: str):
        """Add screenshot path"""
        self.screenshots.append(screenshot_path)


class SeleniumHelper:
    """Helper class with common Selenium operations"""
    
    def __init__(self, driver: webdriver.Chrome):
        self.driver = driver
        self.wait = WebDriverWait(driver, DEFAULT_TIMEOUT)
        
    def wait_for_element(self, by: By, value: str, timeout: int = ELEMENT_LOAD_TIMEOUT) -> WebElement:
        """Wait for element to be present and visible"""
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, value))
            )
            logger.info(f"Element found: {value}")
            return element
        except TimeoutException:
            logger.error(f"Timeout waiting for element: {value}")
            self.take_screenshot(f"timeout_{value}")
            raise
            
    def wait_for_clickable(self, by: By, value: str, timeout: int = ELEMENT_LOAD_TIMEOUT) -> WebElement:
        """Wait for element to be clickable"""
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable((by, value))
            )
            logger.info(f"Element clickable: {value}")
            return element
        except TimeoutException:
            logger.error(f"Timeout waiting for clickable element: {value}")
            self.take_screenshot(f"not_clickable_{value}")
            raise
            
    def safe_click(self, element: WebElement, description: str = ""):
        """Safely click an element with retry logic"""
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                element.click()
                logger.info(f"Clicked: {description}")
                return True
            except Exception as e:
                logger.warning(f"Click attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_attempts - 1:
                    time.sleep(1)
                else:
                    raise
        return False
        
    def safe_send_keys(self, element: WebElement, text: str, description: str = ""):
        """Safely send keys to an element"""
        try:
            element.clear()
            element.send_keys(text)
            logger.info(f"Sent keys to: {description}")
            return True
        except Exception as e:
            logger.error(f"Failed to send keys: {str(e)}")
            self.take_screenshot(f"send_keys_failed_{description}")
            raise
            
    def wait_for_url_contains(self, text: str, timeout: int = DEFAULT_TIMEOUT):
        """Wait for URL to contain specific text"""
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.url_contains(text)
            )
            logger.info(f"URL contains: {text}")
            return True
        except TimeoutException:
            logger.error(f"Timeout waiting for URL to contain: {text}")
            return False
            
    def wait_for_text_in_element(self, by: By, value: str, text: str, timeout: int = DEFAULT_TIMEOUT):
        """Wait for specific text to appear in element"""
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.text_to_be_present_in_element((by, value), text)
            )
            logger.info(f"Text '{text}' found in element")
            return True
        except TimeoutException:
            logger.error(f"Timeout waiting for text '{text}' in element")
            return False
            
    def take_screenshot(self, name: str) -> str:
        """Take a screenshot and save it"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.png"
        filepath = SCREENSHOTS_DIR / filename
        try:
            self.driver.save_screenshot(str(filepath))
            logger.info(f"Screenshot saved: {filepath}")
            return str(filepath)
        except Exception as e:
            logger.error(f"Failed to save screenshot: {str(e)}")
            return ""
            
    def scroll_to_element(self, element: WebElement):
        """Scroll to make element visible"""
        try:
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            time.sleep(0.5)  # Brief pause after scrolling
            logger.info("Scrolled to element")
        except Exception as e:
            logger.error(f"Failed to scroll to element: {str(e)}")
            
    def wait_for_page_load(self, timeout: int = DEFAULT_TIMEOUT):
        """Wait for page to fully load"""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            logger.info("Page loaded completely")
            return True
        except TimeoutException:
            logger.error("Page load timeout")
            return False
            
    def is_element_present(self, by: By, value: str) -> bool:
        """Check if element is present on page"""
        try:
            self.driver.find_element(by, value)
            return True
        except NoSuchElementException:
            return False
            
    def get_elements(self, by: By, value: str) -> List[WebElement]:
        """Get all matching elements"""
        try:
            elements = self.driver.find_elements(by, value)
            logger.info(f"Found {len(elements)} elements matching: {value}")
            return elements
        except Exception as e:
            logger.error(f"Failed to find elements: {str(e)}")
            return []
            
    def hover_element(self, element: WebElement):
        """Hover over an element"""
        try:
            from selenium.webdriver.common.action_chains import ActionChains
            actions = ActionChains(self.driver)
            actions.move_to_element(element).perform()
            logger.info("Hovered over element")
        except Exception as e:
            logger.error(f"Failed to hover: {str(e)}")
            
    def drag_and_drop(self, source: WebElement, target: WebElement):
        """Perform drag and drop operation"""
        try:
            from selenium.webdriver.common.action_chains import ActionChains
            actions = ActionChains(self.driver)
            actions.drag_and_drop(source, target).perform()
            logger.info("Drag and drop completed")
            return True
        except Exception as e:
            logger.error(f"Drag and drop failed: {str(e)}")
            self.take_screenshot("drag_drop_failed")
            return False
            
    def wait_and_get_text(self, by: By, value: str, timeout: int = ELEMENT_LOAD_TIMEOUT) -> str:
        """Wait for element and get its text"""
        try:
            element = self.wait_for_element(by, value, timeout)
            text = element.text
            logger.info(f"Got text from element: {text[:50]}...")
            return text
        except Exception as e:
            logger.error(f"Failed to get text: {str(e)}")
            return ""


def generate_html_report(test_results: List[TestCaseResult], output_path: Path):
    """Generate HTML test report"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Selenium Test Report - Strategy Forge Insight</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: #f5f5f5;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }}
            .test-case {{
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .test-case-header {{
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 15px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }}
            th {{
                background-color: #667eea;
                color: white;
                font-weight: bold;
            }}
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            .pass {{
                color: #28a745;
                font-weight: bold;
            }}
            .fail {{
                color: #dc3545;
                font-weight: bold;
            }}
            .info {{
                color: #17a2b8;
            }}
            .screenshot {{
                max-width: 200px;
                margin: 5px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Selenium Test Execution Report</h1>
            <p><strong>Project:</strong> Strategy Forge Insight</p>
            <p><strong>Execution Date:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
            <p><strong>Total Test Cases:</strong> {len(test_results)}</p>
        </div>
    """
    
    for result in test_results:
        pass_count = sum(1 for step in result.steps if step['status'] == 'Pass')
        fail_count = sum(1 for step in result.steps if step['status'] == 'Fail')
        
        html_content += f"""
        <div class="test-case">
            <div class="test-case-header">
                <h2>{result.test_case_id}: {result.test_title}</h2>
                <p><strong>Test Priority:</strong> High</p>
                <p><strong>Test Execution Date:</strong> {result.execution_date}</p>
                <p><strong>Status:</strong> <span class="{result.status.lower()}">{result.status}</span></p>
                <p><strong>Steps Passed:</strong> {pass_count} | <strong>Steps Failed:</strong> {fail_count}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Test Step</th>
                        <th>Test Data</th>
                        <th>Expected Result</th>
                        <th>Actual Result</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        for step in result.steps:
            status_class = "pass" if step['status'] == 'Pass' else "fail"
            html_content += f"""
                    <tr>
                        <td>{step['step']}</td>
                        <td>{step['description']}</td>
                        <td>{step['test_data']}</td>
                        <td>{step['expected_result']}</td>
                        <td>{step['actual_result']}</td>
                        <td class="{status_class}">{step['status']}</td>
                    </tr>
            """
        
        html_content += """
                </tbody>
            </table>
        """
        
        if result.screenshots:
            html_content += "<h3>Screenshots:</h3><div>"
            for screenshot in result.screenshots:
                html_content += f'<img src="{screenshot}" class="screenshot" />'
            html_content += "</div>"
            
        html_content += "</div>"
    
    html_content += """
    </body>
    </html>
    """
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    logger.info(f"HTML report generated: {output_path}")
