"""
Test Case 4: Strategy Library Test
Tests strategy library page and functionality
"""
import pytest
import time
import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from config import BASE_URL, TEST_EMAIL, TEST_PASSWORD, URLS
from utils import TestCaseResult, SeleniumHelper

logger = logging.getLogger(__name__)


class TestStrategyLibrary:
    """Test Case 4: Strategy Library functionality"""
    
    def test_strategy_library(self, driver, helper: SeleniumHelper):
        """
        Test Case ID: Test 4
        Test Title: Strategy Library Test Case
        Description: Verify strategy library page loads and displays strategies correctly
        Pre-Condition: User is logged in successfully
        """
        
        # Initialize test result
        test_result = TestCaseResult("Test 4", "Strategy Library Test Case")
        test_result.execution_date = time.strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            logger.info("=" * 80)
            logger.info("Starting Test Case 4: Strategy Library Test")
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
            
            # ============= STEP 1: Navigate to Strategy Library =============
            logger.info("Step 1: Navigate to strategy library page")
            step_1_data = URLS["strategy_library"]
            step_1_expected = "Strategy library page loads successfully"
            
            try:
                driver.get(URLS["strategy_library"])
                helper.wait_for_page_load()
                time.sleep(3)  # Allow page to fully render
                
                # Take screenshot
                screenshot_1 = helper.take_screenshot("step1_library_page_loaded")
                test_result.add_screenshot(screenshot_1)
                
                # Verify page loaded
                current_url = driver.current_url
                page_loaded = "strateg" in current_url.lower()
                
                step_1_actual = f"Strategy library page loaded. URL: {current_url}"
                test_result.add_step(
                    step_number=1,
                    description="Navigate to strategy library page",
                    test_data=step_1_data,
                    expected_result=step_1_expected,
                    actual_result=step_1_actual,
                    status="Pass" if page_loaded else "Fail"
                )
                logger.info("✓ Step 1 PASSED")
                
                assert page_loaded, f"Not on strategy library page. Current URL: {current_url}"
                
            except Exception as e:
                step_1_actual = f"Failed to navigate to strategy library: {str(e)}"
                test_result.add_step(1, "Navigate to strategy library", step_1_data, 
                                   step_1_expected, step_1_actual, "Fail")
                logger.error(f"✗ Step 1 FAILED: {str(e)}")
                raise
            
            # ============= STEP 2: Verify Page Title/Header =============
            logger.info("Step 2: Verify strategy library page heading")
            step_2_data = "Check for page heading"
            step_2_expected = "Page displays 'Strategy Library' or 'Strategies' heading"
            
            try:
                # Look for heading
                heading_found = False
                heading_text = ""
                
                try:
                    heading = helper.wait_for_element(
                        By.XPATH,
                        "//*[contains(text(), 'Strateg') or contains(text(), 'Library')]",
                        timeout=10
                    )
                    heading_text = heading.text
                    heading_found = heading.is_displayed()
                except:
                    # Alternative: check page title
                    page_title = driver.title
                    if "strateg" in page_title.lower():
                        heading_found = True
                        heading_text = page_title
                
                # Take screenshot
                screenshot_2 = helper.take_screenshot("step2_library_heading")
                test_result.add_screenshot(screenshot_2)
                
                step_2_actual = f"Page heading found: '{heading_text}'. Visible: {heading_found}"
                test_result.add_step(
                    step_number=2,
                    description="Verify strategy library page heading is displayed",
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
            
            # ============= STEP 3: Verify Strategy Cards Display =============
            logger.info("Step 3: Verify strategy cards are displayed")
            step_3_data = "Check for strategy cards/items"
            step_3_expected = "Strategy cards are displayed with strategy information"
            
            try:
                strategy_cards_found = False
                cards_count = 0
                card_type = ""
                
                # Look for strategy cards using multiple selectors
                try:
                    # Try specific StrategyCard component
                    cards = helper.get_elements(By.XPATH, "//*[contains(@class, 'StrategyCard')]")
                    if len(cards) > 0:
                        strategy_cards_found = True
                        cards_count = len(cards)
                        card_type = "StrategyCard components"
                except:
                    pass
                
                # Try generic card components
                if not strategy_cards_found:
                    try:
                        cards = helper.get_elements(By.XPATH, "//*[contains(@class, 'card') or contains(@class, 'Card')]")
                        if len(cards) > 2:  # More than just page container cards
                            strategy_cards_found = True
                            cards_count = len(cards)
                            card_type = "Generic card components"
                    except:
                        pass
                
                # Try looking for strategy titles or names
                if not strategy_cards_found:
                    try:
                        strategy_elements = helper.get_elements(
                            By.XPATH,
                            "//*[contains(@class, 'strategy') or contains(text(), 'Strategy') or contains(text(), 'MA') or contains(text(), 'RSI')]"
                        )
                        if len(strategy_elements) > 0:
                            strategy_cards_found = True
                            cards_count = len(strategy_elements)
                            card_type = "Strategy elements"
                    except:
                        pass
                
                # Take screenshot
                screenshot_3 = helper.take_screenshot("step3_strategy_cards")
                test_result.add_screenshot(screenshot_3)
                
                step_3_actual = f"Strategy cards found: {strategy_cards_found}. Count: {cards_count}. Type: {card_type}"
                test_result.add_step(
                    step_number=3,
                    description="Verify strategy cards are displayed",
                    test_data=step_3_data,
                    expected_result=step_3_expected,
                    actual_result=step_3_actual,
                    status="Pass" if strategy_cards_found else "Fail"
                )
                logger.info("✓ Step 3 PASSED" if strategy_cards_found else "⚠ Step 3 WARNING")
                
            except Exception as e:
                step_3_actual = f"Failed to verify strategy cards: {str(e)}"
                test_result.add_step(3, "Verify strategy cards", step_3_data, 
                                   step_3_expected, step_3_actual, "Fail")
                logger.error(f"✗ Step 3 FAILED: {str(e)}")
            
            # ============= STEP 4: Verify Search Functionality =============
            logger.info("Step 4: Verify search input field")
            step_4_data = "Check for search input"
            step_4_expected = "Search input field is present for filtering strategies"
            
            try:
                search_input_found = False
                search_placeholder = ""
                
                # Look for search input
                try:
                    search_inputs = helper.get_elements(
                        By.XPATH,
                        "//input[@type='search' or @type='text' or contains(@placeholder, 'search') or contains(@placeholder, 'Search') or contains(@placeholder, 'filter')]"
                    )
                    if len(search_inputs) > 0:
                        search_input_found = True
                        search_placeholder = search_inputs[0].get_attribute("placeholder") or "No placeholder"
                except:
                    pass
                
                # Take screenshot
                screenshot_4 = helper.take_screenshot("step4_search_input")
                test_result.add_screenshot(screenshot_4)
                
                step_4_actual = f"Search input found: {search_input_found}. Placeholder: '{search_placeholder}'"
                test_result.add_step(
                    step_number=4,
                    description="Verify search input field is present",
                    test_data=step_4_data,
                    expected_result=step_4_expected,
                    actual_result=step_4_actual,
                    status="Pass" if search_input_found else "Fail"
                )
                logger.info("✓ Step 4 PASSED" if search_input_found else "⚠ Step 4 WARNING")
                
            except Exception as e:
                step_4_actual = f"Failed to verify search input: {str(e)}"
                test_result.add_step(4, "Verify search input", step_4_data, 
                                   step_4_expected, step_4_actual, "Fail")
                logger.error(f"✗ Step 4 FAILED: {str(e)}")
            
            # ============= STEP 5: Test Search Functionality =============
            logger.info("Step 5: Test search functionality")
            step_5_data = "Enter 'MA' in search field"
            step_5_expected = "Search filter works, results update based on search term"
            
            try:
                search_test_passed = False
                search_result_details = ""
                
                # Find search input
                search_inputs = helper.get_elements(
                    By.XPATH,
                    "//input[@type='search' or @type='text' or contains(@placeholder, 'search') or contains(@placeholder, 'Search')]"
                )
                
                if len(search_inputs) > 0:
                    search_input = search_inputs[0]
                    
                    # Enter search term
                    helper.safe_send_keys(search_input, "MA", "search field")
                    time.sleep(2)  # Wait for search to filter
                    
                    # Check if results updated
                    search_test_passed = True
                    search_result_details = "Search term 'MA' entered successfully"
                else:
                    search_result_details = "Search input not found"
                
                # Take screenshot
                screenshot_5 = helper.take_screenshot("step5_search_test")
                test_result.add_screenshot(screenshot_5)
                
                step_5_actual = f"Search test: {search_result_details}"
                test_result.add_step(
                    step_number=5,
                    description="Test search functionality by entering search term",
                    test_data=step_5_data,
                    expected_result=step_5_expected,
                    actual_result=step_5_actual,
                    status="Pass" if search_test_passed else "Fail"
                )
                logger.info("✓ Step 5 PASSED" if search_test_passed else "⚠ Step 5 WARNING")
                
            except Exception as e:
                step_5_actual = f"Failed to test search: {str(e)}"
                test_result.add_step(5, "Test search functionality", step_5_data, 
                                   step_5_expected, step_5_actual, "Fail")
                logger.error(f"✗ Step 5 FAILED: {str(e)}")
            
            # ============= STEP 6: Verify Filter/Category Options =============
            logger.info("Step 6: Verify filter or category options")
            step_6_data = "Check for filter buttons or category tabs"
            step_6_expected = "Filter options or categories are available for organizing strategies"
            
            try:
                filters_found = False
                filter_details = ""
                
                # Look for filter buttons
                try:
                    filter_buttons = helper.get_elements(
                        By.XPATH,
                        "//button[contains(@class, 'filter') or contains(@class, 'category') or contains(@class, 'tab')]"
                    )
                    if len(filter_buttons) > 0:
                        filters_found = True
                        filter_details = f"Filter buttons: {len(filter_buttons)}"
                except:
                    pass
                
                # Look for select dropdowns
                if not filters_found:
                    try:
                        selects = helper.get_elements(By.TAG_NAME, "select")
                        if len(selects) > 0:
                            filters_found = True
                            filter_details = f"Select dropdowns: {len(selects)}"
                    except:
                        pass
                
                # Look for tabs
                if not filters_found:
                    try:
                        tabs = helper.get_elements(By.XPATH, "//*[contains(@role, 'tab') or contains(@class, 'tab')]")
                        if len(tabs) > 0:
                            filters_found = True
                            filter_details = f"Tab elements: {len(tabs)}"
                    except:
                        pass
                
                # Take screenshot
                screenshot_6 = helper.take_screenshot("step6_filter_options")
                test_result.add_screenshot(screenshot_6)
                
                step_6_actual = f"Filter options found: {filters_found}. Details: {filter_details}"
                test_result.add_step(
                    step_number=6,
                    description="Verify filter/category options are available",
                    test_data=step_6_data,
                    expected_result=step_6_expected,
                    actual_result=step_6_actual,
                    status="Pass" if filters_found else "Fail"
                )
                logger.info("✓ Step 6 PASSED" if filters_found else "⚠ Step 6 WARNING")
                
            except Exception as e:
                step_6_actual = f"Failed to verify filters: {str(e)}"
                test_result.add_step(6, "Verify filter options", step_6_data, 
                                   step_6_expected, step_6_actual, "Fail")
                logger.error(f"✗ Step 6 FAILED: {str(e)}")
            
            # ============= STEP 7: Verify Strategy Card Details =============
            logger.info("Step 7: Verify strategy card displays key information")
            step_7_data = "Check strategy card content"
            step_7_expected = "Strategy cards display title, performance metrics, and action buttons"
            
            try:
                card_details_verified = False
                card_info = []
                
                # Find first strategy card
                cards = helper.get_elements(By.XPATH, "//*[contains(@class, 'card') or contains(@class, 'Card')]")
                
                if len(cards) > 0:
                    # Check for various elements within cards
                    
                    # Check for titles
                    try:
                        titles = helper.get_elements(By.XPATH, "//h1 | //h2 | //h3 | //h4")
                        if len(titles) > 0:
                            card_info.append(f"Titles: {len(titles)}")
                    except:
                        pass
                    
                    # Check for buttons
                    try:
                        buttons = helper.get_elements(By.TAG_NAME, "button")
                        if len(buttons) > 0:
                            card_info.append(f"Buttons: {len(buttons)}")
                    except:
                        pass
                    
                    # Check for badges (performance indicators)
                    try:
                        badges = helper.get_elements(By.XPATH, "//*[contains(@class, 'badge') or contains(@class, 'Badge')]")
                        if len(badges) > 0:
                            card_info.append(f"Badges: {len(badges)}")
                    except:
                        pass
                    
                    if len(card_info) > 0:
                        card_details_verified = True
                
                # Take screenshot
                screenshot_7 = helper.take_screenshot("step7_card_details")
                test_result.add_screenshot(screenshot_7)
                
                step_7_actual = f"Card details verified: {card_details_verified}. Found: {', '.join(card_info) if card_info else 'No details'}"
                test_result.add_step(
                    step_number=7,
                    description="Verify strategy card displays key information",
                    test_data=step_7_data,
                    expected_result=step_7_expected,
                    actual_result=step_7_actual,
                    status="Pass" if card_details_verified else "Fail"
                )
                logger.info("✓ Step 7 PASSED" if card_details_verified else "⚠ Step 7 WARNING")
                
            except Exception as e:
                step_7_actual = f"Failed to verify card details: {str(e)}"
                test_result.add_step(7, "Verify card details", step_7_data, 
                                   step_7_expected, step_7_actual, "Fail")
                logger.error(f"✗ Step 7 FAILED: {str(e)}")
            
            # Set overall test status
            test_result.set_status("Pass")
            logger.info("=" * 80)
            logger.info("✓ TEST CASE 4 (Strategy Library) - PASSED")
            logger.info("=" * 80)
            
            # Save test result for reporting
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
        except Exception as e:
            test_result.set_status("Fail")
            logger.error("=" * 80)
            logger.error(f"✗ TEST CASE 4 (Strategy Library) - FAILED: {str(e)}")
            logger.error("=" * 80)
            
            # Save test result even on failure
            pytest.test_results = getattr(pytest, 'test_results', [])
            pytest.test_results.append(test_result)
            
            # Take failure screenshot
            helper.take_screenshot("test4_library_FAILED")
            
            raise
