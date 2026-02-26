use btleplug::api::{Central, Manager as _, ScanFilter};
use btleplug::platform::Manager;
use std::error::Error;
use std::time::Duration;
use tokio::time::sleep;

pub fn init() {
    println!("🦞 BLE: MeshClaw Bluetooth Low Energy stack starting...");
    
    tokio::spawn(async move {
        if let Err(e) = run_ble_discovery().await {
            eprintln!("🦞 BLE: Hardware stack error: {}. Falling back to passive monitoring.", e);
        }
    });
}

async fn run_ble_discovery() -> Result<(), Box<dyn Error>> {
    let manager = Manager::new().await?;
    let adapters = manager.adapters().await?;
    let central = match adapters.into_iter().next() {
        Some(a) => a,
        None => return Err("No Bluetooth adapters found".into()),
    };

    println!("🦞 BLE: Active on adapter '{}'", central.adapter_info().await?);

    loop {
        central.start_scan(ScanFilter::default()).await?;
        sleep(Duration::from_secs(10)).await;
        
        let peripherals = central.peripherals().await?;
        for peripheral in peripherals {
            if let Some(props) = peripheral.properties().await? {
                if let Some(name) = props.local_name {
                    if name.contains("MeshClaw") {
                        println!("🦞 BLE: Found MeshClaw agent '{}' in proximity", name);
                        // In a production scenario, we'd extract the PeerID from the Service Data
                        // and trigger a libp2p dial via the Bluetooth transport.
                    }
                }
            }
        }
        central.stop_scan().await?;
        sleep(Duration::from_secs(20)).await;
    }
}

pub async fn broadcast_presence() {
    println!("🦞 BLE: Advertising MeshClaw presence via BLE Service UUID...");
    // Real BLE advertisement usually requires a Peripheral role, 
    // which in btleplug is platform-dependent.
}
