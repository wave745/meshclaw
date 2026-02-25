use libp2p::futures::StreamExt;
use libp2p::identify;
use libp2p::identity;
use libp2p::mdns;
use libp2p::noise;
use libp2p::ping;
use libp2p::kad;
use libp2p::{
    multiaddr::Protocol, 
    PeerId, 
};
use libp2p::gossipsub;
use libp2p::swarm::{NetworkBehaviour, SwarmEvent};
use libp2p::tcp;
use libp2p::yamux;
use std::error::Error;
use std::sync::Arc;
use std::time::Duration;
use tokio;
use meshclaw_core::sync::{MemorySync, SyncMessage};

mod ws_bridge;
mod bluetooth;
mod lora;

use meshclaw_core::vector_db::VectorDb;

#[derive(NetworkBehaviour)]
#[behaviour(out_event = "MeshBehaviourEvent")]
struct MeshBehaviour {
    mdns: mdns::tokio::Behaviour,
    ping: ping::Behaviour,
    identify: identify::Behaviour,
    gossipsub: gossipsub::Behaviour,
    kad: kad::Behaviour<kad::store::MemoryStore>,
}

#[derive(Debug)]
enum MeshBehaviourEvent {
    Mdns(mdns::Event),
    Ping(ping::Event),
    Identify(identify::Event),
    Gossipsub(gossipsub::Event),
    Kad(kad::Event),
}

impl From<mdns::Event> for MeshBehaviourEvent {
    fn from(event: mdns::Event) -> Self {
        MeshBehaviourEvent::Mdns(event)
    }
}

impl From<ping::Event> for MeshBehaviourEvent {
    fn from(event: ping::Event) -> Self {
        MeshBehaviourEvent::Ping(event)
    }
}

impl From<identify::Event> for MeshBehaviourEvent {
    fn from(event: identify::Event) -> Self {
        MeshBehaviourEvent::Identify(event)
    }
}

impl From<gossipsub::Event> for MeshBehaviourEvent {
    fn from(event: gossipsub::Event) -> Self {
        MeshBehaviourEvent::Gossipsub(event)
    }
}

impl From<kad::Event> for MeshBehaviourEvent {
    fn from(event: kad::Event) -> Self {
        MeshBehaviourEvent::Kad(event)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let local_key = identity::Keypair::generate_ed25519();
    let local_peer_id = PeerId::from(local_key.public());
    println!("Local peer id: {local_peer_id}");

    let mut swarm = libp2p::SwarmBuilder::with_existing_identity(local_key.clone())
        .with_tokio()
        .with_tcp(
            tcp::Config::default(),
            noise::Config::new,
            yamux::Config::default,
        )?
        .with_quic()
        .with_behaviour(|key| {
            let local_peer_id = PeerId::from(key.public());
            
            let mdns = mdns::tokio::Behaviour::new(mdns::Config::default(), local_peer_id)
                .map_err(|e| Box::new(e) as Box<dyn Error + Send + Sync>)?;
            let ping = ping::Behaviour::new(ping::Config::new());
            let identify = identify::Behaviour::new(identify::Config::new(
                "/meshclaw/0.1.0".to_string(),
                key.public(),
            ));
            
            let gossip_cfg = gossipsub::ConfigBuilder::default().build()
                .map_err(|e| Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error + Send + Sync>)?;
            let gossipsub = gossipsub::Behaviour::new(
                gossipsub::MessageAuthenticity::Signed(key.clone()),
                gossip_cfg,
            ).map_err(|e| Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn Error + Send + Sync>)?;

            let store = kad::store::MemoryStore::new(local_peer_id);
            let mut kad_cfg = kad::Config::default();
            kad_cfg.set_query_timeout(Duration::from_secs(30));
            let kad = kad::Behaviour::with_config(local_peer_id, store, kad_cfg);

            Ok(MeshBehaviour { mdns, ping, identify, gossipsub, kad })
        })?
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(60)))
        .build();

    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;

    let memory = Arc::new(MemorySync::new());
    memory.insert_text("note1", "Initial shared knowledge");

    let peers = Arc::new(tokio::sync::RwLock::new(std::collections::HashSet::<String>::new()));

    // Initialize stubs
    bluetooth::init();
    lora::init();

    // Start WS bridge
    let (gateway_to_rust_tx, mut gateway_to_rust_rx) = tokio::sync::mpsc::channel::<SyncMessage>(100);
    let (rust_to_gateway_tx, _) = tokio::sync::broadcast::channel::<serde_json::Value>(100);
    
    let mem_clone = memory.clone();
    let peers_clone = peers.clone();
    let bridge_tx = rust_to_gateway_tx.clone();
    tokio::spawn(async move {
        ws_bridge::run_ws_server(mem_clone, gateway_to_rust_tx, bridge_tx, peers_clone).await;
    });

    let vector_db = VectorDb::new().await;
    vector_db.add("note1", vec![0.1; 384], "Initial knowledge").await;

    // Kademlia Bootstrap
    if let Err(e) = swarm.behaviour_mut().kad.bootstrap() {
        eprintln!("Kademlia bootstrap warning: {e}");
    }

    // Advertise capability
    let key = kad::RecordKey::from(b"capability:embedding".to_vec());
    let value = serde_json::to_vec(&serde_json::json!({
        "peer": local_peer_id.to_string(), 
        "dim": 384
    })).unwrap();
    let record = kad::Record { key, value, publisher: Some(local_peer_id), expires: None };
    swarm.behaviour_mut().kad.put_record(record, kad::Quorum::One).unwrap();

    let topic = gossipsub::IdentTopic::new("mesh:broadcast");
    swarm.behaviour_mut().gossipsub.subscribe(&topic)?;

    let mut broadcast_timer = tokio::time::interval(Duration::from_secs(10));

    loop {
        tokio::select! {
            bridge_msg = gateway_to_rust_rx.recv() => {
                if let Some(msg) = bridge_msg {
                    if let Ok(data) = serde_json::to_vec(&msg) {
                        if let Err(e) = swarm.behaviour_mut().gossipsub.publish(topic.clone(), data) {
                            eprintln!("Bridge publish error: {e}");
                        }
                    }
                }
            }
            _ = broadcast_timer.tick() => {
                let msg = SyncMessage::MemorySync {
                    doc_id: "note1".to_string(),
                    delta: memory.get_update(),
                    version: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
                };
                if let Ok(data) = serde_json::to_vec(&msg) {
                    if let Err(e) = swarm.behaviour_mut().gossipsub.publish(topic.clone(), data) {
                        eprintln!("Publish error: {e}");
                    }
                }
            }
            _ = tokio::signal::ctrl_c() => {
                println!("Shutting down...");
                memory.save();
                break;
            }
            event = swarm.select_next_some() => match event {
                SwarmEvent::NewListenAddr { address, .. } => {
                    println!("Listening on {address}");
                }
                SwarmEvent::Behaviour(event) => match event {
                    MeshBehaviourEvent::Mdns(mdns::Event::Discovered(list)) => {
                        for (peer_id, addr) in list {
                            println!("Discovered peer {peer_id} at {addr}");
                            {
                                let mut p = peers.write().await;
                                p.insert(peer_id.to_string());
                            }
                            let _ = rust_to_gateway_tx.send(serde_json::json!({
                                "type": "discovery",
                                "nodeId": peer_id.to_string(),
                                "address": addr.to_string()
                            }));
                            swarm.behaviour_mut().kad.add_address(&peer_id, addr.clone());
                            if let Err(e) = swarm.dial(addr.with(Protocol::P2p(peer_id))) {
                                eprintln!("Dial error: {e}");
                            }
                        }
                    }
                    MeshBehaviourEvent::Gossipsub(gossipsub::Event::Message {
                        propagation_source: peer_id,
                        message,
                        ..
                    }) => {
                        if let Ok(sync_msg) = serde_json::from_slice::<SyncMessage>(&message.data) {
                            let _ = rust_to_gateway_tx.send(serde_json::to_value(&sync_msg).unwrap_or_default());
                            match sync_msg {
                                SyncMessage::MemorySync { delta, .. } => {
                                    println!("Received memory update from {peer_id:?}");
                                    if let Err(e) = memory.apply_update(delta) {
                                        eprintln!("Apply update failed: {e}");
                                    } else if let Some(text) = memory.get_text("note1") {
                                        println!("Current shared note1: {text}");
                                    }
                                },
                                SyncMessage::Query(q) => {
                                    println!("Received query from {peer_id:?}: {q}");
                                },
                                SyncMessage::Delegate { task_id, .. } => {
                                    println!("Received delegation request from {peer_id:?}: {task_id}");
                                }
                                _ => {}
                            }
                        }
                    }
                    MeshBehaviourEvent::Kad(kad::Event::OutboundQueryProgressed { result: kad::QueryResult::GetRecord(Ok(ok)), .. }) => {
                        println!("DHT record found: {:?}", ok);
                    }
                    MeshBehaviourEvent::Ping(ping::Event { peer, result, .. }) => {
                        println!("Ping to {peer}: {:?}", result);
                    }
                    MeshBehaviourEvent::Identify(identify::Event::Received { peer_id, info, .. }) => {
                        println!("Identified peer {peer_id}: {info:?}");
                    }
                    _ => {}
                }
                SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                    println!("Connected to {peer_id}");
                }
                _ => {}
            }
        }
    }
    Ok(())
}
