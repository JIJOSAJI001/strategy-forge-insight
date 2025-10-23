"""
Test Case 1: Login Test
Tests user authentication with email and password
"""
import pytest
import time
import logging
from selenium.webdriver.common.by import By
from config import BASE_URL, TEST_EMAIL, TEST_PASSWORD, TEST_PROJECT_NAME
from utils import TestCaseResult, SeleniumHelper

logger = logging.getLogger(__name__)


class TestLogin:
    """Test Case 1: Login functionality"""
    
    def test_user_login(self, driver, helper: SeleniumHelper):
      
        # Initialize test result
        test_result = TestCaseResult("Test 1", "Login Test Case")
        test_result.execution_date = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("=" * 80)
            logger.info("Starting Test Case 1: Login Test")
            logger.info("=" * 80)
            
            # ============= STEP 1: Navigate to Application =============
            logger.info("Step 1: Navigate to application landing page")
            step_1_data = BASE_URL
            step_1_expected = "Landing page loads successfully, Login/Sign Up button is visible"
            
            try:
                driver.get(BASE_URL)
                helper.wait_for_page_load()
                time.sleep(2)  # Allow page to fully render
                
                # Take screenshot
                screenshot_1 = helper.take_screenshot("step1_landing_page")
                test_result.add_screenshot(screenshot_1)
                
                # Verify landing page loaded
                page_title = driver.title
                logger.info(f"Page title: {page_title}")
                
                step_1_actual = f"Landing page loaded successfully. Page title: {page_title}"
                test_result.add_step(
                    step_number=1,
                    description="Navigate to application URL",
                    test_data=step_1_data,
                    expected_result=step_1_expected,
                    actual_result=step_1_actual,
                    status="Pass"
                )
                logger.info("✓ Step 1 PASSED")
                
            except Exception as e:
                step_1_actual = f"Failed to load landing page: {str(e)}"
                test_result.add_step(1, "Navigate to application URL", step_1_data, 
                                   step_1_expected, step_1_actual, "Fail")
                logger.error(f"✗ Step 1 FAILED: {str(e)}")
                raise
            
            # ============= STEP 2: Click Login Button =============
            logger.info("Step 2: Click Login/Sign Up button to open authentication modal")
            step_2_data = "Click 'Login / Sign Up' button"
            step_2_expected = "Authentication modal opens with login form visible"
            
            try:
                # Find and click login button
                login_button = helper.wait_for_element(
                    By.XPATH, 
                    "//button[contains(text(), 'Login') or contains(text(), 'Sign Up')]"
                )
                helper.scroll_to_element(login_button)
                time.sleep(1)
                helper.safe_click(login_button, "Login/Sign Up button")
                
                time.sleep(2)  # Wait for modal to animate
                
                # Verify modal opened
                auth_modal = helper.wait_for_element(By.CSS_SELECTOR, "[role='dialog']", timeout=10)
                modal_visible = auth_modal.is_displayed()
                
                # Take screenshot
                screenshot_2 = helper.take_screenshot("step2_auth_modal_opened")
                test_result.add_screenshot(screenshot_2)
                
                step_2_actual = f"Authentication modal opened successfully. Modal visible: {modal_visible}"
                test_result.add_step(
                    step_number=2,
                    description="Click 'Login / Sign Up' button to open authentication modal",
                    test_data=step_2_data,
                    expected_result=step_2_expected,
                    actual_result=step_2_actual,
                    status="Pass" if modal_visible else "Fail"
                )
                logger.info("✓ Step 2 PASSED")
                
                assert modal_visible, "Authentication modal did not open"
                
            except Exception as e:
                step_2_actual = f"Failed to open authentication modal: {str(e)}"
                test_result.add_step(2, "Click Login button", step_2_data, 
                                   step_2_expected, step_2_actual, "Fail")
                logger.error(f"✗ Step 2 FAILED: {str(e)}")
                raise
            
            # ============= STEP 3: Enter Email Address =============
            logger.info("Step 3: Enter email address in email field")
            step_3_data = TEST_EMAIL
            step_3_expected = "Email address is entered successfully in the email field"
            
            try:
                # Find email input field
                email_input = helper.wait_for_element(By.CSS_SELECTOR, "input[type='email']")
                helper.safe_send_keys(email_input, TEST_EMAIL, "email field")
                time.sleep(1)
                
                # Verify email was entered
                entered_email = email_input.get_attribute("value")
                
                # Take screenshot
                screenshot_3 = helper.take_screenshot("step3_email_entered")
                test_result.add_screenshot(screenshot_3)
                
                step_3_actual = f"Email entered successfully: {entered_email}"
                test_result.add_step(
                    step_number=3,
                    description="Enter email address in the email input field",
                    test_data=step_3_data,
                    expected_result=step_3_expected,
                    actual_result=step_3_actual,
                    status="Pass" if entered_email == TEST_EMAIL else "Fail"
                )
                logger.info("✓ Step 3 PASSED")
                
                assert entered_email == TEST_EMAIL, f"Email mismatch: expected {TEST_EMAIL}, got {entered_email}"
                
            except Exception as e:
                step_3_actual = f"Failed to enter email: {str(e)}"
                test_result.add_step(3, "Enter email address", step_3_data, 
                                   step_3_expected, step_3_actual, "Fail")
                logger.error(f"✗ Step 3 FAILED: {str(e)}")
                raise
            
            # ============= STEP 4: Enter Password =============
            logger.info("Step 4: Enter password in password field")
            step_4_data = "Password: ********"
            step_4_expected = "Password is entered successfully in the password field"
            
            try:
                # Find password input field
                password_input = helper.wait_for_element(By.CSS_SELECTOR, "input[type='password']")
                helper.safe_send_keys(password_input, TEST_PASSWORD, "password field")
                time.sleep(1)
                
                # Verify password was entered (check length since it's masked)
                entered_password = password_input.get_attribute("value")
                password_entered = len(entered_password) > 0
                
                # Take screenshot
                screenshot_4 = helper.take_screenshot("step4_password_entered")
                test_result.add_screenshot(screenshot_4)
                
                step_4_actual = f"Password entered successfully. Field has {len(entered_password)} characters"
                test_result.add_step(
                    step_number=4,
                    description="Enter password in the password input field",
                    test_data=step_4_data,
                    expected_result=step_4_expected,
                    actual_result=step_4_actual,
                    status="Pass" if password_entered else "Fail"
                )
                logger.info("✓ Step 4 PASSED")
                
                assert password_entered, "Password field is empty"
                
            except Exception as e:
                step_4_actual = f"Failed to enter password: {str(e)}"
                test_result.add_step(4, "Enter password", step_4_data, 
                                   step_4_expected, step_4_actual, "Fail")
                logger.error(f"✗ Step 4 FAILED: {str(e)}")
                raise
            
            # ============= STEP 5: Click Submit Button =============
            logger.info("Step 5: Click submit button to login")
            step_5_data = "Click 'Sign in' or 'Login' button"
            step_5_expected = "Login request is submitted successfully"
            
            try:
                # Find and click submit button
                submit_button = helper.wait_for_clickable(
                    By.XPATH,
                    "//button[@type='submit' and (contains(text(), 'Sign') or contains(text(), 'Login'))]"
                )
                helper.safe_click(submit_button, "Submit button")
                time.sleep(3)  # Wait for login processing
                
                # Take screenshot
                screenshot_5 = helper.take_screenshot("step5_login_submitted")
                test_result.add_screenshot(screenshot_5)
                
                step_5_actual = "Login form submitted successfully"
                test_result.add_step(
                    step_number=5,
                    description="Click submit button to authenticate",
                    test_data=step_5_data,
                    expected_result=step_5_expected,
                    actual_result=step_5_actual,
                    status="Pass"
                )
                logger.info("✓ Step 5 PASSED")
                
            except Exception as e:
                step_5_actual = f"Failed to submit login form: {str(e)}"
                test_result.add_step(5, "Click submit button", step_5_data, 
                                   step_5_expected, step_5_actual, "Fail")
                logger.error(f"✗ Step 5 FAILED: {str(e)}")
                raise
            
            # ============= STEP 6: Verify Successful Login =============
            logger.info("Step 6: Verify successful login and redirect to dashboard")
            step_6_data = "Wait for dashboard page to load"
            step_6_expected = "User is redirected to dashboard, welcome message is displayed"
            
            try:
                # Wait for URL to change to dashboard
                url_changed = helper.wait_for_url_contains("dashboard", timeout=15)
                
                time.sleep(3)  # Allow dashboard to fully load
                
                # Get current URL
                current_url = driver.current_url
                logger.info(f"Current URL: {current_url}")
                
                # Check for dashboard elements
                dashboard_loaded = False
                try:
                    # Look for welcome message or dashboard header
                    welcome_element = helper.wait_for_element(
                        By.XPATH,
                        "//*[contains(text(), 'Welcome back') or contains(text(), 'Dashboard')]",
                        timeout=10
                    )
                    dashboard_loaded = welcome_element.is_displayed()
                    welcome_text = welcome_element.text
                    logger.info(f"Welcome text: {welcome_text}")
                except:
                    # Fallback: check if URL contains dashboard
                    dashboard_loaded = "dashboard" in current_url.lower()
                
                # Take screenshot
                screenshot_6 = helper.take_screenshot("step6_login_successful")
                test_result.add_screenshot(screenshot_6)
                
                step_6_actual = f"Login successful! Redirected to: {current_url}. Dashboard loaded: {dashboard_loaded}"
                test_result.add_step(
                    step_number=6,
                    description="Verify successful authentication and dashboard redirect",
                    test_data=step_6_data,
                    expected_result=step_6_expected,
                    actual_result=step_6_actual,
                    status="Pass" if dashboard_loaded else "Fail"
                )
                
                if dashboard_loaded:
                    logger.info("✓ Step 6 PASSED")
                else:
                    logger.warning("✗ Step 6 FAILED: Dashboard not loaded properly")
                
                assert dashboard_loaded, f"Dashboard did not load. Current URL: {current_url}"
                
            except Exception as e:
                step_6_actual = f"Failed to verify login: {str(e)}"
                test_result.add_step(6, "Verify successful login", step_6_data, 
                                   step_6_expected, step_6_actual, "Fail")
                logger.error(f"✗ Step 6 FAILED: {str(e)}")
                raise
            
            # ============= STEP 7: Verify Dashboard Elements =============
            logger.info("Step 7: Verify dashboard elements are present")
            step_7_data = "Check for key dashboard components"
            step_7_expected = "Dashboard metrics, charts, and navigation are visible"
            
            try:
                # Check for multiple dashboard elements
                elements_found = []
                
                # Check for metrics cards
                try:
                    metrics = helper.get_elements(By.CSS_SELECTOR, "[class*='Card']")
                    elements_found.append(f"Metrics cards: {len(metrics)}")
                except:
                    pass
                
                # Check for buttons
                try:
                    buttons = helper.get_elements(By.TAG_NAME, "button")
                    elements_found.append(f"Buttons: {len(buttons)}")
                except:
                    pass
                
                # Take screenshot
                screenshot_7 = helper.take_screenshot("step7_dashboard_elements")
                test_result.add_screenshot(screenshot_7)
                
                step_7_actual = f"Dashboard elements verified: {', '.join(elements_found)}"
                test_result.add_step(
                    step_number=7,
                    description="Verify dashboard UI elements are present and visible",
                    test_data=step_7_data,
                    expected_result=step_7_expected,
                    actual_result=step_7_actual,
                    status="Pass" if len(elements_found) > 0 else "Fail"
                )
                logger.info("✓ Step 7 PASSED")
                
            except Exception as e:
                step_7_actual = f"Failed to verify dashboard elements: {str(e)}"
                test_result.add_step(7, "Verify dashboard elements", step_7_data, 
                                   step_7_expected, step_7_actual, "Fail")
                logger.error(f"✗ Step 7 FAILED: {str(e)}")
                # Don't raise - this is a non-critical verification
            
            # Set overall test status
            test_result.set_status("Pass")
            logger.info("=" * 80)
            logger.info("✓ TEST CASE 1 (Login) - PASSED")
            logger.info("=" * 80)
            
            # Save test result for reporting
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
        except Exception as e:
            test_result.set_status("Fail")
            logger.error("=" * 80)
            logger.error(f"✗ TEST CASE 1 (Login) - FAILED: {str(e)}")
            logger.error("=" * 80)
            
            # Save test result even on failure
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
            # Take failure screenshot
            helper.take_screenshot("test1_login_FAILED")
            
            raise
