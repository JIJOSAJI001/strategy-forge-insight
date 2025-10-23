# 🎯 SELENIUM TEST SUITE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STRATEGY FORGE INSIGHT - TEST SUITE                     │
└─────────────────────────────────────────────────────────────────────────────┘

                                  ┌──────────────┐
                                  │  User Runs   │
                                  │    Tests     │
                                  └──────┬───────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
            │ quick_start   │   │  run_tests.py │   │  pytest -v    │
            │     .ps1      │   │               │   │               │
            └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
                    │                   │                    │
                    └───────────────────┼────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │   conftest.py         │
                            │   (Setup WebDriver)   │
                            └───────────┬───────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                │                       │                       │
                ▼                       ▼                       ▼
        ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
        │   Test 1      │      │   Test 2      │      │   Test 3      │
        │   Login       │──→   │  Backtesting  │──→   │   Builder     │
        │   (7 steps)   │      │   (7 steps)   │      │   (7 steps)   │
        └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
                │                      │                       │
                └──────────────────────┼───────────────────────┘
                                       │
                                       ▼
                               ┌───────────────┐
                               │   Test 4      │
                               │   Library     │
                               │   (7 steps)   │
                               └───────┬───────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                ▼                      ▼                      ▼
        ┌───────────────┐      ┌───────────────┐    ┌───────────────┐
        │  Screenshots  │      │  HTML Report  │    │     Logs      │
        │   (28+ PNGs)  │      │   (Tables)    │    │  (Detailed)   │
        └───────────────┘      └───────────────┘    └───────────────┘
```

---

## 📁 File Structure & Relationships

```
selenium_tests/
│
├── 📋 CORE CONFIGURATION
│   ├── config.py ──────────────→ Contains all settings
│   ├── conftest.py ────────────→ PyTest setup & fixtures
│   └── utils.py ───────────────→ Helper functions
│
├── 🧪 TEST CASES (Independent but sequential)
│   ├── test_1_login.py ────────→ Must pass for others to work
│   ├── test_2_backtesting.py ─→ Depends on login
│   ├── test_3_strategy_builder.py → Depends on login
│   └── test_4_strategy_library.py → Depends on login
│
├── ▶️ EXECUTION SCRIPTS
│   ├── run_tests.py ───────────→ Main Python runner
│   └── quick_start.ps1 ────────→ PowerShell automation
│
├── 📚 DOCUMENTATION
│   ├── README.md ──────────────→ Complete guide
│   ├── IMPLEMENTATION_SUMMARY.md → This document
│   ├── EXECUTION_CHECKLIST.md ─→ Step-by-step checklist
│   └── TEST_EXECUTION_GUIDE.md → Detailed guide
│
├── 📦 DEPENDENCIES
│   └── requirements_selenium.txt → All packages
│
└── 📊 OUTPUTS (Generated during test run)
    ├── reports/ ───────────────→ HTML test reports
    ├── screenshots/ ───────────→ Step screenshots
    └── logs/ ──────────────────→ Execution logs
```

---

## 🔄 Test Execution Flow

```
START
  │
  ├─→ Install Dependencies (pip install)
  │
  ├─→ Setup WebDriver
  │    ├─ Download ChromeDriver (auto)
  │    ├─ Configure Chrome options
  │    └─ Set timeouts
  │
  ├─→ TEST CASE 1: Login
  │    ├─ Step 1: Navigate to landing page ──→ Screenshot 1
  │    ├─ Step 2: Click login button ────────→ Screenshot 2
  │    ├─ Step 3: Enter email ───────────────→ Screenshot 3
  │    ├─ Step 4: Enter password ────────────→ Screenshot 4
  │    ├─ Step 5: Submit form ───────────────→ Screenshot 5
  │    ├─ Step 6: Verify redirect ───────────→ Screenshot 6
  │    └─ Step 7: Verify dashboard ──────────→ Screenshot 7
  │         │
  │         └─→ Store results (Expected vs Actual)
  │
  ├─→ TEST CASE 2: Backtesting
  │    ├─ Step 1-7: Test backtesting page ──→ 7 Screenshots
  │    └─→ Store results
  │
  ├─→ TEST CASE 3: Strategy Builder
  │    ├─ Step 1-7: Test builder & drag-drop →7 Screenshots
  │    └─→ Store results
  │
  ├─→ TEST CASE 4: Strategy Library
  │    ├─ Step 1-7: Test library & search ──→ 7 Screenshots
  │    └─→ Store results
  │
  ├─→ Generate Reports
  │    ├─ Create HTML table report
  │    ├─ Embed screenshots
  │    ├─ Add timestamps
  │    └─ Calculate statistics
  │
  ├─→ Display Summary
  │    ├─ Total: 4 test cases
  │    ├─ Steps: 28 total
  │    ├─ Passed/Failed count
  │    └─ Success rate
  │
END
```

---

## 🔧 Component Interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                     config.py (Configuration)                    │
│  • BASE_URL, API_URL                                            │
│  • TEST_EMAIL, TEST_PASSWORD                                    │
│  • Timeouts, Browser settings                                   │
│  • Element selectors                                            │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──→ Used by all test files
             │
┌────────────▼────────────────────────────────────────────────────┐
│                    utils.py (Helpers)                            │
│  • SeleniumHelper class                                         │
│  • wait_for_element()                                           │
│  • safe_click()                                                 │
│  • take_screenshot()                                            │
│  • generate_html_report()                                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──→ Used by all test files
             │
┌────────────▼────────────────────────────────────────────────────┐
│                conftest.py (PyTest Fixtures)                     │
│  • @pytest.fixture driver                                       │
│  • @pytest.fixture helper                                       │
│  • Session setup/teardown                                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──→ Injected into all tests
             │
┌────────────▼────────────────────────────────────────────────────┐
│              Test Files (test_1, test_2, test_3, test_4)         │
│  Each test:                                                     │
│  1. Receives driver & helper fixtures                           │
│  2. Creates TestCaseResult object                               │
│  3. Executes 7 steps                                            │
│  4. Records Expected vs Actual                                  │
│  5. Takes screenshots                                           │
│  6. Stores results in pytest.test_results                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             └──→ Results collected
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│              run_tests.py (Main Runner)                          │
│  1. Runs pytest with all test files                             │
│  2. Collects results from pytest.test_results                   │
│  3. Calls generate_html_report()                                │
│  4. Displays summary                                            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  └──→ Generates outputs
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   reports/      screenshots/      logs/
```

---

## 📊 Data Flow

```
Input Credentials
    │
    ├─→ config.py
         │
         ├─→ test_1_login.py
              │
              ├─→ Enter into login form
              │
              ├─→ Verify authentication
              │
              └─→ TestCaseResult object
                   │
                   ├─ step 1 result
                   ├─ step 2 result
                   ├─ ...
                   └─ step 7 result
                       │
                       └─→ pytest.test_results list
                            │
                            └─→ generate_html_report()
                                 │
                                 └─→ HTML file with table
```

---

## 🎯 Test Result Object Structure

```python
TestCaseResult {
    test_case_id: "Test 1"
    test_title: "Login Test Case"
    execution_date: "2025-10-22 14:30:45"
    status: "Pass"
    steps: [
        {
            step: 1,
            description: "Navigate to URL",
            test_data: "http://localhost:5173",
            expected_result: "Page loads",
            actual_result: "Page loaded successfully",
            status: "Pass"
        },
        // ... 6 more steps
    ],
    screenshots: [
        "screenshots/step1_20251022_143045.png",
        // ... more screenshots
    ]
}
```

---

## 🌐 Browser Automation Flow

```
┌──────────────┐
│  WebDriver   │
│   Manager    │
└──────┬───────┘
       │
       ├─→ Downloads ChromeDriver (if needed)
       │
       ▼
┌──────────────┐
│   Chrome     │
│   Browser    │
└──────┬───────┘
       │
       ├─→ Navigate to URL
       │
       ├─→ Find elements (By.XPATH, By.CSS_SELECTOR, etc.)
       │
       ├─→ Interact (click, type, drag-drop)
       │
       ├─→ Wait for conditions (visibility, clickability)
       │
       ├─→ Take screenshots
       │
       └─→ Extract data (text, attributes, visibility)
```

---

## 📈 Report Generation Process

```
pytest.test_results (List of TestCaseResult objects)
    │
    ├─→ For each TestCaseResult:
    │    │
    │    ├─→ Create HTML section
    │    │    ├─ Test case header
    │    │    ├─ Test info (ID, title, date)
    │    │    └─ Status summary
    │    │
    │    ├─→ Create HTML table
    │    │    ├─ Table header row
    │    │    └─ For each step:
    │    │        ├─ Step number
    │    │        ├─ Description
    │    │        ├─ Test data
    │    │        ├─ Expected result
    │    │        ├─ Actual result
    │    │        └─ Status (color-coded)
    │    │
    │    └─→ Embed screenshots
    │         └─ <img src="path/to/screenshot.png">
    │
    └─→ Write complete HTML file
         ├─ CSS styling
         ├─ All test case sections
         └─ Summary statistics
```

---

## 🎨 HTML Report Structure

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Professional styling */
        .pass { color: green; }
        .fail { color: red; }
        table { border-collapse: collapse; }
        /* ... more styles */
    </style>
</head>
<body>
    <div class="header">
        Project: Strategy Forge Insight
        Execution Date: 2025-10-22
        Total Test Cases: 4
    </div>
    
    <div class="test-case">
        <h2>Test 1: Login Test Case</h2>
        <table>
            <tr><th>Step</th><th>Test Step</th>...</tr>
            <tr><td>1</td><td>Navigate...</td>...</tr>
            <!-- ... more rows -->
        </table>
        <div>
            <img src="screenshot1.png" />
            <!-- ... more screenshots -->
        </div>
    </div>
    
    <!-- ... more test cases -->
</body>
</html>
```

---

## 🔍 Element Selection Strategy

```
Priority order for finding elements:

1. Exact attribute match
   By.CSS_SELECTOR: input[type='email']
   
2. ID or name attribute
   By.ID: 'email-input'
   By.NAME: 'email'
   
3. Text content
   By.XPATH: "//button[contains(text(), 'Login')]"
   
4. Class name
   By.CLASS_NAME: 'login-button'
   
5. Complex XPath
   By.XPATH: "//div[@role='dialog']//input[@type='email']"
```

---

## ⏱️ Wait Strategy

```
1. Implicit Wait (10s)
   └─→ Applied globally to all element searches
   
2. Explicit Wait (20s default)
   ├─→ wait_for_element()
   ├─→ wait_for_clickable()
   ├─→ wait_for_url_contains()
   └─→ wait_for_text_in_element()
   
3. Page Load Timeout (45s)
   └─→ Applied to page navigation
   
4. Custom delays
   └─→ time.sleep() for animations, modals
```

---

## 🎯 Success Metrics

```
┌─────────────────────────────────────────┐
│  Test Execution Metrics                 │
├─────────────────────────────────────────┤
│  Total Test Cases:  4                   │
│  Total Steps:       28                  │
│  Expected Pass Rate: 100%               │
│  Execution Time:    ~5-10 minutes       │
│  Screenshots:       28+ images          │
│  Reports:           2 HTML files        │
│  Logs:              1 detailed log      │
└─────────────────────────────────────────┘
```

---

✅ **Architecture Complete - Ready for Execution!**
