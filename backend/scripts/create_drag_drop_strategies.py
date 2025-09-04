import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

SAMPLE_STRATEGY = {
	"name": "Sample RSI Strategy",
	"description": "Bootstrap strategy created to initialize drag_drop_strategies collection",
	"timeframe": "1h",
	"conditions": [
		{
			"id": "condition-boot",
			"logic": "AND",
			"parameters": [
				{
					"id": "rsi",
					"type": "indicator",
					"name": "RSI",
					"category": "Momentum",
					"description": "Relative Strength Index",
					"config": {"period": 14, "overbought": 70, "oversold": 30}
				},
				{
					"id": "less_than",
					"type": "condition",
					"name": "Less Than",
					"category": "Comparison",
					"description": "Value is less than threshold",
					"config": {"threshold": 30}
				},
				{
					"id": "buy",
					"type": "action",
					"name": "Buy",
					"category": "Entry",
					"description": "Open long position",
					"config": {}
				}
			]
		}
	],
	"riskManagement": {
		"stopLoss": 5,
		"takeProfit": 10,
		"positionSize": 10,
		"maxPositions": 5,
		"riskPerTrade": 2
	},
	"userId": "bootstrap",
}

async def create_collection_with_sample():
	mongodb_uri = os.getenv("MONGODB_URI")
	database_name = os.getenv("DATABASE_NAME", "strategy_forge")
	
	if not mongodb_uri:
		print("❌ MONGODB_URI environment variable is not set. Create a .env file in Backend with MONGODB_URI=<your-uri> and optional DATABASE_NAME.")
		return
	
	client = AsyncIOMotorClient(mongodb_uri)
	db = client[database_name]
	collection = db["drag_drop_strategies"]
	
	# Add timestamps
	now = datetime.utcnow().isoformat()
	doc = {**SAMPLE_STRATEGY, "createdAt": now, "updatedAt": now}
	
	result = await collection.insert_one(doc)
	print(f"✅ Inserted sample drag-drop strategy. _id={result.inserted_id}")
	
	count = await collection.count_documents({})
	print(f"📦 Collection 'drag_drop_strategies' document count: {count}")
	
	# Show collection names
	collections = await db.list_collection_names()
	print("🗂️  Collections:", ", ".join(collections))
	
	client.close()

if __name__ == "__main__":
	asyncio.run(create_collection_with_sample())