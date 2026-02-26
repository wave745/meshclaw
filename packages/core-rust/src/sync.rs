use yrs::{Doc, ReadTxn, WriteTxn, Transact, Update, Map, Text, TextRef};
use yrs::updates::decoder::Decode;
use serde::{Serialize, Deserialize};
use sled::Db;
use std::path::Path;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum SyncMessage {
    #[serde(rename = "memory-sync")]
    MemorySync {
        doc_id: String,
        delta: Vec<u8>,
        version: u64,
    },
    #[serde(rename = "discovery")]
    Discovery {
        node_id: String,
        capabilities: Vec<String>,
    },
    #[serde(rename = "broadcast")]
    Broadcast {
        channel: String,
        sender: String,
        content: String,
        timestamp: u64,
        #[serde(skip_serializing_if = "Option::is_none")]
        signature: Option<String>,
    },
    #[serde(rename = "delegate")]
    Delegate {
        #[serde(rename = "taskId")]
        task_id: String,
        #[serde(rename = "taskDesc")]
        task_desc: String,
        #[serde(rename = "requesterId")]
        requester_id: String,
        #[serde(rename = "assigneeId")]
        assignee_id: String,
        payload: serde_json::Value,
        timestamp: u64,
    },
    #[serde(rename = "capability")]
    Capability {
        node_id: String,
        capability: String,
        metadata: serde_json::Value,
    },
    #[serde(rename = "knowledge-update")]
    KnowledgeUpdate {
        key: String,
        value: String,
    },
    Query(String),
}

pub struct MemorySync {
    doc: Doc,
    db: Db,
}

impl MemorySync {
    pub fn new() -> Self {
        let default_path = "./.meshclaw/yrs-state".to_string();
        let path_str = std::env::var("MESHCLAW_STATE_DIR").unwrap_or(default_path);
        let path = Path::new(&path_str);
        std::fs::create_dir_all(path).expect("Failed to create state directory");
        let db = sled::open(path).expect("Failed to open sled database");
        
        let doc = Doc::new();
        if let Ok(Some(bytes)) = db.get("state") {
            let mut txn = doc.transact_mut();
            if let Ok(update) = Update::decode_v1(&bytes) {
                let _ = txn.apply_update(update);
            }
        }
        
        MemorySync { doc, db }
    }

    pub fn save(&self) {
        let txn = self.doc.transact();
        let update = txn.encode_state_as_update_v1(&yrs::StateVector::default());
        let _ = self.db.insert("state", update).expect("Failed to save state");
        let _ = self.db.flush().expect("Failed to flush db");
    }

    pub fn apply_update(&self, update_data: Vec<u8>) -> anyhow::Result<()> {
        let mut txn = self.doc.transact_mut();
        let _ = txn.apply_update(Update::decode_v1(&update_data)?);
        Ok(())
    }

    pub fn get_update(&self) -> Vec<u8> {
        let txn = self.doc.transact();
        txn.encode_state_as_update_v1(&yrs::StateVector::default())
    }

    pub fn get_text(&self, key: &str) -> Option<String> {
        let txn = self.doc.transact();
        let map = txn.get_map("shared")?;
        let val = map.get(&txn, key)?;
        Some(val.to_string(&txn))
    }

    pub fn get_keys(&self) -> Vec<String> {
        let txn = self.doc.transact();
        if let Some(map) = txn.get_map("shared") {
            map.keys(&txn).collect()
        } else {
            Vec::new()
        }
    }

    pub fn insert_text(&self, key: &str, value: &str) {
        let mut txn = self.doc.transact_mut();
        let map = txn.get_or_insert_map("shared");
        let text: TextRef = map.get_or_init(&mut txn, key);
        let len = text.len(&txn);
        if len > 0 {
            text.remove_range(&mut txn, 0, len);
        }
        text.push(&mut txn, value);
    }
}
