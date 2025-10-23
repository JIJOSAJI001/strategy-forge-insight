"""
Configuration file for Selenium tests
Contains URLs, credentials, and test settings
"""
import os
from pathlib import Path

# Base Configuration
BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:5173")
API_URL = os.getenv("TEST_API_URL", "http://localhost:8000")

# Test Credentials
TEST_EMAIL = "jijosaji003@gmail.com"
TEST_PASSWORD = "Jijo@2003"

# Timeouts (in seconds)
DEFAULT_TIMEOUT = 30
ELEMENT_LOAD_TIMEOUT = 20
PAGE_LOAD_TIMEOUT = 45
IMPLICIT_WAIT = 10

# Browser Configuration
BROWSER = os.getenv("TEST_BROWSER", "chrome")
HEADLESS = os.getenv("TEST_HEADLESS", "false").lower() == "true"
WINDOW_SIZE = "1920,1080"

# Test Data Paths
TEST_DIR = Path(__file__).parent
REPORTS_DIR = TEST_DIR / "reports"
SCREENSHOTS_DIR = TEST_DIR / "screenshots"
LOGS_DIR = TEST_DIR / "logs"

# Create directories if they don't exist
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Test Case Details
TEST_PROJECT_NAME = "Strategy Forge Insight"
TEST_DESIGNER = "QA Team"
TEST_PRIORITY = "High"
EXECUTION_DATE = None  # Will be set at runtime

# Page URLs
URLS = {
    "landing": f"{BASE_URL}/",
    "dashboard": f"{BASE_URL}/dashboard",
    "backtesting": f"{BASE_URL}/backtesting",
    "strategy_builder": f"{BASE_URL}/drag-drop-strategy-builder",
    "strategy_library": f"{BASE_URL}/strategies",
    "profile": f"{BASE_URL}/profile"
}

# Element Selectors
SELECTORS = {
    # Login Page
    "login_button": "button:has-text('Login / Sign Up')",
    "email_input": "input[type='email']",
    "password_input": "input[type='password']",
    "login_submit": "button[type='submit']",
    "auth_modal": "[role='dialog']",
    
    # Dashboard
    "dashboard_header": "h1:has-text('Welcome back')",
    "create_strategy_btn": "button:has-text('Create Strategy')",
    "run_backtest_btn": "button:has-text('Run Backtest')",
    "metrics_cards": "[class*='Card']",
    
    # Backtesting Page
    "backtesting_form": "form",
    "strategy_select": "select[name='strategy']",
    "symbol_input": "input[placeholder*='symbol' i]",
    "date_range_picker": "[class*='date']",
    "run_test_button": "button:has-text('Run')",
    "results_chart": "canvas, svg",
    
    # Strategy Builder
    "builder_workspace": "[class*='workspace']",
    "indicator_library": "[class*='library']",
    "condition_library": "[class*='condition']",
    "draggable_items": "[draggable='true']",
    "drop_zone": "[class*='drop']",
    "save_strategy_btn": "button:has-text('Save')",
    "strategy_name_input": "input[name='name']",
    
    # Strategy Library
    "strategy_cards": "[class*='StrategyCard']",
    "search_input": "input[placeholder*='search' i]",
    "filter_buttons": "button[class*='filter']",
    "strategy_title": "h3, h2",
    "view_strategy_btn": "button:has-text('View')"
}
