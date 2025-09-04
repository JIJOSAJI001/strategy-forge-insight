# Drag & Drop Strategy Builder

A modern, visual strategy builder that allows users to create trading strategies using drag-and-drop functionality.

## Features

### 🎯 Visual Strategy Building
- **Drag & Drop Interface**: Intuitive drag-and-drop functionality for building strategies
- **Parameter Library**: Organized collection of indicators, conditions, and actions
- **Real-time Preview**: Live preview of strategy logic and risk management settings

### 📊 Parameter Categories
- **Indicators**: RSI, SMA, EMA, MACD, Bollinger Bands
- **Conditions**: Greater Than, Less Than, Crosses Above, Crosses Below
- **Actions**: Buy, Sell, Stop Loss, Take Profit

### 🔧 Strategy Components
- **Conditions**: Multiple conditions with AND/OR logic
- **Risk Management**: Stop loss, take profit, position sizing
- **Timeframe Selection**: 1m, 5m, 15m, 1h, 4h, 1d

### 📤 Export Options
- **Pine Script Generation**: Automatic Pine Script code generation
- **Copy to Clipboard**: One-click copy functionality
- **Download**: Direct download as .pine file

## Usage

### Building a Strategy

1. **Add Conditions**: Click "Add Condition" to create new strategy conditions
2. **Drag Parameters**: Drag indicators, conditions, and actions from the library to condition zones
3. **Configure Logic**: Set AND/OR logic between parameters within conditions
4. **Set Risk Management**: Configure stop loss, take profit, and position sizing
5. **Preview**: View real-time strategy preview and complexity analysis

### Parameter Library

The parameter library is organized into categories:

- **All**: View all available parameters
- **Indicators**: Technical indicators (RSI, SMA, EMA, etc.)
- **Conditions**: Comparison and crossover conditions

### Strategy Validation

The builder includes automatic validation:
- Strategy completeness check
- Parameter compatibility validation
- Risk management validation
- Complexity analysis

## Technical Implementation

### Frontend Technologies
- **React 18** with TypeScript
- **@dnd-kit/core** for drag-and-drop functionality
- **@dnd-kit/sortable** for parameter reordering
- **Shadcn/ui** for modern UI components
- **Tailwind CSS** for styling

### Key Components

1. **DragDropStrategyBuilder**: Main page component
2. **ParameterLibrary**: Parameter selection and organization
3. **DraggableParameter**: Individual draggable parameter cards
4. **DroppableZone**: Drop zones for strategy conditions
5. **SortableParameter**: Reorderable parameters within conditions
6. **StrategyPreview**: Real-time strategy preview

### State Management
- React useState for local state management
- Strategy object structure with conditions and risk management
- Real-time updates and validation

### API Integration
- Strategy service for backend communication
- Pine Script generation endpoint
- Strategy validation and saving

## File Structure

```
src/
├── pages/
│   └── DragDropStrategyBuilder.tsx
├── components/
│   └── strategy/
│       ├── DraggableParameter.tsx
│       ├── DroppableZone.tsx
│       ├── SortableParameter.tsx
│       ├── ParameterLibrary.tsx
│       └── StrategyPreview.tsx
└── services/
    └── strategy.service.ts
```

## Getting Started

1. Navigate to `/drag-drop-strategy-builder` in the application
2. Start by adding a condition using the "Add Condition" button
3. Drag parameters from the library to build your strategy
4. Configure risk management settings
5. Use the preview panel to validate your strategy
6. Generate and export Pine Script code

## Future Enhancements

- **Advanced Indicators**: More technical indicators and oscillators
- **Custom Parameters**: User-defined parameters and conditions
- **Strategy Templates**: Pre-built strategy templates
- **Backtesting Integration**: Direct backtesting from the builder
- **Collaboration**: Share and collaborate on strategies
- **Version Control**: Strategy versioning and history

## Contributing

When adding new parameters or features:

1. Update the `PARAMETER_LIBRARY` array in `DragDropStrategyBuilder.tsx`
2. Add appropriate icons and colors in component files
3. Update Pine Script generation logic if needed
4. Test drag-and-drop functionality thoroughly
5. Update documentation and types 