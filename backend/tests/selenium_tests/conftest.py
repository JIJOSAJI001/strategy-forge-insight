"""
PyTest configuration and fixtures for Selenium tests
"""
import pytest
import logging
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
try:
    import chromedriver_binary  # This will add chromedriver to PATH
    use_chromedriver_binary = True
except ImportError:
    from webdriver_manager.chrome import ChromeDriverManager
    use_chromedriver_binary = False
from config import HEADLESS, WINDOW_SIZE, IMPLICIT_WAIT, LOGS_DIR, PAGE_LOAD_TIMEOUT
from utils import SeleniumHelper

# Setup logging
log_file = LOGS_DIR / f"test_execution_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


@pytest.fixture(scope="function")
def driver():
    """Create and configure Chrome WebDriver"""
    logger.info("Initializing Chrome WebDriver...")
    
    chrome_options = Options()
    
    if HEADLESS:
        chrome_options.add_argument("--headless")
        logger.info("Running in headless mode")
    
    # Additional options for stability
    chrome_options.add_argument(f"--window-size={WINDOW_SIZE}")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Suppress logging noise
    chrome_options.add_experimental_option("excludeSwitches", ["enable-logging"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    
    # Initialize driver with proper error handling
    import platform
    import os
    try:
        # Detect system architecture
        is_64bit = platform.machine().endswith('64')
        logger.info(f"Detected {platform.machine()} architecture")
        
        # First, try local 64-bit ChromeDriver
        local_driver = os.path.join(os.path.dirname(__file__), "drivers", "chromedriver-win64", "chromedriver.exe")
        if os.path.exists(local_driver):
            logger.info(f"Using local ChromeDriver: {local_driver}")
            service = Service(local_driver)
            driver = webdriver.Chrome(service=service, options=chrome_options)
        # Use chromedriver-binary if available, otherwise use webdriver-manager
        elif use_chromedriver_binary:
            logger.info("Using chromedriver-binary package")
            driver = webdriver.Chrome(options=chrome_options)
        else:
            logger.info("Using webdriver-manager")
            driver_path = ChromeDriverManager().install()
            service = Service(driver_path)
            driver = webdriver.Chrome(service=service, options=chrome_options)
    except Exception as e:
        logger.error(f"Failed to initialize ChromeDriver: {e}")
        logger.info("Please ensure you have Google Chrome installed")
        raise
    
    # Set timeouts
    driver.implicitly_wait(IMPLICIT_WAIT)
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    
    logger.info("WebDriver initialized successfully")
    
    yield driver
    
    # Teardown
    logger.info("Closing WebDriver...")
    driver.quit()
    logger.info("WebDriver closed")


@pytest.fixture(scope="function")
def helper(driver):
    """Provide SeleniumHelper instance"""
    return SeleniumHelper(driver)


@pytest.fixture(scope="session", autouse=True)
def test_session_setup():
    """Setup before all tests"""
    logger.info("="*80)
    logger.info("Starting Selenium Test Suite - Strategy Forge Insight")
    logger.info(f"Test Session Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("="*80)
    
    yield
    
    logger.info("="*80)
    logger.info("Test Session Completed")
    logger.info("="*80)
