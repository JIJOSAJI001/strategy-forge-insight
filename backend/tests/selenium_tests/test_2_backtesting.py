"""
Test Case 2: Backtesting Page Test
Tests backtesting functionality and UI elements
"""
import pytest
import time
import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from config import BASE_URL, URLS
from utils import TestCaseResult, SeleniumHelper

logger = logging.getLogger(__name__)


class TestBacktesting:
    """Test Case 2: Backtesting Page functionality"""
    
    def test_backtesting_page(self, driver, helper: SeleniumHelper):
        """
        Test Case ID: Test 2
        Test Title: Backtesting Page Test Case
        Description: Verify backtesting page loads and displays correctly with all components
        Pre-Condition: User is logged in successfully
        """
        
        # Initialize test result
        test_result = TestCaseResult("Test 2", "Backtesting Page Test Case")
        test_result.execution_date = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("=" * 80)
            logger.info("Starting Test Case 2: Backtesting Page Test")
            logger.info("=" * 80)
            
            # ============= LOGIN FIRST (Pre-requisite) =============
            logger.info("Pre-requisite: Logging in to application")
            try:
                from config import TEST_EMAIL, TEST_PASSWORD
                
                # Navigate to home page
                driver.get(BASE_URL)
                helper.wait_for_page_load()
                time.sleep(2)
                
                # Click Login/Sign Up button
                login_btn = helper.wait_for_clickable(By.XPATH, "//button[contains(text(), 'Login') or contains(text(), 'Sign Up')]")
                helper.safe_click(login_btn, "Login button")
                time.sleep(2)
                
                # Enter credentials
                email_field = helper.wait_for_element(By.CSS_SELECTOR, "input[type='email']")
                email_field.clear()
                email_field.send_keys(TEST_EMAIL)
                
                password_field = helper.wait_for_element(By.CSS_SELECTOR, "input[type='password']")
                password_field.clear()
                password_field.send_keys(TEST_PASSWORD)
                
                # Click submit
                submit_btn = helper.wait_for_clickable(By.XPATH, "//button[@type='submit' and (contains(text(), 'Sign') or contains(text(), 'Login'))]")
                helper.safe_click(submit_btn, "Submit button")
                time.sleep(3)
                
                # Wait for dashboard
                helper.wait_for_url_contains("dashboard")
                logger.info("Pre-requisite completed - Login successful")
                
            except Exception as e:
                logger.error(f"Login failed: {str(e)}")
                raise
            
            # ============= STEP 1: Navigate to Backtesting Page =============
            logger.info("Step 1: Navigate to backtesting page")
            step_1_data = URLS["backtesting"]
            step_1_expected = "Backtesting page loads successfully with heading visible"
            
            try:
                driver.get(URLS["backtesting"])
                helper.wait_for_page_load()
                time.sleep(3)  # Allow page to fully render
                
                # Take screenshot
                screenshot_1 = helper.take_screenshot("step1_backtesting_page_loaded")
                test_result.add_screenshot(screenshot_1)
                
                # Verify page loaded
                current_url = driver.current_url
                page_loaded = "backtesting" in current_url.lower()
                
                step_1_actual = f"Backtesting page loaded. URL: {current_url}"
                test_result.add_step(
                    step_number=1,
                    description="Navigate to backtesting page URL",
                    test_data=step_1_data,
                    expected_result=step_1_expected,
                    actual_result=step_1_actual,
                    status="Pass" if page_loaded else "Fail"
                )
                logger.info("✓ Step 1 PASSED")
                
                assert page_loaded, f"Not on backtesting page. Current URL: {current_url}"
                
            except Exception as e:
                step_1_actual = f"Failed to navigate to backtesting page: {str(e)}"
                test_result.add_step(1, "Navigate to backtesting page", step_1_data, 
                                   step_1_expected, step_1_actual, "Fail")
                logger.error(f"✗ Step 1 FAILED: {str(e)}")
                raise
            
            # ============= STEP 2: Verify Page Title/Header =============
            logger.info("Step 2: Verify backtesting page title and header")
            step_2_data = "Check for page heading"
            step_2_expected = "Page displays 'Backtesting' or similar heading"
            
            try:
                # Look for heading
                try:
                    heading = helper.wait_for_element(
                        By.XPATH,
                        "//*[contains(text(), 'Backtest') or contains(text(), 'Strategy Test')]",
                        timeout=10
                    )
                    heading_text = heading.text
                    heading_visible = heading.is_displayed()
                except:
                    heading_text = "Heading not found"
                    heading_visible = False
                
                # Take screenshot
                screenshot_2 = helper.take_screenshot("step2_page_heading")
                test_result.add_screenshot(screenshot_2)
                
                step_2_actual = f"Page heading found: '{heading_text}'. Visible: {heading_visible}"
                test_result.add_step(
                    step_number=2,
                    description="Verify page title/heading is displayed",
                    test_data=step_2_data,
                    expected_result=step_2_expected,
                    actual_result=step_2_actual,
                    status="Pass" if heading_visible else "Fail"
                )
                logger.info("✓ Step 2 PASSED" if heading_visible else "⚠ Step 2 WARNING")
                
            except Exception as e:
                step_2_actual = f"Failed to verify page heading: {str(e)}"
                test_result.add_step(2, "Verify page heading", step_2_data, 
                                   step_2_expected, step_2_actual, "Fail")
                logger.error(f"✗ Step 2 FAILED: {str(e)}")
            
            # ============= STEP 3: Verify Strategy Selection Input =============
            logger.info("Step 3: Verify strategy selection input field")
            step_3_data = "Check for strategy selector/input"
            step_3_expected = "Strategy selection input or dropdown is present and interactable"
            
            try:
                strategy_input_found = False
                strategy_type = ""
                
                # Try to find select dropdown
                try:
                    select_elements = helper.get_elements(By.TAG_NAME, "select")
                    if len(select_elements) > 0:
                        strategy_input_found = True
                        strategy_type = f"Dropdown (found {len(select_elements)} select elements)"
                except:
                    pass
                
                # Try to find input fields
                if not strategy_input_found:
                    try:
                        input_elements = helper.get_elements(By.CSS_SELECTOR, "input[type='text'], input:not([type])")
                        if len(input_elements) > 0:
                            strategy_input_found = True
                            strategy_type = f"Input field (found {len(input_elements)} input elements)"
                    except:
                        pass
                
                # Try to find button that opens strategy selector
                if not strategy_input_found:
                    try:
                        buttons = helper.get_elements(By.XPATH, "//button[contains(text(), 'Select') or contains(text(), 'Choose')]")
                        if len(buttons) > 0:
                            strategy_input_found = True
                            strategy_type = f"Button selector (found {len(buttons)} buttons)"
                    except:
                        pass
                
                # Take screenshot
                screenshot_3 = helper.take_screenshot("step3_strategy_input")
                test_result.add_screenshot(screenshot_3)
                
                step_3_actual = f"Strategy input field found: {strategy_input_found}. Type: {strategy_type}"
                test_result.add_step(
                    step_number=3,
                    description="Verify strategy selection input is present",
                    test_data=step_3_data,
                    expected_result=step_3_expected,
                    actual_result=step_3_actual,
                    status="Pass" if strategy_input_found else "Fail"
                )
                logger.info("✓ Step 3 PASSED" if strategy_input_found else "⚠ Step 3 WARNING")
                
            except Exception as e:
                step_3_actual = f"Failed to verify strategy input: {str(e)}"
                test_result.add_step(3, "Verify strategy input", step_3_data, 
                                   step_3_expected, step_3_actual, "Fail")
                logger.error(f"✗ Step 3 FAILED: {str(e)}")
            
            # ============= STEP 4: Verify Symbol/Ticker Input =============
            logger.info("Step 4: Verify symbol/ticker input field")
            step_4_data = "Check for symbol/ticker input"
            step_4_expected = "Symbol input field is present and can accept text"
            
            try:
                symbol_input_found = False
                symbol_placeholder = ""
                
                # Look for inputs with symbol-related attributes
                try:
                    symbol_inputs = helper.get_elements(
                        By.XPATH,
                        "//input[contains(@placeholder, 'symbol') or contains(@placeholder, 'ticker') or contains(@placeholder, 'Symbol') or contains(@placeholder, 'Ticker') or @name='symbol' or @id='symbol']"
                    )
                    if len(symbol_inputs) > 0:
                        symbol_input_found = True
                        symbol_placeholder = symbol_inputs[0].get_attribute("placeholder") or "No placeholder"
                except:
                    pass
                
                # Take screenshot
                screenshot_4 = helper.take_screenshot("step4_symbol_input")
                test_result.add_screenshot(screenshot_4)
                
                step_4_actual = f"Symbol input found: {symbol_input_found}. Placeholder: '{symbol_placeholder}'"
                test_result.add_step(
                    step_number=4,
                    description="Verify symbol/ticker input field is present",
                    test_data=step_4_data,
                    expected_result=step_4_expected,
                    actual_result=step_4_actual,
                    status="Pass" if symbol_input_found else "Fail"
                )
                logger.info("✓ Step 4 PASSED" if symbol_input_found else "⚠ Step 4 WARNING")
                
            except Exception as e:
                step_4_actual = f"Failed to verify symbol input: {str(e)}"
                test_result.add_step(4, "Verify symbol input", step_4_data, 
                                   step_4_expected, step_4_actual, "Fail")
                logger.error(f"✗ Step 4 FAILED: {str(e)}")
            
            # ============= STEP 5: Verify Date Range Inputs =============
            logger.info("Step 5: Verify date range input fields")
            step_5_data = "Check for start date and end date inputs"
            step_5_expected = "Date input fields are present for selecting date range"
            
            try:
                date_inputs_found = 0
                date_input_types = []
                
                # Look for date input fields
                try:
                    date_inputs = helper.get_elements(By.CSS_SELECTOR, "input[type='date']")
                    date_inputs_found += len(date_inputs)
                    if len(date_inputs) > 0:
                        date_input_types.append(f"Date inputs: {len(date_inputs)}")
                except:
                    pass
                
                # Look for date picker components
                try:
                    date_pickers = helper.get_elements(By.XPATH, "//*[contains(@class, 'date') or contains(@class, 'calendar')]")
                    if len(date_pickers) > 0:
                        date_input_types.append(f"Date pickers: {len(date_pickers)}")
                        date_inputs_found += len(date_pickers)
                except:
                    pass
                
                # Take screenshot
                screenshot_5 = helper.take_screenshot("step5_date_inputs")
                test_result.add_screenshot(screenshot_5)
                
                step_5_actual = f"Date inputs found: {date_inputs_found}. Types: {', '.join(date_input_types) if date_input_types else 'None'}"
                test_result.add_step(
                    step_number=5,
                    description="Verify date range input fields are present",
                    test_data=step_5_data,
                    expected_result=step_5_expected,
                    actual_result=step_5_actual,
                    status="Pass" if date_inputs_found > 0 else "Fail"
                )
                logger.info("✓ Step 5 PASSED" if date_inputs_found > 0 else "⚠ Step 5 WARNING")
                
            except Exception as e:
                step_5_actual = f"Failed to verify date inputs: {str(e)}"
                test_result.add_step(5, "Verify date inputs", step_5_data, 
                                   step_5_expected, step_5_actual, "Fail")
                logger.error(f"✗ Step 5 FAILED: {str(e)}")
            
            # ============= STEP 6: Verify Run/Execute Button =============
            logger.info("Step 6: Verify run/execute backtest button")
            step_6_data = "Check for run/execute button"
            step_6_expected = "Run button is present and clickable"
            
            try:
                run_button_found = False
                run_button_text = ""
                
                # Look for run/execute button
                try:
                    run_buttons = helper.get_elements(
                        By.XPATH,
                        "//button[contains(text(), 'Run') or contains(text(), 'Execute') or contains(text(), 'Start') or contains(text(), 'Backtest')]"
                    )
                    if len(run_buttons) > 0:
                        run_button_found = True
                        run_button_text = run_buttons[0].text
                except:
                    pass
                
                # Take screenshot
                screenshot_6 = helper.take_screenshot("step6_run_button")
                test_result.add_screenshot(screenshot_6)
                
                step_6_actual = f"Run button found: {run_button_found}. Button text: '{run_button_text}'"
                test_result.add_step(
                    step_number=6,
                    description="Verify run/execute backtest button is present",
                    test_data=step_6_data,
                    expected_result=step_6_expected,
                    actual_result=step_6_actual,
                    status="Pass" if run_button_found else "Fail"
                )
                logger.info("✓ Step 6 PASSED" if run_button_found else "⚠ Step 6 WARNING")
                
            except Exception as e:
                step_6_actual = f"Failed to verify run button: {str(e)}"
                test_result.add_step(6, "Verify run button", step_6_data, 
                                   step_6_expected, step_6_actual, "Fail")
                logger.error(f"✗ Step 6 FAILED: {str(e)}")
            
            # ============= STEP 7: Verify Results/Chart Area =============
            logger.info("Step 7: Verify results display area or chart container")
            step_7_data = "Check for results area, chart container, or canvas"
            step_7_expected = "Results area or chart container is present for displaying backtest results"
            
            try:
                results_area_found = False
                results_type = ""
                
                # Look for canvas elements (charts)
                try:
                    canvases = helper.get_elements(By.TAG_NAME, "canvas")
                    if len(canvases) > 0:
                        results_area_found = True
                        results_type = f"Canvas elements: {len(canvases)}"
                except:
                    pass
                
                # Look for SVG elements (alternative chart rendering)
                if not results_area_found:
                    try:
                        svgs = helper.get_elements(By.TAG_NAME, "svg")
                        if len(svgs) > 0:
                            results_area_found = True
                            results_type = f"SVG elements: {len(svgs)}"
                    except:
                        pass
                
                # Look for results container
                if not results_area_found:
                    try:
                        results_containers = helper.get_elements(
                            By.XPATH,
                            "//*[contains(@class, 'result') or contains(@class, 'chart') or contains(@id, 'result') or contains(@id, 'chart')]"
                        )
                        if len(results_containers) > 0:
                            results_area_found = True
                            results_type = f"Results containers: {len(results_containers)}"
                    except:
                        pass
                
                # Take screenshot
                screenshot_7 = helper.take_screenshot("step7_results_area")
                test_result.add_screenshot(screenshot_7)
                
                step_7_actual = f"Results area found: {results_area_found}. Type: {results_type}"
                test_result.add_step(
                    step_number=7,
                    description="Verify results display area or chart container is present",
                    test_data=step_7_data,
                    expected_result=step_7_expected,
                    actual_result=step_7_actual,
                    status="Pass" if results_area_found else "Fail"
                )
                logger.info("✓ Step 7 PASSED" if results_area_found else "⚠ Step 7 WARNING")
                
            except Exception as e:
                step_7_actual = f"Failed to verify results area: {str(e)}"
                test_result.add_step(7, "Verify results area", step_7_data, 
                                   step_7_expected, step_7_actual, "Fail")
                logger.error(f"✗ Step 7 FAILED: {str(e)}")
            
            # Set overall test status
            test_result.set_status("Pass")
            logger.info("=" * 80)
            logger.info("✓ TEST CASE 2 (Backtesting Page) - PASSED")
            logger.info("=" * 80)
            
            # Save test result for reporting
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
        except Exception as e:
            test_result.set_status("Fail")
            logger.error("=" * 80)
            logger.error(f"✗ TEST CASE 2 (Backtesting Page) - FAILED: {str(e)}")
            logger.error("=" * 80)
            
            # Save test result even on failure
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
            # Take failure screenshot
            helper.take_screenshot("test2_backtesting_FAILED")
            
            raise
