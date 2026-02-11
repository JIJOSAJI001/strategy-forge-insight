Requirement Gathering 
Project Title: GrowMore – AI-Enhanced Trading Strategy Insight and Management Platform 
1. Project Overview: 
GrowMore is a FastAPI + React-based strategy management platform designed to help 
traders create, analyze, and share algorithmic trading strategies efficiently. The platform 
allows users to build personalized strategy libraries, run backtests, visualize performance, 
and explore top-rated strategies from the community. GrowMore integrates MongoDB Atlas 
for cloud-based storage and focuses on educational value, transparency, and community
driven insights rather than commercial brokerage execution. With a scalable backend, real
time data handling, and potential AI integrations in the pipeline, GrowMore simplifies the 
learning curve for new traders while offering in-depth control for experienced users. 
2. System Scope: 
GrowMore is an academic-level project with real-world potential. The platform is designed 
to: - Store and manage trading strategies securely - Backtest strategies using user-inputted historical data - Offer visual performance analytics for strategies - Enable users to browse, rate, and discuss strategies - Prepare groundwork for future AI modules (e.g., sentiment-based scoring, pattern 
detection) - Promote a knowledge-sharing community in algorithmic trading 
3. Target Audience: - Primary Users: Independent traders, students, financial analysts, strategy enthusiasts - Secondary Stakeholders: Educators, academic reviewers, data providers - End Beneficiaries: Trading communities, financial learners, fintech researchers 
4. Modules: - User Management: Auth system via Firebase/Auth0 (optional); profile storage and 
authentication
- Strategy Library: Save/view personal & public strategies
- Backtesting Engine: Run mock backtests using historical parameters; visualize results
- Paper Trading Simulator: Interactive historical replay with manual and automated trading capabilities
- Strategy Builder: UI to build strategies using logic blocks or code editor
- Analytics Dashboard: Chart KPIs like Sharpe ratio, drawdown, win rate
- Explore Page: Sort/filter by top-rated strategies, tags, difficulty
- Future AI Module (optional): Auto-tagging, strategy scoring, AI commentary
- API Layer: FastAPI backend exposing endpoints for strategies, users, backtests 
5. User Roles: 
Admin: Platform management, user moderation 
Retail Traders: Primary users who build, test, and manage trading strategies.. 
6. System Ownership: 
GrowMore is developed and maintained as a capstone academic project. Ownership lies 
with the development team. Contributions and feature additions can be modular and 
version-controlled via GitHub. 
7. Industry/Domain: - Sector: Financial Technology (FinTech), Algo-Trading Education - Domain: Trading Strategy Management, Quantitative Research - Applicable Models: Trading platforms, EdTech analytics tools, financial simulators 
8. Data Collection Contacts: -  Kiran Kuruvilla: 7306075537 

9. Paper Trading & Simulation Specifications:
The platform includes a robust Paper Trading module designed to bridge the gap between backtesting and live trading.
- **Simulation Engine**:
  - Event-driven playback of historical data (Candle-based).
  - State management for Simulation (Running, Paused, Stopped).
  - Variable playback speed control to accelerate or decelerate market replay.
- **Trading Features**:
  - **Manual Execution**: Users can manually place Buy/Sell orders during the simulation to test discretion.
  - **Automated Execution**: Integration with strategy logic for auto-trading during replay.
  - **Order Types**: Support for Market orders (simulated execution at close prices).
- **Dashboard & Visualization**:
  - **Live Charting**: `Recharts`-based dynamic line chart showing price movement and trade markers.
  - **Real-Time Metrics**: Display of Account Balance, Equity, and P&L (Realized & Unrealized).
  - **Position Tracker**: Active list of open positions with live P&L updates.
  - **Trade Log**: Comprehensive history of all simulated transactions.
- **Session Management**: Capability to save simulation sessions and performance metrics for review.

10. Questionnaire Summary: 
1. What challenges do new traders face when exploring strategies? 
Lack of structured strategy libraries and poor visualization of results. 
2. How do users currently backtest strategies? 
Manually or using tools like TradingView, which lack personalized storage. 
3. Is there a need for community strategy sharing? 
Yes, most traders benefit from open access to proven strategy templates. 
4. Would AI insights be valuable? 
Yes, for summarizing results, identifying risk, and generating meta-tags. 
5. What kind of performance metrics matter? 
Sharpe Ratio, Win Rate, Drawdown, and overall backtest P&L. 
6. How important is the educational aspect? 
Crucial. The tool should help users learn how strategies behave over time. 
7. Should traders be able to import Pine Script from external sources? 
Yes, enabling flexibility to test both in-house and third-party strategies. 
8. How valuable is real-time simulation during backtesting? 
Very valuable, as it increases transparency and makes results more intuitive. 
9. Do traders require risk analysis beyond basic metrics? 
Yes, tools like VaR, Sortino Ratio, and stress testing improve trust in results. 
10. How important is cross-platform accessibility (web & mobile)? 
High, since retail traders often switch between devices and need seamless access.
