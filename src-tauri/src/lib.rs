mod commands;
mod helpers;
mod structs;
use bytes::BytesMut;
use citadel_internal_service_connector::util::wrap_tcp_conn;
use citadel_internal_service_types::{InternalServiceResponse, ServiceConnectionAccepted};
use citadel_logging::{error, setup_log};
use commands::{
    connect::connect, disconnect::disconnect, get_session::get_sessions,
    list_all_peers::list_all_peers, message::message, peer_connect::peer_connect,
    peer_disconnect::peer_disconnect, peer_register::peer_register, register::register,
};
use futures::StreamExt;
use std::error::Error;
use std::time::Duration;
use structs::ConnectionState;
use tauri::{Manager, State};
use tokio::net::TcpStream;
use tokio::time::timeout;

fn send_response(
    packet_name: &str,
    packet: BytesMut,
    window: &tauri::Window,
) -> Result<(), Box<dyn Error>> {
    let _ = window.emit(
        packet_name,
        serde_json::to_string(&bincode2::deserialize::<InternalServiceResponse>(&packet)?)?,
    );
    Ok(())
}

#[tauri::command]
async fn open_tcp_conn(
    conn_state: State<'_, ConnectionState>,
    window: tauri::Window,
    addr: String,
) -> Result<ServiceConnectionAccepted, String> {
    let connection = TcpStream::connect(addr);

    match timeout(Duration::from_millis(3000), connection)
        .await
        .map_err(|err| err.to_string())?
    {
        Ok(conn) => {
            let framed = wrap_tcp_conn(conn);
            let (sink, mut stream) = framed.split();
            *conn_state.sink.lock().await = Some(sink);
            if let Some(greeter_packet) = stream.next().await {
                let packet = greeter_packet.map_err(|err| err.to_string())?;
                let packet = bincode2::deserialize::<InternalServiceResponse>(&packet)
                    .map_err(|err| err.to_string())?;

                if let InternalServiceResponse::ServiceConnectionAccepted(accepted) = packet {
                    let service_to_gui = async move {
                        while let Some(packet) = stream.next().await {
                            if let Ok(packet) = packet {
                                if let Err(e) = send_response("packet_stream", packet, &window) {
                                    error!(e)
                                }
                            }
                        }
                    };

                    tauri::async_runtime::spawn(service_to_gui);
                    Ok(accepted)
                } else {
                    error!("Wrong first packet type: {:?}", packet);
                    Err(format!("Wrong first packet type: {:?}", packet))
                }
            } else {
                error!("Stream died");
                Err("Stream died".to_string())
            }
        }
        Err(err) => Err(format!("Error: {err:?}")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ConnectionState {
            sink: Default::default(),
            stream: Default::default(),
        })
        .setup(|app| {
            setup_log();
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            connect,
            register,
            disconnect,
            message,
            get_sessions,
            open_tcp_conn,
            list_all_peers,
            peer_register,
            peer_connect,
            peer_disconnect,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
