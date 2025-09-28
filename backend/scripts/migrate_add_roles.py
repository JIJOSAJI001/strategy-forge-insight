import asyncio
from db.mongo import MongoDB


async def main():
    await MongoDB.connect_to_mongo()
    users = MongoDB.get_collection("users")

    # Set default role to retail where missing or invalid
    await users.update_many({"$or": [{"role": {"$exists": False}}, {"role": {"$nin": ["admin", "retail"]}}]}, {"$set": {"role": "retail"}})
    print("Backfilled missing/invalid roles to 'retail'.")

    await MongoDB.close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())

