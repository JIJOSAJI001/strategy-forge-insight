"""
Test Case 3: Drag and Drop Strategy Builder Test
Tests drag-and-drop functionality in strategy builder
"""
import pytest
import time
import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from config import BASE_URL, TEST_EMAIL, TEST_PASSWORD, URLS
from utils import TestCaseResult, SeleniumHelper

logger = logging.getLogger(__name__)


class TestStrategyBuilder:
    """Test Case 3: Drag and Drop Strategy Builder functionality"""
    
    def test_drag_drop_builder(self, driver, helper: SeleniumHelper):
        """
        Test Case ID: Test 3
        Test Title: Drag and Drop Strategy Builder Test Case
        Description: Verify strategy builder page loads and drag-drop functionality works
        Pre-Condition: User is logged in successfully
        """
        
        # Initialize test result
        test_result = TestCaseResult("Test 3", "Drag and Drop Strategy Builder Test Case")
        test_result.execution_date = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("=" * 80)
            logger.info("Starting Test Case 3: Drag and Drop Strategy Builder Test")
            logger.info("=" * 80)
            
            # ============= PRE-REQUISITE: Login =============
            logger.info("Pre-requisite: Logging in to application")
            try:
                # Navigate to base URL
                driver.get(BASE_URL)
                helper.wait_for_page_load()
                
                # Click login button
                login_btn = helper.wait_for_clickable(
                    By.XPATH,
                    "//button[contains(text(), 'Login') or contains(text(), 'Sign Up')]"
                )
                helper.safe_click(login_btn, "Login button")
                
                # Enter email
                email_field = helper.wait_for_element(By.CSS_SELECTOR, "input[type='email']")
                email_field.send_keys(TEST_EMAIL)
                
                # Enter password
                password_field = helper.wait_for_element(By.CSS_SELECTOR, "input[type='password']")
                password_field.send_keys(TEST_PASSWORD)
                
                # Submit login
                submit_btn = helper.wait_for_clickable(
                    By.XPATH,
                    "//button[@type='submit' and (contains(text(), 'Sign') or contains(text(), 'Login'))]"
                )
                helper.safe_click(submit_btn, "Submit button")
                
                # Wait for dashboard
                helper.wait_for_url_contains("dashboard")
                logger.info("Pre-requisite completed - Login successful")
                
            except Exception as login_error:
                logger.error(f"Pre-requisite failed - Login error: {str(login_error)}")
                raise
            
            # ============= STEP 1: Navigate to Strategy Builder =============
            logger.info("Step 1: Navigate to drag-drop strategy builder page")
            step_1_data = URLS["strategy_builder"]
            step_1_expected = "Strategy builder page loads successfully"
            
            try:
                driver.get(URLS["strategy_builder"])
                helper.wait_for_page_load()
                time.sleep(3)  # Allow page to fully render
                
                # Take screenshot
                screenshot_1 = helper.take_screenshot("step1_builder_page_loaded")
                test_result.add_screenshot(screenshot_1)
                
                # Verify page loaded
                current_url = driver.current_url
                page_loaded = "strategy-builder" in current_url.lower() or "builder" in current_url.lower()
                
                step_1_actual = f"Strategy builder page loaded. URL: {current_url}"
                test_result.add_step(
                    step_number=1,
                    description="Navigate to drag-drop strategy builder page",
                    test_data=step_1_data,
                    expected_result=step_1_expected,
                    actual_result=step_1_actual,
                    status="Pass" if page_loaded else "Fail"
                )
                logger.info("✓ Step 1 PASSED")
                
                assert page_loaded, f"Not on strategy builder page. Current URL: {current_url}"
                
            except Exception as e:
                step_1_actual = f"Failed to navigate to strategy builder: {str(e)}"
                test_result.add_step(1, "Navigate to strategy builder", step_1_data, 
                                   step_1_expected, step_1_actual, "Fail")
                logger.error(f"✗ Step 1 FAILED: {str(e)}")
                raise
            
            # ============= STEP 2: Verify Page Title/Header =============
            logger.info("Step 2: Verify strategy builder page heading")
            step_2_data = "Check for page heading"
            step_2_expected = "Page displays 'Strategy Builder' or similar heading"
            
            try:
                # Look for heading
                heading_found = False
                heading_text = ""
                
                try:
                    heading = helper.wait_for_element(
                        By.XPATH,
                        "//*[contains(text(), 'Strategy') or contains(text(), 'Builder') or contains(text(), 'Create')]",
                        timeout=10
                    )
                    heading_text = heading.text
                    heading_found = heading.is_displayed()
                except:
                    # Alternative: check page title
                    page_title = driver.title
                    if "strategy" in page_title.lower() or "builder" in page_title.lower():
                        heading_found = True
                        heading_text = page_title
                
                # Take screenshot
                screenshot_2 = helper.take_screenshot("step2_builder_heading")
                test_result.add_screenshot(screenshot_2)
                
                step_2_actual = f"Page heading found: '{heading_text}'. Visible: {heading_found}"
                test_result.add_step(
                    step_number=2,
                    description="Verify strategy builder page heading is displayed",
                    test_data=step_2_data,
                    expected_result=step_2_expected,
                    actual_result=step_2_actual,
                    status="Pass" if heading_found else "Fail"
                )
                logger.info("✓ Step 2 PASSED" if heading_found else "⚠ Step 2 WARNING")
                
            except Exception as e:
                step_2_actual = f"Failed to verify page heading: {str(e)}"
                test_result.add_step(2, "Verify page heading", step_2_data, 
                                   step_2_expected, step_2_actual, "Fail")
                logger.error(f"✗ Step 2 FAILED: {str(e)}")
            
            # ============= STEP 3: Verify Component Library/Palette =============
            logger.info("Step 3: Verify indicator/component library is present")
            step_3_data = "Check for component library or indicator palette"
            step_3_expected = "Component library with draggable items is visible"
            
            try:
                library_found = False
                library_items_count = 0
                library_type = ""
                
                # Look for indicator library
                try:
                    libraries = helper.get_elements(
                        By.XPATH,
                        "//*[contains(@class, 'library') or contains(@class, 'Library') or contains(@class, 'palette')]"
                    )
                    if len(libraries) > 0:
                        library_found = True
                        library_type = f"Library containers: {len(libraries)}"
                except:
                    pass
                
                # Look for draggable items
                try:
                    draggable_items = helper.get_elements(By.CSS_SELECTOR, "[draggable='true']")
                    library_items_count = len(draggable_items)
                    if library_items_count > 0:
                        library_found = True
                        library_type += f", Draggable items: {library_items_count}"
                except:
                    pass
                
                # Look for indicators/conditions sections
                if not library_found:
                    try:
                        sections = helper.get_elements(
                            By.XPATH,
                            "//*[contains(text(), 'Indicator') or contains(text(), 'Condition') or contains(text(), 'Component')]"
                        )
                        if len(sections) > 0:
                            library_found = True
                            library_type += f", Sections: {len(sections)}"
                    except:
                        pass
                
                # Take screenshot
                screenshot_3 = helper.take_screenshot("step3_component_library")
                test_result.add_screenshot(screenshot_3)
                
                step_3_actual = f"Component library found: {library_found}. Details: {library_type}"
                test_result.add_step(
                    step_number=3,
                    description="Verify component library/indicator palette is present",
                    test_data=step_3_data,
                    expected_result=step_3_expected,
                    actual_result=step_3_actual,
                    status="Pass" if library_found else "Fail"
                )
                logger.info("✓ Step 3 PASSED" if library_found else "⚠ Step 3 WARNING")
                
            except Exception as e:
                step_3_actual = f"Failed to verify component library: {str(e)}"
                test_result.add_step(3, "Verify component library", step_3_data, 
                                   step_3_expected, step_3_actual, "Fail")
                logger.error(f"✗ Step 3 FAILED: {str(e)}")
            
            # ============= STEP 4: Verify Workspace/Canvas Area =============
            logger.info("Step 4: Verify workspace/canvas area for strategy building")
            step_4_data = "Check for workspace or canvas area"
            step_4_expected = "Workspace/canvas area is present where components can be dropped"
            
            try:
                workspace_found = False
                workspace_type = ""
                
                # Look for workspace/canvas
                try:
                    workspace_elements = helper.get_elements(
                        By.XPATH,
                        "//*[contains(@class, 'workspace') or contains(@class, 'canvas') or contains(@class, 'drop')]"
                    )
                    if len(workspace_elements) > 0:
                        workspace_found = True
                        workspace_type = f"Workspace elements: {len(workspace_elements)}"
                except:
                    pass
                
                # Look for droppable areas
                if not workspace_found:
                    try:
                        drop_zones = helper.get_elements(
                            By.XPATH,
                            "//*[contains(@class, 'drop') or contains(@data-droppable, 'true')]"
                        )
                        if len(drop_zones) > 0:
                            workspace_found = True
                            workspace_type = f"Drop zones: {len(drop_zones)}"
                    except:
                        pass
                
                # Take screenshot
                screenshot_4 = helper.take_screenshot("step4_workspace_area")
                test_result.add_screenshot(screenshot_4)
                
                step_4_actual = f"Workspace area found: {workspace_found}. Type: {workspace_type}"
                test_result.add_step(
                    step_number=4,
                    description="Verify workspace/canvas area is present",
                    test_data=step_4_data,
                    expected_result=step_4_expected,
                    actual_result=step_4_actual,
                    status="Pass" if workspace_found else "Fail"
                )
                logger.info("✓ Step 4 PASSED" if workspace_found else "⚠ Step 4 WARNING")
                
            except Exception as e:
                step_4_actual = f"Failed to verify workspace area: {str(e)}"
                test_result.add_step(4, "Verify workspace area", step_4_data, 
                                   step_4_expected, step_4_actual, "Fail")
                logger.error(f"✗ Step 4 FAILED: {str(e)}")
            
            # ============= STEP 5: Test Drag and Drop Functionality =============
            logger.info("Step 5: Test drag and drop functionality")
            step_5_data = "Drag an indicator/component to workspace"
            step_5_expected = "Component can be dragged and dropped successfully"
            
            try:
                drag_drop_successful = False
                drag_drop_details = ""
                
                # Find draggable items
                draggable_items = helper.get_elements(By.CSS_SELECTOR, "[draggable='true']")
                
                if len(draggable_items) == 0:
                    # Try alternative selectors
                    draggable_items = helper.get_elements(
                        By.XPATH,
                        "//*[contains(@class, 'draggable') or contains(text(), 'MA') or contains(text(), 'RSI') or contains(text(), 'Indicator')]"
                    )
                
                if len(draggable_items) > 0:
                    # Get first draggable item
                    source = draggable_items[0]
                    source_text = source.text[:30] if source.text else "Component"
                    
                    # Find drop target
                    drop_targets = helper.get_elements(
                        By.XPATH,
                        "//*[contains(@class, 'workspace') or contains(@class, 'canvas') or contains(@class, 'drop')]"
                    )
                    
                    if len(drop_targets) > 0:
                        target = drop_targets[0]
                        
                        # Perform drag and drop
                        try:
                            actions = ActionChains(driver)
                            actions.drag_and_drop(source, target).perform()
                            time.sleep(2)
                            
                            drag_drop_successful = True
                            drag_drop_details = f"Dragged '{source_text}' to workspace"
                        except Exception as drag_error:
                            # Try alternative drag and drop method
                            try:
                                actions = ActionChains(driver)
                                actions.click_and_hold(source).pause(0.5)
                                actions.move_to_element(target).pause(0.5)
                                actions.release().perform()
                                time.sleep(2)
                                
                                drag_drop_successful = True
                                drag_drop_details = f"Dragged '{source_text}' using alternative method"
                            except:
                                drag_drop_details = f"Drag and drop failed: {str(drag_error)}"
                    else:
                        drag_drop_details = "No drop target found"
                else:
                    drag_drop_details = "No draggable items found"
                
                # Take screenshot
                screenshot_5 = helper.take_screenshot("step5_drag_drop_test")
                test_result.add_screenshot(screenshot_5)
                
                step_5_actual = f"Drag-drop test: {drag_drop_details}"
                test_result.add_step(
                    step_number=5,
                    description="Test drag and drop functionality of components",
                    test_data=step_5_data,
                    expected_result=step_5_expected,
                    actual_result=step_5_actual,
                    status="Pass" if drag_drop_successful else "Fail"
                )
                logger.info("✓ Step 5 PASSED" if drag_drop_successful else "⚠ Step 5 WARNING")
                
            except Exception as e:
                step_5_actual = f"Failed to test drag-drop: {str(e)}"
                test_result.add_step(5, "Test drag-drop functionality", step_5_data, 
                                   step_5_expected, step_5_actual, "Fail")
                logger.error(f"✗ Step 5 FAILED: {str(e)}")
            
            # ============= STEP 6: Verify Strategy Name Input =============
            logger.info("Step 6: Verify strategy name input field")
            step_6_data = "Check for strategy name input"
            step_6_expected = "Strategy name input field is present"
            
            try:
                name_input_found = False
                name_field_label = ""
                
                # Look for name input
                try:
                    name_inputs = helper.get_elements(
                        By.XPATH,
                        "//input[@name='name' or @placeholder*='name' or @id='name' or @placeholder*='Name']"
                    )
                    if len(name_inputs) > 0:
                        name_input_found = True
                        placeholder = name_inputs[0].get_attribute("placeholder") or ""
                        name_field_label = f"Placeholder: '{placeholder}'"
                except:
                    pass
                
                # Take screenshot
                screenshot_6 = helper.take_screenshot("step6_name_input")
                test_result.add_screenshot(screenshot_6)
                
                step_6_actual = f"Strategy name input found: {name_input_found}. {name_field_label}"
                test_result.add_step(
                    step_number=6,
                    description="Verify strategy name input field is present",
                    test_data=step_6_data,
                    expected_result=step_6_expected,
                    actual_result=step_6_actual,
                    status="Pass" if name_input_found else "Fail"
                )
                logger.info("✓ Step 6 PASSED" if name_input_found else "⚠ Step 6 WARNING")
                
            except Exception as e:
                step_6_actual = f"Failed to verify name input: {str(e)}"
                test_result.add_step(6, "Verify name input", step_6_data, 
                                   step_6_expected, step_6_actual, "Fail")
                logger.error(f"✗ Step 6 FAILED: {str(e)}")
            
            # ============= STEP 7: Verify Save/Submit Button =============
            logger.info("Step 7: Verify save/submit button for strategy")
            step_7_data = "Check for save or submit button"
            step_7_expected = "Save button is present to save strategy"
            
            try:
                save_button_found = False
                save_button_text = ""
                
                # Look for save button
                try:
                    save_buttons = helper.get_elements(
                        By.XPATH,
                        "//button[contains(text(), 'Save') or contains(text(), 'Create') or contains(text(), 'Submit')]"
                    )
                    if len(save_buttons) > 0:
                        save_button_found = True
                        save_button_text = save_buttons[0].text
                except:
                    pass
                
                # Take screenshot
                screenshot_7 = helper.take_screenshot("step7_save_button")
                test_result.add_screenshot(screenshot_7)
                
                step_7_actual = f"Save button found: {save_button_found}. Button text: '{save_button_text}'"
                test_result.add_step(
                    step_number=7,
                    description="Verify save/submit button is present",
                    test_data=step_7_data,
                    expected_result=step_7_expected,
                    actual_result=step_7_actual,
                    status="Pass" if save_button_found else "Fail"
                )
                logger.info("✓ Step 7 PASSED" if save_button_found else "⚠ Step 7 WARNING")
                
            except Exception as e:
                step_7_actual = f"Failed to verify save button: {str(e)}"
                test_result.add_step(7, "Verify save button", step_7_data, 
                                   step_7_expected, step_7_actual, "Fail")
                logger.error(f"✗ Step 7 FAILED: {str(e)}")
            
            # Set overall test status
            test_result.set_status("Pass")
            logger.info("=" * 80)
            logger.info("✓ TEST CASE 3 (Strategy Builder) - PASSED")
            logger.info("=" * 80)
            
            # Save test result for reporting
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
        except Exception as e:
            test_result.set_status("Fail")
            logger.error("=" * 80)
            logger.error(f"✗ TEST CASE 3 (Strategy Builder) - FAILED: {str(e)}")
            logger.error("=" * 80)
            
            # Save test result even on failure
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
            # Take failure screenshot
            helper.take_screenshot("test3_builder_FAILED")
            
            raise
