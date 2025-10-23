# Selenium Test Suite for Strategy Forge Insight

## Overview
This test suite provides automated UI testing for the Strategy Forge Insight application using Selenium WebDriver.

## Test Cases

### Test Case 1: Login Test
- **Description**: Verify user can successfully login with valid credentials
- **Pre-condition**: User has valid email and password
- **Steps**: 7 steps covering navigation, authentication, and dashboard verification

### Test Case 2: Backtesting Page Test
- **Description**: Verify backtesting page loads and displays correctly
- **Pre-condition**: User is logged in
- **Steps**: 7 steps covering page navigation and UI component verification

### Test Case 3: Drag and Drop Strategy Builder Test
- **Description**: Verify strategy builder page and drag-drop functionality
- **Pre-condition**: User is logged in
- **Steps**: 7 steps covering builder UI and drag-drop operations

### Test Case 4: Strategy Library Test
- **Description**: Verify strategy library page and search functionality
- **Pre-condition**: User is logged in
- **Steps**: 7 steps covering library UI, search, and filtering

## Setup Instructions

### 1. Install Dependencies

```powershell
# Navigate to test directory
cd Backend\tests\selenium_tests

# Install required packages
pip install -r requirements_selenium.txt
```

### 2. Configure Test Environment

Edit `config.py` to set:
- `BASE_URL`: Frontend URL (default: http://localhost:5173)
- `API_URL`: Backend URL (default: http://localhost:8000)
- Test credentials (already set)
- Browser settings (Chrome by default)

### 3. Prepare Application

Ensure both frontend and backend are running:

```powershell
# Terminal 1: Start Backend
cd Backend
python main.py

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## Running Tests

### Run All Tests

```powershell
# From selenium_tests directory
python run_tests.py
```

### Run Individual Test Cases

```powershell
# Test 1: Login
pytest test_1_login.py -v

# Test 2: Backtesting
pytest test_2_backtesting.py -v

# Test 3: Strategy Builder
pytest test_3_strategy_builder.py -v

# Test 4: Strategy Library
pytest test_4_strategy_library.py -v
```

### Run with Options

```powershell
# Run in headless mode
$env:TEST_HEADLESS="true"; python run_tests.py

# Run with specific browser
$env:TEST_BROWSER="chrome"; python run_tests.py

# Run with custom URL
$env:TEST_BASE_URL="http://localhost:3000"; python run_tests.py
```

## Test Reports

After test execution, find the following outputs:

### 1. Detailed Test Case Report
- **Location**: `reports/test_case_report_YYYYMMDD_HHMMSS.html`
- **Contents**: 
  - Formatted table with all test steps
  - Expected vs Actual results
  - Pass/Fail status for each step
  - Screenshots embedded

### 2. PyTest HTML Report
- **Location**: `reports/pytest_report_YYYYMMDD_HHMMSS.html`
- **Contents**: Standard pytest execution report

### 3. Screenshots
- **Location**: `screenshots/`
- **Contents**: Screenshots for each test step and failures

### 4. Execution Logs
- **Location**: `logs/test_execution_YYYYMMDD_HHMMSS.log`
- **Contents**: Detailed execution logs with timestamps

## Test Case Documentation Format

Each test generates a report matching your required format:

```
| Step | Test Step | Test Data | Expected Result | Actual Result | Status |
|------|-----------|-----------|-----------------|---------------|--------|
| 1    | Navigate  | URL       | Page loads      | Page loaded   | Pass   |
| ...  | ...       | ...       | ...             | ...           | ...    |
```

## Troubleshooting

### ChromeDriver Issues
- Driver is auto-downloaded via webdriver-manager
- If issues persist, manually download ChromeDriver matching your Chrome version

### Element Not Found
- Increase timeouts in `config.py`
- Check if application UI has changed
- Verify selectors in `config.py` SELECTORS dict

### Login Failures
- Verify credentials in `config.py`
- Check if account exists and is verified
- Ensure Firebase authentication is working

### Page Load Timeouts
- Increase `PAGE_LOAD_TIMEOUT` in `config.py`
- Check network connectivity
- Verify backend API is responding

## CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run Selenium Tests
  run: |
    cd Backend/tests/selenium_tests
    pip install -r requirements_selenium.txt
    TEST_HEADLESS=true python run_tests.py
```

## Configuration Options

### Environment Variables
- `TEST_BASE_URL`: Frontend URL
- `TEST_API_URL`: Backend URL
- `TEST_BROWSER`: Browser to use (chrome, firefox, edge)
- `TEST_HEADLESS`: Run in headless mode (true/false)

### Timeouts
- `DEFAULT_TIMEOUT`: General wait timeout (30s)
- `ELEMENT_LOAD_TIMEOUT`: Element wait timeout (20s)
- `PAGE_LOAD_TIMEOUT`: Page load timeout (45s)
- `IMPLICIT_WAIT`: Implicit wait (10s)

## Best Practices

1. **Always run with application running**: Ensure both frontend and backend are operational
2. **Check logs first**: Review execution logs for detailed error information
3. **Review screenshots**: Check screenshots for visual confirmation of issues
4. **Run tests in order**: Test 1 (Login) must pass for others to work
5. **Keep credentials secure**: Don't commit sensitive credentials

## Support

For issues or questions:
1. Check execution logs in `logs/` directory
2. Review screenshots in `screenshots/` directory
3. Verify application is running and accessible
4. Check browser console for JavaScript errors

## Test Results Format

The generated HTML report includes:
- Project Name: Strategy Forge Insight
- Test Case ID and Title
- Test Priority: High
- Test Execution Date
- Detailed step-by-step results table
- Screenshots for each critical step
- Overall Pass/Fail status
- Pre-conditions and Post-conditions

This matches the format specified in your test case template.
