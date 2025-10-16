"""Check strategy document structure"""
import asyncio
from db.mongo import MongoDB
from bson import ObjectId

async def check_strategy():
    await MongoDB.connect_to_mongo()
    
    strategy_id = "6894e28401bcbe8fd845d73f"
    
    # Check in drag_drop_strategies
    drag_drop = MongoDB.get_collection('drag_drop_strategies')
    doc = await drag_drop.find_one({'_id': ObjectId(strategy_id)})
    
    if doc:
        print("✅ Found in drag_drop_strategies collection")
        print(f"📋 Fields: {list(doc.keys())}")
        print(f"\n🔍 Ownership fields:")
        print(f"   user_id: {doc.get('user_id')}")
        print(f"   userId: {doc.get('userId')}")
        print(f"   ownerId: {doc.get('ownerId')}")
        print(f"\n🌐 Public fields:")
        print(f"   is_public: {doc.get('is_public')}")
        print(f"   isPublic: {doc.get('isPublic')}")
        print(f"   visibility: {doc.get('visibility')}")
        print(f"\n📄 Full document:")
        for key, value in doc.items():
            if key != '_id':
                print(f"   {key}: {value}")
    else:
        # Try strategies collection
        strategies = MongoDB.get_collection('strategies')
        doc = await strategies.find_one({'_id': ObjectId(strategy_id)})
        
        if doc:
            print("✅ Found in strategies collection")
            print(f"📋 Fields: {list(doc.keys())}")
            print(f"\n🔍 Ownership fields:")
            print(f"   user_id: {doc.get('user_id')}")
            print(f"   userId: {doc.get('userId')}")
            print(f"   ownerId: {doc.get('ownerId')}")
            print(f"\n🌐 Public fields:")
            print(f"   is_public: {doc.get('is_public')}")
            print(f"   isPublic: {doc.get('isPublic')}")
            print(f"   visibility: {doc.get('visibility')}")
            print(f"\n📄 Full document:")
            for key, value in doc.items():
                if key != '_id':
                    print(f"   {key}: {value}")
        else:
            print(f"❌ Strategy {strategy_id} not found in either collection")
    
    await MongoDB.close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_strategy())
