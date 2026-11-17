"""
C3S Automatic SOS & Security Operations Center Bridge.
Integrates confirmed violence incidents directly into MongoDB and the UniMap serverless backend.
"""

from typing import Dict, Any, Optional
import time
import requests
import pymongo
from config.settings import settings


class SOSIncidentBridge:
    def __init__(self, backend_url: str = settings.server.backend_api_url, mongodb_uri: str = settings.server.mongodb_uri):
        self.backend_url = backend_url
        self.sos_url = f"{backend_url.rstrip('/')}{settings.server.sos_endpoint}"
        self.mongodb_uri = mongodb_uri
        self._mongo_client = None

    def _get_mongo_collection(self):
        if self._mongo_client is None:
            try:
                self._mongo_client = pymongo.MongoClient(self.mongodb_uri, serverSelectionTimeoutMS=2000)
                db = self._mongo_client["unimap"]
                return db["incidents"]
            except Exception as e:
                print(f"[SOS Bridge] Direct MongoDB connection offline: {e}")
                return None
        return self._mongo_client["unimap"]["incidents"]

    def dispatch_incident(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches confirmed incident to C3S Security Operations Center.
        1. Attempts HTTP POST to UniMap /api/sos endpoint.
        2. Direct persistence into MongoDB 'incidents' collection.
        """
        incident_id = alert_data.get("incident_id", f"C3S-VIO-{int(time.time())}")
        payload = {
            "id": incident_id,
            "type": "VIOLENCE_FIGHT",
            "category": alert_data.get("category", "CONFIRMED_FIGHT"),
            "severity": alert_data.get("severity", "CRITICAL"),
            "location": alert_data.get("location", {"lat": 26.2183, "lng": 78.1828}),
            "cameraId": alert_data.get("camera_id", "cam-08"),
            "building": alert_data.get("building", "Main Gate"),
            "confidence": alert_data.get("confidence", 0.95),
            "status": "OPEN",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "evidenceDetails": {
                "kinetic_breakdown": alert_data.get("kinetic_breakdown", {}),
                "proximity_breakdown": alert_data.get("proximity_breakdown", {})
            }
        }

        # 1. Forward to HTTP API
        dispatched_http = False
        try:
            res = requests.post(self.sos_url, json=payload, timeout=2.0)
            if res.status_code in [200, 201]:
                dispatched_http = True
                print(f"[SOS Bridge] Dispatched incident {incident_id} to {self.sos_url}")
        except Exception as e:
            # Server might not be running in standalone mode
            pass

        # 2. Forward directly to MongoDB if available
        dispatched_db = False
        col = self._get_mongo_collection()
        if col is not None:
            try:
                col.update_one({"id": incident_id}, {"$set": payload}, upsert=True)
                dispatched_db = True
                print(f"[SOS Bridge] Saved incident {incident_id} to MongoDB collection 'incidents'")
            except Exception as e:
                pass

        return {
            "incident_id": incident_id,
            "dispatched_http": dispatched_http,
            "dispatched_db": dispatched_db,
            "payload": payload
        }
