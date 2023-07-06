use citadel_workspace_types::InternalServicePayload;
use futures::SinkExt;
use tauri::State;
use uuid::Uuid;

use crate::structs::ConnectionState;

#[tauri::command]
pub async fn set_kv(
    uuid: String,
    cid: u64,
    peer_cid: Option<u64>,
    key: String,
    value: String,
    state: State<'_, ConnectionState>,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&uuid).unwrap();
    let payload = InternalServicePayload::LocalDBSetKV {
        uuid,
        cid,
        peer_cid,
        key,
        value: value.into_bytes(),
    };

    let _ = state
        .sink
        .lock()
        .await
        .as_mut()
        .unwrap()
        .send(bincode2::serialize(&payload).unwrap().into())
        .await;

    Ok(())
}
