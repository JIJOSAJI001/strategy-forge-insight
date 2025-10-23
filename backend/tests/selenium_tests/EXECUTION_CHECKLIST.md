# ✅ TEST EXECUTION CHECKLIST

## Pre-Execution Checklist

### 1. Environment Setup
- [ ] Python 3.8+ is installed
- [ ] Google Chrome browser is installed
- [ ] pip is available and working

### 2. Application Status
- [ ] Backend is running on `http://localhost:8000`
- [ ] Frontend is running on `http://localhost:5173`
- [ ] Both services are responding to requests
- [ ] Database (MongoDB/Firebase) is accessible

### 3. Test User Account
- [ ] Test account exists: `jijosaji003@gmail.com`
- [ ] Password is correct: `Jijo@2003`
- [ ] Account is verified (email verification if required)
- [ ] Account has necessary permissions

### 4. Dependencies Installation
```powershell
# Navigate to test directory
cd Backend\tests\selenium_tests

# Install required packages
pip install -r requirements_selenium.txt
```

- [ ] selenium (4.15.2) installed
- [ ] webdriver-manager (4.0.1) installed
- [ ] pytest (7.4.3) installed
- [ ] pytest-html (4.1.1) installed
- [ ] No installation errors

---

## Execution Methods

### Method 1: Quick Start (Recommended)
```powershell
cd Backend\tests\selenium_tests
.\quick_start.ps1
```

### Method 2: Python Runner
```powershell
cd Backend\tests\selenium_tests
python run_tests.py
```

### Method 3: PyTest Direct
```powershell
cd Backend\tests\selenium_tests
pytest -v
```

### Method 4: Individual Tests
```powershell
pytest test_1_login.py -v
pytest test_2_backtesting.py -v
pytest test_3_strategy_builder.py -v
pytest test_4_strategy_library.py -v
```

---

## During Execution

### What You'll See
- [ ] WebDriver initialization message
- [ ] Test execution progress (1/4, 2/4, 3/4, 4/4)
- [ ] Step-by-step logging in console
- [ ] Pass/Fail indicators (✓/✗)
- [ ] Screenshot capture notifications
- [ ] Report generation messages

### Expected Behavior
- [ ] Chrome browser opens (or runs headless)
- [ ] Each test navigates through the application
- [ ] Screenshots are taken automatically
- [ ] Tests complete within ~5-10 minutes total

### Warning Signs (Stop if you see)
- ❌ "Connection refused" errors → Check if application is running
- ❌ "Element not found" repeatedly → Check if frontend UI changed
- ❌ "Timeout" on every page → Check network/application performance
- ❌ Login failures → Verify credentials

---

## Post-Execution Checklist

### 1. Verify Test Completion
- [ ] All 4 test cases executed
- [ ] No critical errors in console output
- [ ] Test summary displayed

### 2. Check Generated Reports
```
Backend/tests/selenium_tests/
├── reports/
│   ├── test_case_report_YYYYMMDD_HHMMSS.html ✓
│   └── pytest_report_YYYYMMDD_HHMMSS.html    ✓
├── screenshots/
│   ├── step1_*.png                           ✓
│   ├── step2_*.png                           ✓
│   └── ... (28+ screenshots)                 ✓
└── logs/
    └── test_execution_YYYYMMDD_HHMMSS.log    ✓
```

### 3. Review Main Test Report
Open: `reports/test_case_report_YYYYMMDD_HHMMSS.html`

- [ ] Report opens in browser
- [ ] Shows 4 test cases
- [ ] Each test has 7 steps
- [ ] Expected vs Actual results shown
- [ ] Pass/Fail status displayed
- [ ] Screenshots embedded

### 4. Verify Test Results

#### Test Case 1: Login
- [ ] Step 1: Landing page loads
- [ ] Step 2: Login modal opens
- [ ] Step 3: Email entered
- [ ] Step 4: Password entered
- [ ] Step 5: Form submitted
- [ ] Step 6: Redirected to dashboard
- [ ] Step 7: Dashboard elements verified

#### Test Case 2: Backtesting Page
- [ ] Step 1: Page loads
- [ ] Step 2: Page heading visible
- [ ] Step 3: Strategy input found
- [ ] Step 4: Symbol input found
- [ ] Step 5: Date inputs found
- [ ] Step 6: Run button found
- [ ] Step 7: Results area found

#### Test Case 3: Strategy Builder
- [ ] Step 1: Builder page loads
- [ ] Step 2: Page heading visible
- [ ] Step 3: Component library found
- [ ] Step 4: Workspace found
- [ ] Step 5: Drag-drop tested
- [ ] Step 6: Name input found
- [ ] Step 7: Save button found

#### Test Case 4: Strategy Library
- [ ] Step 1: Library page loads
- [ ] Step 2: Page heading visible
- [ ] Step 3: Strategy cards displayed
- [ ] Step 4: Search input found
- [ ] Step 5: Search functionality tested
- [ ] Step 6: Filter options found
- [ ] Step 7: Card details verified

### 5. Check Screenshots
- [ ] Open `screenshots/` directory
- [ ] Verify screenshots exist for each step
- [ ] Screenshots show correct pages
- [ ] Failure screenshots (if any) are helpful

### 6. Review Logs
- [ ] Open `logs/test_execution_*.log`
- [ ] Check for any ERROR messages
- [ ] Verify all steps logged
- [ ] Timestamps are correct

---

## Success Criteria

✅ **All 4 test cases: PASS**
✅ **All 28 steps: PASS**
✅ **HTML report generated**
✅ **Screenshots captured**
✅ **No critical errors**

---

## Troubleshooting Checklist

### If Tests Fail

#### Login Test Fails
- [ ] Check if landing page is accessible
- [ ] Verify login credentials
- [ ] Check Firebase authentication
- [ ] Review login modal selector
- [ ] Check network tab for API errors

#### Backtesting Page Fails
- [ ] Verify page URL is correct
- [ ] Check if page elements loaded
- [ ] Review console for JS errors
- [ ] Increase timeouts if slow

#### Strategy Builder Fails
- [ ] Check if builder page accessible
- [ ] Verify drag-drop library loaded
- [ ] Review workspace rendering
- [ ] Check for React errors

#### Strategy Library Fails
- [ ] Verify strategies API works
- [ ] Check if cards render
- [ ] Test search manually
- [ ] Review filter functionality

### Common Issues

| Issue | Check | Solution |
|-------|-------|----------|
| ChromeDriver error | Internet connection | Auto-downloads on first run |
| Element not found | Page load time | Increase DEFAULT_TIMEOUT |
| Login timeout | Backend status | Ensure API responding |
| Page not loading | URLs in config | Verify BASE_URL setting |

---

## Reporting Issues

If tests fail, collect:
1. [ ] Screenshot from failure point
2. [ ] Log file content
3. [ ] Console output
4. [ ] Browser console errors
5. [ ] Network tab activity

---

## Next Steps After Success

1. [ ] Review HTML reports
2. [ ] Archive screenshots
3. [ ] Share results with team
4. [ ] Schedule regular runs
5. [ ] Integrate into CI/CD

---

## CI/CD Integration Checklist

For automated runs:
- [ ] Set `TEST_HEADLESS=true`
- [ ] Configure environment variables
- [ ] Add to pipeline script
- [ ] Set up artifact storage
- [ ] Configure notifications

Example CI command:
```bash
TEST_HEADLESS=true python run_tests.py
```

---

## Maintenance Checklist

### Weekly
- [ ] Run full test suite
- [ ] Check for deprecated selectors
- [ ] Update screenshots baseline

### Monthly
- [ ] Review and update timeouts
- [ ] Check dependency versions
- [ ] Update documentation

### When UI Changes
- [ ] Update selectors in config.py
- [ ] Re-run affected tests
- [ ] Update screenshots
- [ ] Update expected results

---

## Sign-off

- [ ] All tests executed successfully
- [ ] Reports reviewed and approved
- [ ] Issues documented (if any)
- [ ] Results archived

**Executed By**: _______________
**Date**: _______________
**Status**: [ ] Pass [ ] Fail
**Notes**: _______________

---

✅ **Checklist Complete - Ready for Production!**
