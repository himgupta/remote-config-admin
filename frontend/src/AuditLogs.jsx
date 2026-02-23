import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "audit_logs"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow h-full">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Audit History</h3>
        <p className="text-gray-500">Loading logs...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow h-full overflow-hidden flex flex-col">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Audit History</h3>
      <div className="overflow-y-auto flex-1 pr-2 space-y-4 max-h-[600px]">
        {logs.length === 0 ? (
          <p className="text-gray-500">No changes recorded yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="pb-4 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-900">{log.user}</p>
                <p className="text-xs text-gray-400">
                  {log.timestamp?.toDate().toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                Updated config
              </p>
              {/* Optional: Show diff or summary */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
