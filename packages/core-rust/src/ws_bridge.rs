use tokio::net::TcpListener;
use tokio_tungstenite::accept_async;
use futures_util::{StreamExt, SinkExt};
use std::sync::Arc;
use meshclaw_core::sync::MemorySync;
use tokio_tungstenite::tungstenite::protocol::Message;

pub async fn run_ws_server(
    memory: Arc<MemorySync>, 
    gateway_to_rust_tx: tokio::sync::mpsc::Sender<meshclaw_core::sync::SyncMessage>,
    rust_to_gateway_tx: tokio::sync::broadcast::Sender<serde_json::Value>,
    peers: Arc<tokio::sync::RwLock<std::collections::HashSet<String>>>,
) {
    let port = std::env::var("MESHCLAW_BRIDGE_PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind WS server");
    println!("WebSocket bridge listening on ws://{}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        let memory = memory.clone();
        let gateway_to_rust_tx = gateway_to_rust_tx.clone();
        let mut rust_to_gateway_rx = rust_to_gateway_tx.subscribe();
        let peers = peers.clone();
        
        tokio::spawn(async move {
            let mut ws_stream = accept_async(stream).await.expect("Error during ws handshake");
            println!("New WebSocket connection");

            loop {
                tokio::select! {
                    msg = ws_stream.next() => {
                        let msg = match msg {
                            Some(Ok(m)) => m,
                            _ => break,
                        };
                        
                        if msg.is_text() {
                            let text = msg.to_text().unwrap();
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(text) {
                                let id = json.get("id").and_then(|v| v.as_str()).map(|s| s.to_string());
                                let method = json.get("method").and_then(|v| v.as_str());
                                
                                match method {
                                    Some("query") => {
                                        let key = json.get("params").and_then(|p| p.get("key")).and_then(|k| k.as_str()).unwrap_or("");
                                        let result = memory.get_text(key).unwrap_or_else(|| "null".to_string());
                                        let response = serde_json::json!({ "id": id, "result": result });
                                        let _ = ws_stream.send(Message::Text(response.to_string())).await;
                                    },
                                    Some("peers") => {
                                        let list: Vec<String> = peers.read().await.iter().cloned().collect();
                                        let response = serde_json::json!({ "id": id, "result": list });
                                        let _ = ws_stream.send(Message::Text(response.to_string())).await;
                                    },
                                    Some("keys") | Some("mesh:keys") => {
                                        let list = memory.get_keys();
                                        let response = serde_json::json!({ "id": id, "result": list });
                                        let _ = ws_stream.send(Message::Text(response.to_string())).await;
                                    },
                                    Some("broadcast") => {
                                        if let Some(params) = json.get("params") {
                                            if let Ok(sync_msg) = serde_json::from_value::<meshclaw_core::sync::SyncMessage>(params.clone()) {
                                                let _ = gateway_to_rust_tx.send(sync_msg).await;
                                            }
                                        }
                                        if let Some(id) = id {
                                            let response = serde_json::json!({ "id": id, "result": "ok" });
                                            let _ = ws_stream.send(Message::Text(response.to_string())).await;
                                        }
                                    },
                                    _ => {
                                        if let Ok(sync_msg) = serde_json::from_value::<meshclaw_core::sync::SyncMessage>(json.clone()) {
                                            match &sync_msg {
                                                meshclaw_core::sync::SyncMessage::KnowledgeUpdate { key, value } => {
                                                    memory.insert_text(key, value);
                                                },
                                                meshclaw_core::sync::SyncMessage::MemorySync { delta, .. } => {
                                                    let _ = memory.apply_update(delta.clone());
                                                },
                                                _ => {}
                                            }
                                            let _ = gateway_to_rust_tx.send(sync_msg.clone()).await;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    mesh_msg = rust_to_gateway_rx.recv() => {
                        if let Ok(json) = mesh_msg {
                            let _ = ws_stream.send(Message::Text(json.to_string())).await;
                        }
                    }
                }
            }
        });
    }
}
